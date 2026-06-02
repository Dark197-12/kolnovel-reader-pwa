import { NextRequest, NextResponse } from "next/server";
import { getChapterDetails, DEFAULT_BASE_URL } from "@/lib/scraper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const baseUrl = searchParams.get("baseUrl") || DEFAULT_BASE_URL;

  if (!slug) {
    return NextResponse.json({ error: "Slug parameter is required" }, { status: 400 });
  }

  try {
    const chapter = await getChapterDetails(slug, baseUrl);
    return NextResponse.json(chapter);
  } catch (error: any) {
    console.error(`Chapter API error for ${slug}:`, error);
    return NextResponse.json({ error: error.message || "Failed to load chapter content" }, { status: 500 });
  }
}
