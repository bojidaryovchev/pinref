"use server";

/**
 * User settings server actions
 */

import { revalidateTag } from "next/cache";
import { auth } from "../auth";
import { updateUserSettings } from "../lib/dynamodb";
import { UpdateUserSettingsInput } from "../schemas/user-settings.schema";

export async function updateUserSettingsAction(data: UpdateUserSettingsInput) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  try {
    await updateUserSettings(session.user.email, data);

    // Refresh cache
    revalidateTag("user-settings");

    return { success: true };
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw new Error("Failed to update user settings");
  }
}
