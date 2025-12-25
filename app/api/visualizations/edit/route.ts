import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database/mongodb";
import { VisualizationModel } from "@/lib/database/models";
import { VisualizationType } from "@/lib/types/visualization";
import { VisualizationGeneratorService } from "@/lib/services/visualization-generator";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { visualizationId, editPrompt, existingData, visualizationType } =
      await req.json();

    if (!visualizationId || !editPrompt || !existingData || !visualizationType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDatabase();

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

    // Generate updated visualization using AI
    const generatorService = new VisualizationGeneratorService();
    const updatedData = await generatorService.editVisualization(
      visualizationType as VisualizationType,
      existingData,
      editPrompt
    );

    // Update the visualization in the database
    existingVisualization.data = updatedData;
    existingVisualization.updatedAt = new Date();
    await existingVisualization.save();

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
