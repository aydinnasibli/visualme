"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database/mongodb";
import { UserExtendedNodesModel } from "@/lib/database/models";

/**
 * Get all extended nodes for the current user
 */
export async function getExtendedNodes(): Promise<string[]> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return [];
    }

    await connectToDatabase();
    const record = await UserExtendedNodesModel.findOne({ userId });

    return record?.extendedNodes || [];
  } catch (error) {
    console.error("Error fetching extended nodes:", error);
    return [];
  }
}

/**
 * Add a node to the extended nodes list
 */
export async function addExtendedNode(nodeId: string): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return false;
    }

    await connectToDatabase();

    // Use upsert to create if doesn't exist, or update if exists
    await UserExtendedNodesModel.findOneAndUpdate(
      { userId },
      {
        $addToSet: { extendedNodes: nodeId }, // $addToSet prevents duplicates
      },
      {
        upsert: true,
        new: true
      }
    );

    return true;
  } catch (error) {
    console.error("Error adding extended node:", error);
    return false;
  }
}

/**
 * Check if a node is extended
 */
export async function isNodeExtended(nodeId: string): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return false;
    }

    await connectToDatabase();
    const record = await UserExtendedNodesModel.findOne({
      userId,
      extendedNodes: nodeId
    });

    return !!record;
  } catch (error) {
    console.error("Error checking if node is extended:", error);
    return false;
  }
}

/**
 * Clear all extended nodes for the current user
 */
export async function clearExtendedNodes(): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return false;
    }

    await connectToDatabase();
    await UserExtendedNodesModel.findOneAndUpdate(
      { userId },
      { extendedNodes: [] },
      { upsert: true }
    );

    return true;
  } catch (error) {
    console.error("Error clearing extended nodes:", error);
    return false;
  }
}
