import { auth } from "@/auth";
import { createCategory, getUserCategories } from "@/lib/dynamodb";
import { encryptCategoryData } from "@/lib/encryption";
import { createCategorySchema } from "@/schemas/category.schema";

import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await getUserCategories(session.user.email);

    // Add bookmark count (would need separate query in real implementation)
    const categoriesWithCount = categories.map((category) => ({
      ...category,
      _count: { bookmarks: 0 }, // Placeholder - implement actual counting
    }));

    return NextResponse.json(categoriesWithCount);
  } catch (error) {
    console.error("Error fetching categories:", error);
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
    const { name, icon, color } = createCategorySchema.parse(body);

    // Encrypt sensitive data
    const encryptedData = encryptCategoryData({ name });

    const categoryId = uuidv4();

    const category = await createCategory({
      id: categoryId,
      userId: session.user.email,
      name: encryptedData.name,
      icon,
      color,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

