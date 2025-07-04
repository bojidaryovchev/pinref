import { fetchCategoriesData } from "@/API";
import { createCategoryAction } from "@/actions";
import { createCategorySchema } from "@/schemas/category.schema";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  try {
    const categories = await fetchCategoriesData();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createCategorySchema.parse(body);

    const result = await createCategoryAction(data);
    return NextResponse.json(result.category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

