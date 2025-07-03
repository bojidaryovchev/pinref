import { authOptions } from "@/lib/auth";
import { deleteCategory, getCategoryById, updateCategory } from "@/lib/dynamodb";
import { encryptCategoryData, decryptCategoryData } from "@/lib/encryption";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
});

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const category = await getCategoryById(id);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Verify the category belongs to the current user
    const categoryData = category as { userId?: string; name?: string };
    if (categoryData.userId !== session.user.email) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Decrypt sensitive data before returning
    if (categoryData.name) {
      categoryData.name = decryptCategoryData({ name: categoryData.name }).name;
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the category exists and belongs to the current user
    const existingCategory = await getCategoryById(id);
    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const categoryData = existingCategory as { userId?: string };
    if (categoryData.userId !== session.user.email) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData = updateCategorySchema.parse(body);

    // Encrypt sensitive data if name is being updated
    const processedData = updateData.name 
      ? { ...updateData, name: encryptCategoryData({ name: updateData.name }).name }
      : updateData;

    const updatedCategory = await updateCategory(id, processedData);

    // Decrypt name before returning response
    const responseData = { ...updatedCategory } as { name?: string };
    if (responseData.name) {
      responseData.name = decryptCategoryData({ name: responseData.name }).name;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error updating category:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: error.errors 
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the category exists and belongs to the current user
    const existingCategory = await getCategoryById(id);
    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const categoryData = existingCategory as { userId?: string };
    if (categoryData.userId !== session.user.email) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    await deleteCategory(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
