import { NextRequest, NextResponse } from "next/server";
import { searchNovels, DEFAULT_BASE_URL } from "@/lib/scraper";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const baseUrl = searchParams.get("baseUrl") || DEFAULT_BASE_URL;

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  try {
    const novels = await searchNovels(query, baseUrl);
    return NextResponse.json({ novels });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: error.message || "Failed to search novels" }, { status: 500 });
  }
}
