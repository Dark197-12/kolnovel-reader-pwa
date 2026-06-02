import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const order = searchParams.get("order") || "modified";

  // Map our order param to WP REST API params
  const orderby = order === "popular" ? "meta_value_num" : "modified";

  try {
    const url = `https://free.kolnovel.com/wp-json/wp/v2/novel?per_page=24&page=${page}&orderby=${orderby}&order=desc&_fields=id,title,slug,featured_media,meta,link`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15",
        "Accept": "application/json",
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) throw new Error(`WP API error: ${response.status}`);

    const posts = await response.json();

    // Fetch media (cover images) for all novels in parallel
    const novels = await Promise.all(
      posts.map(async (post: any) => {
        let cover = "";
        if (post.featured_media) {
          try {
            const mediaRes = await fetch(
              `https://free.kolnovel.com/wp-json/wp/v2/media/${post.featured_media}?_fields=source_url`,
              { next: { revalidate: 3600 } }
            );
            if (mediaRes.ok) {
              const media = await mediaRes.json();
              cover = media.source_url || "";
            }
          } catch {}
        }

        // Extract slug from link URL
        const slug = post.slug || post.link?.replace(/\/$/, "").split("/").pop() || "";

        return {
          title: post.title?.rendered?.replace(/&#\d+;/g, (m: string) => String.fromCharCode(parseInt(m.slice(2, -1)))) || "",
          slug,
          cover,
          rating: post.meta?.["_manga_score"] || "",
          latestChapter: ""
        };
      })
    );

    return NextResponse.json({ novels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}