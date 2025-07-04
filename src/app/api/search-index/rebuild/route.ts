import { rebuildSearchIndexAction } from "@/actions";

import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await rebuildSearchIndexAction();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in rebuild search index route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

