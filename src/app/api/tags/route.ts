import { auth } from "@/auth";
import { createTag, getUserTags } from "@/lib/dynamodb";
import { createTagSchema } from "@/schemas/tag.schema";

import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tags = await getUserTags(session.user.email);

    // Add bookmark count (would need separate query in real implementation)
    const tagsWithCount = tags.map((tag) => ({
      ...tag,
      _count: { bookmarks: 0 }, // Placeholder - implement actual counting
    }));

    return NextResponse.json(tagsWithCount);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = createTagSchema.parse(body);

    const tagId = uuidv4();

    const tag = await createTag({
      id: tagId,
      userId: session.user.email,
      name,
      icon: "🏷️", // Default icon
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

