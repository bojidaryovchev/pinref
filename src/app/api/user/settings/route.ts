import { auth } from "@/auth";
import { getUserSettings, updateUserSettings } from "@/lib/dynamodb";
import { updateUserSettingsSchema } from "@/schemas/user-settings.schema";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET /api/user/settings
 * Retrieves the current user's settings
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user settings
    const settings = await getUserSettings(session.user.email);

    // If settings don't exist, return defaults
    if (!settings) {
      return NextResponse.json({
        theme: "system",
        defaultView: "grid",
        bookmarksPerPage: 20,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/user/settings
 * Updates the current user's settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updateData = updateUserSettingsSchema.parse(body);

    // Update the settings
    const updatedSettings = await updateUserSettings(session.user.email, updateData);

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating user settings:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

