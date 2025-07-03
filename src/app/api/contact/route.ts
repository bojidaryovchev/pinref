import { sendContactFormEmail } from "@/lib/email";
import { contactFormSchema } from "@/schemas/contact.schema";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = contactFormSchema.parse(body);

    await sendContactFormEmail({ name, email, message });

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending contact form email:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
