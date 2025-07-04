import { fetchTagsData } from "@/API";
import { createTagAction } from "@/actions";
import { createTagSchema } from "@/schemas/tag.schema";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  try {
    const tags = await fetchTagsData();
    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createTagSchema.parse(body);

    const result = await createTagAction(data);
    return NextResponse.json(result.tag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
