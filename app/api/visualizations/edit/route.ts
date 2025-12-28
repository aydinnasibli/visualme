import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database/mongodb";
import { VisualizationModel, UserUsageModel } from "@/lib/database/models";
import { VisualizationType } from "@/lib/types/visualization";
import { VisualizationGeneratorService } from "@/lib/services/visualization-generator";
import { checkTokenBalance, deductTokens } from "@/lib/utils/tokens";
import { TOKEN_COSTS } from "@/lib/utils/validation";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { visualizationId, editPrompt, existingData, visualizationType, messages } =
      await req.json();

    if (!editPrompt || !existingData || !visualizationType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // TOKEN SYSTEM: Check if user has enough tokens for an edit
    // Using a lower cost for edits compared to generation
    const editCost = TOKEN_COSTS.EXPAND_NODE || 1;
    const tokenCheck = await checkTokenBalance(userId, editCost);

    if (!tokenCheck.allowed) {
      return NextResponse.json(
        { error: tokenCheck.error || "Insufficient tokens" },
        { status: 402 }
      );
    }

    // Prepare history and target for update
    let history: any[] = messages || [];
    let existingVisualization: any = null;

    // If visualizationId is provided, verify ownership and get history from DB
    if (visualizationId) {
      existingVisualization = await VisualizationModel.findById(visualizationId);

      if (!existingVisualization) {
        return NextResponse.json(
          { error: "Visualization not found" },
          { status: 404 }
        );
      }

      if (existingVisualization.userId !== userId) {
        return NextResponse.json(
          { error: "You don't have permission to edit this visualization" },
          { status: 403 }
        );
      }

      // Use history from DB if available, falling back to request messages if empty
      // Note: Request messages might contain the *new* user message already,
      // but `editVisualization` service takes history as context (previous messages).
      // We should be careful not to duplicate.
      history = existingVisualization.history || [];
    }

    // Generate updated visualization using AI
    const generatorService = new VisualizationGeneratorService();
    const updatedData = await generatorService.editVisualization(
      visualizationType as VisualizationType,
      existingData,
      editPrompt,
      history
    );

    // If it's a saved visualization, update it in the database
    if (existingVisualization) {
      existingVisualization.data = updatedData;
      existingVisualization.updatedAt = new Date();

      // Append new interaction to history
      existingVisualization.history = [
        ...history,
        { role: 'user', content: editPrompt, timestamp: new Date() },
        { role: 'assistant', content: 'Visualization updated successfully.', timestamp: new Date() }
      ];

      await existingVisualization.save();
    }

    // TOKEN SYSTEM: Deduct tokens
    await deductTokens(userId, editCost);

    // Track usage
    await UserUsageModel.updateOne(
        { userId },
        { $inc: { visualizationsCreated: 1 } }
    );

    if (existingVisualization) {
      return NextResponse.json({
        success: true,
        visualization: {
          ...existingVisualization.toObject(),
          _id: existingVisualization._id.toString(),
          id: existingVisualization._id.toString(),
        },
      });
    } else {
      // Return a temporary visualization object for draft mode
      return NextResponse.json({
        success: true,
        visualization: {
          data: updatedData,
          type: visualizationType,
          // We return null ID to indicate it's still a draft
          _id: null,
          id: null,
        },
      });
    }
  } catch (error) {
    console.error("Error editing visualization:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to edit visualization",
      },
      { status: 500 }
    );
  }
}
