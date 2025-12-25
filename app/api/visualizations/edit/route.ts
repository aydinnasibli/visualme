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

    if (!visualizationId || !editPrompt || !existingData || !visualizationType) {
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

    // Verify the visualization belongs to the user
    const existingVisualization = await VisualizationModel.findById(visualizationId);

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

    // Get previous history from the database or the request
    const history = existingVisualization.history || [];

    // Generate updated visualization using AI
    const generatorService = new VisualizationGeneratorService();
    const updatedData = await generatorService.editVisualization(
      visualizationType as VisualizationType,
      existingData,
      editPrompt,
      history
    );

    // Update the visualization in the database
    existingVisualization.data = updatedData;
    existingVisualization.updatedAt = new Date();

    // Append new interaction to history
    existingVisualization.history = [
      ...history,
      { role: 'user', content: editPrompt, timestamp: new Date() },
      { role: 'assistant', content: 'Visualization updated successfully.', timestamp: new Date() }
    ];

    await existingVisualization.save();

    // TOKEN SYSTEM: Deduct tokens
    await deductTokens(userId, editCost);

    // Track usage
    await UserUsageModel.updateOne(
        { userId },
        { $inc: { visualizationsCreated: 1 } }
    );

    return NextResponse.json({
      success: true,
      visualization: {
        ...existingVisualization.toObject(),
        _id: existingVisualization._id.toString(),
        id: existingVisualization._id.toString(),
      },
    });
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
