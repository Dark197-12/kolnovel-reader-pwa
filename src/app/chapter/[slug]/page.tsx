"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Settings, ChevronLeft, ChevronRight, BookOpen, Check, Type } from "lucide-react";
import { 
  getSavedBaseUrl, 
  getReaderSettings, 
  saveReaderSettings, 
  saveReadingProgress, 
  getReadingProgress,
  ReaderSettings,
  DEFAULT_SETTINGS 
} from "@/lib/storage";

export default function ChapterReaderPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { slug } = use(params);
  
  // Query parameters
  const novelSlug = searchParams.get("novel") || "";
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<any>(null);
  const [error, setError] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://kolnovel.com");
  
  // Reader Visual preferences
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  
  // Auto scroll ref
  const scrollRef = useRef<boolean>(false);

  useEffect(() => {
    const savedUrl = getSavedBaseUrl();
    const savedSettings = getReaderSettings();
    setBaseUrl(savedUrl);
    setSettings(savedSettings);
    
    // Apply initial theme
    document.documentElement.setAttribute("data-theme", savedSettings.theme);

    const fetchChapter = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/chapter/${slug}?baseUrl=${encodeURIComponent(savedUrl)}`);
        if (!response.ok) {
          throw new Error("حدث خطأ أثناء جلب محتوى الفصل من الخادم.");
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setChapter(data);
        scrollRef.current = false; // Reset scroll restoration trigger
      } catch (err: any) {
        console.error(err);
        setError(err.message || "فشل تحميل الفصل. يرجى التحقق من اتصالك بالنطاق.");
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [slug]);

  // Restore scroll position once content is loaded
  useEffect(() => {
    if (!loading && chapter && !scrollRef.current && novelSlug) {
      const savedProgress = getReadingProgress(novelSlug);
      if (savedProgress && savedProgress.chapterSlug === slug && savedProgress.scrollPercent > 0) {
        // Wait a small moment for layout calculation
        setTimeout(() => {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (scrollHeight > 0) {
            const targetY = (savedProgress.scrollPercent / 100) * scrollHeight;
            window.scrollTo({ top: targetY, behavior: "smooth" });
          }
          scrollRef.current = true;
        }, 300);
      } else {
        scrollRef.current = true;
        window.scrollTo({ top: 0 }); // Scroll to top for new chapters
      }
    }
  }, [loading, chapter, slug, novelSlug]);

  // Scroll event listener to track progress
  useEffect(() => {
    if (loading || !chapter || !novelSlug) return;

    let timeoutId: any;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      
      // Throttle progress saving to prevent excessive localStorage writes
      timeoutId = setTimeout(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        if (scrollHeight > 0) {
          const percent = Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)));
          saveReadingProgress(novelSlug, slug, chapter.title || "فصل جديد", percent);
        }
      }, 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [loading, chapter, slug, novelSlug]);

  // Apply setting change helper
  const handleUpdateSetting = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveReaderSettings(updated);
    
    if (key === "theme") {
      document.documentElement.setAttribute("data-theme", value as string);
    }
  };

  // Close reader settings when click outside
  const closeSettingsDrawer = () => setShowSettingsDrawer(false);

  const getFontFamilyName = (fontKey: string) => {
    switch (fontKey) {
      case "amiri": return "var(--font-arabic-serif)";
      case "tajawal": return "var(--font-arabic-geometric)";
      default: return "var(--font-arabic-sans)";
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--bg-color)" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--border-color)", borderTopColor: "var(--accent-color)", animation: "spin 1s linear infinite", marginBottom: "12px" }}></div>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>جاري تصفية الإعلانات وجلب الفصل...</span>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !chapter) {
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
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "8px" }}>فشل تحميل الفصل</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "300px", lineHeight: "1.6", marginBottom: "20px" }}>{error || "حدث خطأ غير معروف أثناء تحميل هذا الفصل."}</p>
          <button onClick={() => router.back()} className="btn btn-primary">العودة للرواية</button>
        </div>
      </div>
    );
  }

  return (
    <main 
      className="animate-fade-in" 
      style={{ 
        backgroundColor: "var(--bg-color)", 
        minHeight: "100vh", 
        paddingBottom: "80px",
        fontFamily: getFontFamilyName(settings.fontFamily),
        transition: "background-color 0.3s ease, color 0.3s ease"
      }}
    >
      {/* Reader Top Sticky Header */}
      <header className="app-header" style={{ position: "sticky" }}>
        <button 
          onClick={() => {
            if (novelSlug) {
              router.push(`/novel/${novelSlug}`);
            } else {
              router.back();
            }
          }} 
          className="btn btn-secondary btn-icon" 
          style={{ backgroundColor: "transparent", border: "none" }}
        >
          <ArrowRight size={22} />
        </button>
        
        <span 
          style={{ 
            fontSize: "0.95rem", 
            fontWeight: "700", 
            maxWidth: "60%", 
            overflow: "hidden", 
            textOverflow: "ellipsis", 
            whiteSpace: "nowrap",
            fontFamily: "var(--font-arabic-sans)" 
          }}
        >
          {chapter.title}
        </span>
        
        <button 
          onClick={() => setShowSettingsDrawer(true)} 
          className="btn btn-secondary btn-icon" 
          style={{ backgroundColor: "transparent", border: "none" }}
        >
          <Settings size={22} />
        </button>
      </header>

      {/* Main Chapter Content Container */}
      <div 
        className="readable-content"
        style={{ 
          padding: "24px 20px", 
          maxWidth: "700px", 
          margin: "0 auto",
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          color: "var(--text-primary)",
          textAlign: "justify"
        }}
      >
        <h2 
          style={{ 
            fontSize: "1.45em", 
            fontWeight: "800", 
            marginBottom: "24px", 
            lineHeight: "1.3",
            textAlign: "right",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "16px",
            color: "var(--accent-color)"
          }}
        >
          {chapter.title}
        </h2>

        {chapter.paragraphs && chapter.paragraphs.length > 0 ? (
          chapter.paragraphs.map((item: any, idx: number) => {
            if (item.type === "image") {
              return (
                <div key={idx} style={{ textAlign: "center", margin: "16px 0" }}>
                  <img src={item.src} alt="" style={{ maxWidth: "100%", borderRadius: "8px" }} />
                </div>
              );
            }
            if (item.type === "image-row") {
              return (
                <div key={idx} style={{ display: "flex", gap: "8px", justifyContent: "center", margin: "16px 0", flexWrap: "wrap" }}>
                  {item.srcs.map((src: string, i: number) => (
                    <img key={i} src={src} alt="" style={{ maxWidth: `${Math.floor(96 / item.srcs.length)}%`, borderRadius: "8px", flex: "1" }} />
                  ))}
                </div>
              );
            }
            return (
              <p key={idx} style={{ marginBottom: "1.5em", textIndent: "0.5em" }}>
                {item.content}
              </p>
            );
          })
        ) : (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px", color: "var(--text-secondary)" }}>
            لا يوجد نص متاح في هذا الفصل.
          </div>
        )}
      </div>

      {/* Chapter Footer Navigation */}
      <footer 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          padding: "16px", 
          maxWidth: "700px", 
          margin: "0 auto",
          borderTop: "1px solid var(--border-color)",
          gap: "16px"
        }}
      >
        {chapter.prevChapterSlug ? (
          <Link 
            href={`/chapter/${chapter.prevChapterSlug}?novel=${novelSlug}`}
            className="btn btn-secondary"
            style={{ 
              flex: 1, 
              height: "44px", 
              fontSize: "0.85rem", 
              gap: "6px",
              fontFamily: "var(--font-arabic-sans)" 
            }}
          >
            <ChevronRight size={18} />
            <span>الفصل السابق</span>
          </Link>
        ) : (
          <button 
            disabled 
            className="btn btn-secondary" 
            style={{ flex: 1, height: "44px", opacity: 0.3, cursor: "not-allowed", fontSize: "0.85rem" }}
          >
            بداية الرواية
          </button>
        )}

        {chapter.nextChapterSlug ? (
          <Link 
            href={`/chapter/${chapter.nextChapterSlug}?novel=${novelSlug}`}
            className="btn btn-primary"
            style={{ 
              flex: 1, 
              height: "44px", 
              fontSize: "0.85rem", 
              gap: "6px",
              fontFamily: "var(--font-arabic-sans)" 
            }}
          >
            <span>الفصل التالي</span>
            <ChevronLeft size={18} />
          </Link>
        ) : (
          <button 
            disabled 
            className="btn btn-secondary" 
            style={{ flex: 1, height: "44px", opacity: 0.3, cursor: "not-allowed", fontSize: "0.85rem" }}
          >
            آخر فصل متوفر
          </button>
        )}
      </footer>

      {/* FORMATTING DRAWER POPUP PANEL */}
      {showSettingsDrawer && (
        <div 
          onClick={closeSettingsDrawer}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 2000,
            display: "flex",
            alignItems: "flex-end"
          }}
        >
          {/* Drawer Inner Panel */}
          <div 
            onClick={(e) => e.stopPropagation()} // Prevent closing drawer on inner click
            className="animate-fade-up"
            style={{
              width: "100%",
              backgroundColor: "var(--bg-surface)",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              borderTop: "1px solid var(--border-color)",
              padding: "24px 20px calc(24px + var(--safe-bottom))",
              boxShadow: "0 -8px 30px rgba(0,0,0,0.3)",
              fontFamily: "var(--font-arabic-sans)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>تخصيص القراءة</h3>
              <button 
                onClick={closeSettingsDrawer}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                إغلاق
              </button>
            </div>

            {/* Themes Toggle */}
            <div style={{ marginBottom: "20px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>المظهر:</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                {[
                  { id: "dark", label: "مظلم" },
                  { id: "light", label: "مضيء" },
                  { id: "sepia", label: "سيبيا" },
                  { id: "oled", label: "OLED" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleUpdateSetting("theme", t.id as any)}
                    style={{
                      height: "36px",
                      borderRadius: "8px",
                      backgroundColor: settings.theme === t.id ? "var(--accent-glow)" : "var(--bg-surface-hover)",
                      border: `1px solid ${settings.theme === t.id ? "var(--accent-color)" : "var(--border-color)"}`,
                      color: settings.theme === t.id ? "var(--accent-color)" : "var(--text-primary)",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fonts Pickers */}
            <div style={{ marginBottom: "20px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>الخط:</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                {[
                  { id: "cairo", label: "كايرو" },
                  { id: "amiri", label: "أميري" },
                  { id: "tajawal", label: "تجول" }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleUpdateSetting("fontFamily", f.id as any)}
                    style={{
                      height: "36px",
                      borderRadius: "8px",
                      backgroundColor: settings.fontFamily === f.id ? "var(--accent-glow)" : "var(--bg-surface-hover)",
                      border: `1px solid ${settings.fontFamily === f.id ? "var(--accent-color)" : "var(--border-color)"}`,
                      color: settings.fontFamily === f.id ? "var(--accent-color)" : "var(--text-primary)",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Adjust */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>حجم النص:</span>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--accent-color)" }}>{settings.fontSize}px</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button 
                  onClick={() => handleUpdateSetting("fontSize", Math.max(12, settings.fontSize - 1))}
                  style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-surface-hover)", color: "var(--text-primary)", fontWeight: "bold" }}
                >
                  -
                </button>
                <span style={{ flex: 1, textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)" }}>اسحب للضبط أو انقر الأزرار</span>
                <button 
                  onClick={() => handleUpdateSetting("fontSize", Math.min(36, settings.fontSize + 1))}
                  style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-surface-hover)", color: "var(--text-primary)", fontWeight: "bold" }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Line Height Adjust */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>تباعد الأسطر:</span>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--accent-color)" }}>{settings.lineHeight}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button 
                  onClick={() => handleUpdateSetting("lineHeight", Math.max(1.3, Number((settings.lineHeight - 0.1).toFixed(1))))}
                  style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-surface-hover)", color: "var(--text-primary)", fontWeight: "bold" }}
                >
                  -
                </button>
                <span style={{ flex: 1, textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)" }}>ضبط المسافة</span>
                <button 
                  onClick={() => handleUpdateSetting("lineHeight", Math.min(2.5, Number((settings.lineHeight + 0.1).toFixed(1))))}
                  style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-surface-hover)", color: "var(--text-primary)", fontWeight: "bold" }}
                >
                  +
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
