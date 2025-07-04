import { deleteCategoryAction, updateCategoryAction } from "@/actions";
import { getCategoryById } from "@/lib/dynamodb";
import { decryptCategoryData } from "@/lib/encryption";
import { updateCategorySchema } from "@/schemas/category.schema";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const category = await getCategoryById(id);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Decrypt sensitive data before returning
    const categoryData = category as { name?: string };
    if (categoryData.name) {
      const decryptedData = decryptCategoryData({ name: categoryData.name });
      return NextResponse.json({ ...category, ...decryptedData });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData = updateCategorySchema.parse(body);

    await updateCategoryAction(id, updateData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating category:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteCategoryAction(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
