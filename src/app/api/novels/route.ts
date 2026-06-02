import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const order = searchParams.get("order") || "update";

  try {
    // Homepage has editor picks + trending — both server-rendered with full data
    const url = order === "popular"
      ? "https://free.kolnovel.com/"
      : "https://free.kolnovel.com/series/?status=&type=&order=update";

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ar,en;q=0.9",
        "Referer": "https://free.kolnovel.com/",
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) throw new Error(`Fetch error: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);
    const novels: any[] = [];
    const seen = new Set<string>();

    // Homepage: editor picks use .bixbox .bs structure with img title rating
    $(".bixbox .bs, .bixbox .bsx, .postbody .bs, .postbody .bsx").each((_, element) => {
      const el = $(element);
      const linkEl = el.find("a").first();
      const href = linkEl.attr("href") || "";
      const title = el.find(".tt").first().text().trim()
        || linkEl.attr("title")?.trim()
        || el.find("h2, h3").first().text().trim()
        || "";
      const imgEl = el.find("img").first();
      const cover = imgEl.attr("src") || imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || "";
      const rating = el.find(".numscore, .score").first().text().trim();

      let slug = "";
      if (href) {
        // Extract from /series/slug/ pattern
        const match = href.match(/\/series\/([^/]+)\/?$/);
        if (match) slug = match[1];
        else slug = href.replace(/\/$/, "").split("/").pop() || "";
      }

      if (slug && title && !seen.has(slug)) {
        seen.add(slug);
        novels.push({ title, slug, cover, rating, latestChapter: "" });
      }
    });

    // Also grab trending sidebar items
    $(".serieslist.pop ul li, .ranking .bs, .wpop .bs").each((_, element) => {
      const el = $(element);
      const linkEl = el.find("a").first();
      const href = linkEl.attr("href") || "";
      const title = el.find(".tt, h2, h3, .series-title").first().text().trim()
        || linkEl.attr("title")?.trim() || "";
      const imgEl = el.find("img").first();
      const cover = imgEl.attr("src") || imgEl.attr("data-src") || "";
      const rating = el.find(".numscore, .score, .rating").first().text().trim();

      let slug = "";
      if (href) {
        const match = href.match(/\/series\/([^/]+)\/?$/);
        if (match) slug = match[1];
        else slug = href.replace(/\/$/, "").split("/").pop() || "";
      }

      if (slug && title && !seen.has(slug)) {
        seen.add(slug);
        novels.push({ title, slug, cover, rating, latestChapter: "" });
      }
    });

    return NextResponse.json({ novels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}