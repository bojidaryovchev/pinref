import { fetchUserSettingsData } from "@/API";
import { updateUserSettingsAction } from "@/actions";
import { updateUserSettingsSchema } from "@/schemas/user-settings.schema";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET /api/user/settings
 * Retrieves the current user's settings
 */
export async function GET() {
  try {
    const settings = await fetchUserSettingsData();
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
    const body = await request.json();
    const updateData = updateUserSettingsSchema.parse(body);

    const result = await updateUserSettingsAction(updateData);
    return NextResponse.json(result);
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

