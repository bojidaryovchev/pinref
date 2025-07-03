import { authOptions } from "@/lib/auth";
import { rebuildSearchIndex } from "@/lib/dynamodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rebuild the search index for the authenticated user
    const result = await rebuildSearchIndex(session.user.email);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Rebuilt search index for ${result.count} bookmarks`,
        count: result.count,
      });
    } else {
      return NextResponse.json({ error: "Failed to rebuild search index" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in rebuild search index route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
