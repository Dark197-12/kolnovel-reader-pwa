import * as cheerio from "cheerio";

// Default base URL for Kolnovel
export const DEFAULT_BASE_URL = "https://kolnovel.com";

/**
 * Clean up text content by removing ads, promotional text, and extraneous whitespace.
 */
function cleanText(text: string): string {
  if (!text) return "";
  
  let cleaned = text.trim();
  
  // List of common promotional text patterns in Arabic translations to strip out
  const promotionalPatterns = [
    /قراءة ممتعة/gi,
    /ملوك الروايات/gi,
    /kolnovel/gi,
    /kol-novel/gi,
    /ادعمنا بمشاركة الرواية/gi,
    /تابعنا على/gi,
    /انضم لقروب التليجرام/gi,
    /رابط قناة/gi,
    /موقع ملوك الروايات/gi
  ];
  
  for (const pattern of promotionalPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }
  
  return cleaned.trim();
}

/**
 * Fetch HTML page with a spoofed user agent to avoid basic blocks.
 */
async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
      "Accept-Language": "ar,en;q=0.9",
      "Cache-Control": "no-cache",
      Pragma: "no-cache"
    },
    next: { revalidate: 300 } // Cache for 5 minutes
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.statusText} (${response.status})`);
  }
  
  return response.text();
}

/**
 * Search novels by query string.
 */
export async function searchNovels(query: string, baseUrl: string = DEFAULT_BASE_URL) {
  // Format search URL. Usually WordPress searches with ?s=
  const searchUrl = `${baseUrl}/?s=${encodeURIComponent(query)}&post_type=novel`;
  
  try {
    const html = await fetchPage(searchUrl);
    const $ = cheerio.load(html);
    const novels: any[] = [];
    
    // Themesia search results typical wrapper: .listupd .bs, or .listupd .utd
    $(".listupd .bs, .listupd .utd, .search-item, .bsx").each((_, element) => {
      const el = $(element);
      
      // Get the link and title
      const linkEl = el.find("a").first();
      const href = linkEl.attr("href") || "";
      const title = el.find(".tt, h2, .entry-title, a").first().text().trim() || linkEl.attr("title")?.trim() || "";
      
      // Cover image
      const imgEl = el.find("img").first();
      const cover = imgEl.attr("src") || imgEl.attr("data-src") || "";
      
      // Extract slug from href (e.g. https://kolnovel.com/series/demon-emperor/ -> demon-emperor)
      let slug = href;
      if (href) {
        const parts = href.replace(/\/$/, "").split("/");
        slug = parts[parts.length - 1];
      }
      
      if (slug && title) {
        novels.push({
          title: cleanText(title),
          slug,
          cover,
          latestChapter: el.find(".epxs, .ep").first().text().trim()
        });
      }
    });
    
    return novels;
  } catch (error) {
    console.error("Error in searchNovels scraper:", error);
    throw error;
  }
}

/**
 * Fetch and parse novel details and chapter list.
 */
export async function getNovelDetails(slug: string, baseUrl: string = DEFAULT_BASE_URL) {
  // Themesia uses /series/slug/ or /novel/slug/. Let's try series/ first, fallback to direct slug.
  const urlsToTry = [
    `${baseUrl}/series/${slug}/`,
    `${baseUrl}/novel/${slug}/`,
    `${baseUrl}/${slug}/`
  ];
  
  let html = "";
  let successUrl = "";
  
  for (const url of urlsToTry) {
    try {
      html = await fetchPage(url);
      successUrl = url;
      break;
    } catch (e) {
      console.warn(`Failed fetching details from ${url}, trying next...`);
    }
  }
  
  if (!html) {
    throw new Error(`Could not load details for slug: ${slug}`);
  }
  
  const $ = cheerio.load(html);
  
  // Title
  const title = $(".series-title, h1.entry-title, .title-novel").first().text().trim();
  
  // Cover
  const cover = $(".thumb img, .series-thumb img, .series-image img").first().attr("src") || 
                $(".thumb img, .series-thumb img, .series-image img").first().attr("data-src") || "";
  
  // Synopsis / Description
  const descriptionHtml = $(".entry-content, .series-synopsis, .desc, .summary-text").first().html() || "";
  const descriptionText = $(".entry-content, .series-synopsis, .desc, .summary-text").first().text().trim();
  
  // Metadata extraction (Status, Author, Genres, Type)
  let status = "";
  let author = "";
  const genres: string[] = [];
  
  $(".genres a, .sertab a, .serinfo ul li a").each((_, el) => {
    const text = $(el).text().trim();
    if (text && !genres.includes(text)) {
      genres.push(text);
    }
  });
  
  // Parse key-value lists in details (like Author: X, Status: Y)
  $(".serinfo ul li, .novel-info-item, .post-content li").each((_, el) => {
    const text = $(el).text().toLowerCase();
    const rawText = $(el).text().trim();
    if (text.includes("author") || text.includes("المؤلف")) {
      author = rawText.split(/[:：]/)[1]?.trim() || rawText;
    } else if (text.includes("status") || text.includes("الحالة")) {
      status = rawText.split(/[:：]/)[1]?.trim() || rawText;
    }
  });
  
  // Fallbacks if not found
  if (!status) {
    status = $(".status").text().trim();
  }
  if (!author) {
    author = $(".author").text().trim() || $(".writer").text().trim();
  }
  
  // Chapters list
  // Typical structure: .clist ul li, or .eplister ul li
  const chapters: any[] = [];
  
  $(".clist ul li, .eplister ul li, .chapter-list ul li, ul li").each((_, element) => {
    const el = $(element);
    const linkEl = el.find("a").first();
    const href = linkEl.attr("href") || "";

    // This site uses URLs like /shaag24{novel-slug}z435ggye-{id}/
    // Extract the full path segment as the slug
    let chapterSlug = "";
    if (href) {
      const parts = href.replace(/\/$/, "").split("/");
      chapterSlug = parts[parts.length - 1];
    }

    const numText = el.find(".epl-num, .chapnum, .chapter-number").first().text().trim();
    const titleText = el.find(".epl-title, .chaptitle, .chapter-title").first().text().trim();
    const dateText = el.find(".epl-date, .chapdate, .chapter-date").first().text().trim();

    const chapterName = numText && titleText
      ? `${numText}: ${titleText}`
      : (numText || titleText || linkEl.text().trim());

    // Only accept slugs that match the kolnovel chapter URL pattern
    if (chapterSlug && chapterSlug.includes("shaag24") && chapterName) {
      chapters.push({
        name: cleanText(chapterName),
        slug: chapterSlug,
        date: dateText
      });
    }
  });
  
  // Sort chapters so they are in reading order (usually site lists them newest first, so we reverse it)
  // Or we can keep them in the original order and let the client handle it, but we will return the list as is.
  return {
    title: cleanText(title),
    slug,
    cover,
    description: descriptionText,
    descriptionHtml,
    author: cleanText(author),
    status: cleanText(status),
    genres,
    chapters
  };
}

/**
 * Fetch and parse chapter reader page.
 */
export async function getChapterDetails(slug: string, baseUrl: string = DEFAULT_BASE_URL) {
  // URLs to try. Sometimes chapters are direct, sometimes prefixed
  const urlsToTry = [
    `https://free.kolnovel.com/${slug}/`,
    `${baseUrl}/${slug}/`,
    `${baseUrl}/novel/${slug}/`,
  ];
  
  let html = "";
  
  for (const url of urlsToTry) {
    try {
      html = await fetchPage(url);
      break;
    } catch (e) {
      console.warn(`Failed fetching chapter from ${url}, trying next...`);
    }
  }
  
  if (!html) {
    throw new Error(`Could not load chapter content for slug: ${slug}`);
  }
  
  const $ = cheerio.load(html);
  
  // Title
  const title = $("h1.entry-title, .chapter-title, .ep-title").first().text().trim();
  
  // Content parser
  // Look for .epcontent, .epcontent-reading, or .reading-content
  const contentWrapper = $(".epcontent, .epcontent-reading, .reading-content, .entry-content").first();

  const paragraphs: any[] = [];

  contentWrapper.find("p, img").each((_, el) => {
    const tag = el.tagName?.toLowerCase();

    if (tag === "img") {
      // It's an image — grab src
      const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src") || "";
      if (src && !src.includes("data:image")) {
        paragraphs.push({ type: "image", src });
      }
      return;
    }

    // It's a <p> — skip if it contains child images (handled above)
    if ($(el).find("img").length > 0) {
      $(el).find("img").each((_, imgEl) => {
        const src = $(imgEl).attr("src") || $(imgEl).attr("data-src") || "";
        if (src && !src.includes("data:image")) {
          paragraphs.push({ type: "image", src });
        }
      });
      return;
    }

    const text = $(el).text().trim();

    // Strip ad scripts and junk
    if (
      !text ||
      text.length < 3 ||
      text.startsWith("window.") ||
      text.includes("pubfuturetag") ||
      text.includes("function(") ||
      text.includes("var ") ||
      text.match(/^\d{5,}$/) ||        // pure number spam like 111111111
      text.startsWith("http")
    ) return;

    const cleaned = cleanText(text);
    if (cleaned && cleaned.length > 3) {
      paragraphs.push({ type: "text", content: cleaned });
    }
  });
  
  // Fallback: If no paragraphs found, split the raw html by break lines
  if (paragraphs.length === 0) {
    const rawText = contentWrapper.text();
    rawText.split("\n").forEach(line => {
      const cleaned = cleanText(line);
      if (cleaned && cleaned.length > 3) {
        paragraphs.push(cleaned);
      }
    });
  }
  
  // Find next/prev chapter links if they exist on the page to help with navigation
  let nextChapterSlug = "";
  let prevChapterSlug = "";
  
  $(".nextprev a, .nav-links a, .chapter-navigation a, a[rel='next'], a[rel='prev']").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().toLowerCase();
    const rel = $(el).attr("rel") || "";
    
    let targetSlug = "";
    if (href) {
      const parts = href.replace(/\/$/, "").split("/");
      targetSlug = parts[parts.length - 1];
    }
    
    if (targetSlug) {
      if (text.includes("next") || text.includes("التالي") || rel === "next") {
        nextChapterSlug = targetSlug;
      } else if (text.includes("prev") || text.includes("السابق") || rel === "prev") {
        prevChapterSlug = targetSlug;
      }
    }
  });
  
  return {
    title: cleanText(title),
    slug,
    paragraphs,
    nextChapterSlug,
    prevChapterSlug
  };
}
