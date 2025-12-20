"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database/mongodb";
import { UserModel } from "@/lib/database/models";

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
    const user = await UserModel.findOrCreate(userId);

    return user?.extendedNodes || [];
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
    const user = await UserModel.findOrCreate(userId);

    if (!user.extendedNodes.includes(nodeId)) {
      user.extendedNodes.push(nodeId);
      await user.save();
    }

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
    const user = await UserModel.findOne({
      clerkId: userId,
      extendedNodes: nodeId
    });

    return !!user;
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
    const user = await UserModel.findOrCreate(userId);
    user.extendedNodes = [];
    await user.save();

    return true;
  } catch (error) {
    console.error("Error clearing extended nodes:", error);
    return false;
  }
}
