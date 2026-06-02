import { NextRequest, NextResponse } from "next/server";
import { getNovelDetails, DEFAULT_BASE_URL } from "@/lib/scraper";

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
    const details = await getNovelDetails(slug, baseUrl);
    return NextResponse.json(details);
  } catch (error: any) {
    console.error(`Novel API error for ${slug}:`, error);
    return NextResponse.json({ error: error.message || "Failed to load novel details" }, { status: 500 });
  }
}
