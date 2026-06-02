import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "ar,en;q=0.9",
    },
    next: { revalidate: 300 }
  });
  if (!response.ok) throw new Error(`Fetch error: ${response.status}`);
  return response.text();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const order = searchParams.get("order") || "update";
  const page = searchParams.get("page") || "1";

  const orderMap: Record<string, string> = {
    update: "update",
    popular: "popular",
    rating: "rating",
    new: "latest",
  };

  const orderParam = orderMap[order] || "update";
  const url = `https://free.kolnovel.com/series/?status=&type=&order=${orderParam}&page=${page}`;

  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const novels: any[] = [];

    // The series page renders each novel as: img link, genre links, h2 title link, description, rating, latest chapter link
    // They are in .postbody or main content area as a list
    $("article, .bsx, .bs, .listupd > div, .postbody .utao").each((_, element) => {
      const el = $(element);
      const linkEl = el.find("a").first();
      const href = linkEl.attr("href") || "";
      const imgEl = el.find("img").first();
      const cover = imgEl.attr("src") || imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || "";
      const title = el.find("h2, h3, .tt").first().text().trim() || linkEl.attr("title") || "";
      const rating = el.find(".numscore, .score").first().text().trim();
      const latestChapter = el.find("a").last().text().trim();

      let slug = "";
      if (href) {
        const match = href.match(/\/series\/([^/]+)\/?/);
        if (match) slug = match[1];
      }

      if (slug && title) {
        novels.push({ title, slug, cover, rating, latestChapter });
      }
    });

    // Fallback: parse the markdown-style list we see in the HTML
    // Each novel block starts with an img link then h2 then rating
    if (novels.length === 0) {
      const links = $("a[href*='/series/']");
      const seen = new Set<string>();

      links.each((_, el) => {
        const href = $(el).attr("href") || "";
        const match = href.match(/\/series\/([^/]+)\/?$/);
        if (!match) return;
        const slug = match[1];
        if (seen.has(slug)) return;
        seen.add(slug);

        const imgEl = $(el).find("img").first();
        const cover = imgEl.attr("src") || imgEl.attr("data-src") || "";
        const title = $(el).attr("title") || $(el).text().trim() || "";

        if (slug && title && cover) {
          novels.push({ title, slug, cover, rating: "", latestChapter: "" });
        }
      });
    }

    return NextResponse.json({ novels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}