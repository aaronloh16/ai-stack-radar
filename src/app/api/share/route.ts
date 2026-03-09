import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sharedStacks } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { isSharedArchitectureResult } from "@/lib/architecture";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const prompt =
      typeof (body as { prompt?: unknown })?.prompt === "string"
        ? (body as { prompt: string }).prompt.trim()
        : "";
    const result = (body as { result?: unknown })?.result;

    if (!prompt || prompt.length > 2000 || !isSharedArchitectureResult(result)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const id = nanoid(10);

    await db.insert(sharedStacks).values({
      id,
      prompt,
      result,
    });

    return NextResponse.json({ id, url: `/stack/${id}` });
  } catch (error) {
    console.error("Share API error:", error);
    return NextResponse.json({ error: "Failed to save stack" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  try {
    const [stack] = await db
      .select()
      .from(sharedStacks)
      .where(eq(sharedStacks.id, id))
      .limit(1);

    if (!stack) {
      return NextResponse.json({ error: "Stack not found" }, { status: 404 });
    }

    return NextResponse.json(stack);
  } catch (error) {
    console.error("Share GET error:", error);
    return NextResponse.json({ error: "Failed to fetch stack" }, { status: 500 });
  }
}
