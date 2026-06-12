"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database/mongodb";
import { UserModel } from "@/lib/database/models";

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
