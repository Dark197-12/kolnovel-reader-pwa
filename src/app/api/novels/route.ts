import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const order = searchParams.get("order") || "update";
  const baseUrl = searchParams.get("baseUrl") || "https://free.kolnovel.com";

  try {
    const url = `${baseUrl}/series/?status=&type=&order=${order}&page=${page}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
        "Accept-Language": "ar,en;q=0.9",
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);
    const novels: any[] = [];

    $(".listupd .bsx, .listupd .bs").each((_, element) => {
      const el = $(element);
      const linkEl = el.find("a").first();
      const href = linkEl.attr("href") || "";
      const title = el.find(".tt").first().text().trim() || linkEl.attr("title")?.trim() || "";
      const imgEl = el.find("img").first();
      const cover = imgEl.attr("src") || imgEl.attr("data-src") || "";
      const rating = el.find(".numscore").first().text().trim();
      const latestChapter = el.find(".epxs").first().text().trim();

      let slug = href;
      if (href) {
        const parts = href.replace(/\/$/, "").split("/");
        slug = parts[parts.length - 1];
      }

      if (slug && title) {
        novels.push({ title, slug, cover, rating, latestChapter });
      }
    });

    return NextResponse.json({ novels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}