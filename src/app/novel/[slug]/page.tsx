"use client";
import { getReadChapters } from "@/lib/storage";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Heart, SortAsc, SortDesc, Calendar } from "lucide-react";
import { 
  getSavedBaseUrl, 
  isNovelBookmarked, 
  toggleBookmark, 
  getReadingProgress, 
  ReadingProgress 
} from "@/lib/storage";

export default function NovelDetailsPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const router = useRouter();
  const { slug } = use(params);

  const [loading, setLoading] = useState(true);
  const [novel, setNovel] = useState<any>(null);
  const [error, setError] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [sortAsc, setSortAsc] = useState(true); // Default to ascending order (older first)
  const [baseUrl, setBaseUrl] = useState("https://kolnovel.com");

  useEffect(() => {
    const savedUrl = getSavedBaseUrl();
    setBaseUrl(savedUrl);
    setIsBookmarked(isNovelBookmarked(slug));
    setProgress(getReadingProgress(slug));
    
    const fetchNovelDetails = async () => {
      try {
        const response = await fetch(`/api/novel/${slug}?baseUrl=${encodeURIComponent(savedUrl)}`);
        if (!response.ok) {
          throw new Error("فشل في تحميل تفاصيل الرواية من الخادم.");
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        setNovel(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "حدث خطأ أثناء تحميل تفاصيل الرواية. تأكد من أن الموقع يعمل والنطاق صحيح.");
      } finally {
        setLoading(false);
      }
    };

    fetchNovelDetails();
  }, [slug]);

  const handleBookmarkToggle = () => {
    if (!novel) return;
    const bookmarked = toggleBookmark({
      slug,
      title: novel.title,
      cover: novel.cover
    });
    setIsBookmarked(bookmarked);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--bg-color)" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--border-color)", borderTopColor: "var(--accent-color)", animation: "spin 1s linear infinite", marginBottom: "12px" }}></div>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>جاري تحميل الفصول والبيانات...</span>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !novel) {
    return (
      <div style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh", padding: "24px", color: "var(--text-primary)" }}>
        <header className="app-header" style={{ position: "static", padding: 0, border: "none", boxShadow: "none" }}>
          <button onClick={() => router.back()} className="btn btn-secondary btn-icon" style={{ backgroundColor: "transparent" }}>
            <ArrowRight size={22} />
          </button>
        </header>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center" }}>
          <div style={{ padding: "16px", borderRadius: "50%", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", color: "hsl(0, 84%, 75%)", marginBottom: "16px" }}>
            <ArrowRight size={32} style={{ transform: "rotate(180deg)" }} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "8px" }}>تعذر العثور على الرواية</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "300px", lineHeight: "1.6", marginBottom: "20px" }}>{error || "الرواية المطلوبة غير متوفرة حالياً أو أن النطاق المسجل بحاجة للتحديث."}</p>
          <button onClick={() => router.back()} className="btn btn-primary">العودة للخلف</button>
        </div>
      </div>
    );
  }

  // Handle Sorting
  const sortedChapters = sortAsc 
    ? [...novel.chapters].reverse() // If API returns newest first, reverse it to get oldest first
    : [...novel.chapters]; // Keep newest first

  // Start/Resume reading target slug
  const readChapters = getReadChapters(slug);
  const readingTargetSlug = progress 
    ? progress.chapterSlug 
    : (novel.chapters.length > 0 ? novel.chapters[novel.chapters.length - 1].slug : ""); // Index length-1 is oldest in Themesia list

  return (
    <main className="animate-fade-in" style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh", paddingBottom: "40px" }}>
      {/* Detail Page Header */}
      <header className="app-header" style={{ position: "sticky" }}>
        <button onClick={() => router.back()} className="btn btn-secondary btn-icon" style={{ backgroundColor: "transparent", border: "none" }}>
          <ArrowRight size={22} />
        </button>
        <button 
          onClick={handleBookmarkToggle} 
          className="btn btn-secondary btn-icon" 
          style={{ 
            backgroundColor: "transparent", 
            border: "none", 
            color: isBookmarked ? "hsl(350, 85%, 60%)" : "var(--text-secondary)" 
          }}
        >
          <Heart size={22} style={{ fill: isBookmarked ? "currentColor" : "none" }} />
        </button>
      </header>

      {/* Main Info section */}
      <section style={{ padding: "20px 16px", background: "linear-gradient(to bottom, var(--bg-surface), var(--bg-color))" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
          {/* Cover Photo */}
          <div 
            style={{ 
              width: "120px", 
              aspectRatio: "2/3", 
              borderRadius: "12px", 
              overflow: "hidden", 
              border: "1px solid var(--border-color)",
              boxShadow: "0 8px 24px var(--shadow-color)",
              flexShrink: 0
            }}
          >
            {novel.cover ? (
              <img src={novel.cover} alt={novel.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-surface)", color: "var(--text-secondary)" }}>
                <BookOpen size={36} />
              </div>
            )}
          </div>

          {/* Details Texts */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "800", lineHeight: "1.4", color: "var(--text-primary)", marginBottom: "8px" }}>
                {novel.title}
              </h2>
              {novel.author && (
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  المؤلف: {novel.author}
                </span>
              )}
              {novel.status && (
                <span 
                  className="badge badge-accent" 
                  style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "6px" }}
                >
                  الحالة: {novel.status}
                </span>
              )}
            </div>
            
            {/* Quick reading action */}
            {readingTargetSlug && (
              <Link 
                href={`/chapter/${readingTargetSlug}?novel=${slug}`}
                className="btn btn-primary animate-pulse"
                style={{ 
                  marginTop: "16px", 
                  height: "36px", 
                  padding: "0 16px", 
                  fontSize: "0.8rem", 
                  borderRadius: "8px", 
                  display: "inline-flex", 
                  gap: "6px",
                  alignSelf: "flex-start",
                  boxShadow: "0 4px 12px var(--accent-glow)",
                  animation: "pulseGlow 2s infinite"
                }}
              >
                <BookOpen size={14} />
                <span>{progress ? "متابعة القراءة" : "ابدأ القراءة"}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Genres badges */}
        {novel.genres && novel.genres.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "16px" }}>
            {novel.genres.slice(0, 6).map((genre: string) => (
              <span 
                key={genre} 
                style={{ 
                  fontSize: "0.7rem", 
                  backgroundColor: "var(--bg-surface-hover)", 
                  color: "var(--text-secondary)", 
                  padding: "4px 10px", 
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)"
                }}
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Description / Synopsis Section */}
      <section style={{ padding: "0 16px 20px" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", borderRight: "3px solid var(--accent-color)", paddingRight: "8px" }}>نبذة عن الرواية</h3>
        <p 
          style={{ 
            fontSize: "0.85rem", 
            color: "var(--text-secondary)", 
            lineHeight: "1.6",
            maxHeight: "120px",
            overflowY: "auto",
            padding: "8px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "10px",
            border: "1px solid var(--border-color)"
          }}
        >
          {novel.description || "لا يوجد وصف متوفر للرواية حالياً."}
        </p>
      </section>

      {/* Chapters directory */}
      <section style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: "700", borderRight: "3px solid var(--accent-color)", paddingRight: "8px" }}>
            قائمة الفصول ({novel.chapters.length})
          </h3>
          
          {/* Sorting Direction Toggle */}
          <button 
            onClick={() => setSortAsc(!sortAsc)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.75rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {sortAsc ? <SortAsc size={16} /> : <SortDesc size={16} />}
            <span>{sortAsc ? "من الأقدم للأحدث" : "من الأحدث للأقدم"}</span>
          </button>
        </div>

        {/* Chapters list layout */}
        {novel.chapters.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "30px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            لا توجد فصول متاحة لهذه الرواية حالياً.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sortedChapters.map((chapter: any) => {
             const isRead = readChapters.includes(decodeURIComponent(chapter.slug));
             const isCurrent = progress && progress.chapterSlug === chapter.slug;
             return (
                <Link 
                  key={chapter.slug} 
                  href={`/chapter/${chapter.slug}?novel=${slug}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    backgroundColor: isCurrent ? "var(--accent-glow)" : "var(--bg-surface)",
                    border: `1px solid ${isCurrent ? "var(--accent-color)" : "var(--border-color)"}`,
                    borderRadius: "12px",
                    transition: "transform 0.15s ease",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "80%" }}>
                    <span 
                      style={{ 
                        fontSize: "0.85rem", 
                        fontWeight: "600", 
                        color: isCurrent ? "var(--accent-color)" : isRead ? "var(--text-secondary)" : "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        opacity: isRead && !isCurrent ? 0.6 : 1
                      }}
                    >
                      {isRead && !isCurrent && <span style={{ color: "var(--accent-color)", marginLeft: "6px" }}>✓</span>}
                      {chapter.name}
                    </span>
                  </div>
                  {chapter.date && (
                    <span 
                      style={{ 
                        fontSize: "0.7rem", 
                        color: "var(--text-muted)", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "2px" 
                      }}
                    >
                      <Calendar size={12} />
                      <span>{chapter.date}</span>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
