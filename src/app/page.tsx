"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Compass, Search, BookMarked } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { getBookmarks, Bookmark } from "@/lib/storage";

export default function LibraryPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setBookmarks(getBookmarks());
    setMounted(true);
    
    // Read and apply saved theme
    const savedSettings = localStorage.getItem("kolnovel_reader_settings");
    if (savedSettings) {
      try {
        const { theme } = JSON.parse(savedSettings);
        if (theme) {
          document.documentElement.setAttribute("data-theme", theme);
        }
      } catch (e) {}
    }
  }, []);

  if (!mounted) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--bg-color)" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--border-color)", borderTopColor: "var(--accent-color)", animation: "spin 1s linear infinite" }}></div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <main className="animate-fade-in" style={{ paddingBottom: "80px" }}>
      {/* Glassmorphism Header */}
      <header className="app-header">
        <h1 className="app-title">مكتبتي</h1>
        <div style={{ color: "var(--text-secondary)" }}>
          <BookMarked size={22} />
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ padding: "16px" }}>
        {bookmarks.length === 0 ? (
          /* Empty State */
          <div 
            className="animate-fade-up" 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center", 
              minHeight: "60vh",
              textAlign: "center",
              padding: "24px"
            }}
          >
            <div 
              style={{ 
                width: "80px", 
                height: "80px", 
                borderRadius: "50%", 
                backgroundColor: "var(--bg-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
                marginBottom: "20px",
                border: "1px solid var(--border-color)",
                boxShadow: "inset 0 0 10px var(--shadow-color)"
              }}
            >
              <BookOpen size={36} style={{ color: "var(--accent-color)" }} />
            </div>
            
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "8px" }}>المكتبة فارغة حالياً</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "260px", lineHeight: "1.6", marginBottom: "24px" }}>
              ابدأ بالبحث عن رواياتك المفضلة وأضفها إلى مكتبتك الشخصية للوصول السريع إليها.
            </p>
            
            <Link href="/search" className="btn btn-primary" style={{ display: "inline-flex", gap: "8px" }}>
              <Compass size={18} />
              <span>استكشف الروايات</span>
            </Link>
          </div>
        ) : (
          /* Bookshelf Grid */
          <div className="animate-fade-up">
            <h3 style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "16px", fontWeight: "600" }}>
              الروايات المتابعة ({bookmarks.length})
            </h3>
            
            <div className="shelf-grid">
              {bookmarks.map((novel) => (
                <div key={novel.slug} className="novel-card">
                  <Link href={`/novel/${novel.slug}`}>
                    <div className="novel-card-image">
                      {novel.cover ? (
                        <img 
                          src={novel.cover} 
                          alt={novel.title} 
                          loading="lazy" 
                        />
                      ) : (
                        <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
                          <BookOpen size={32} />
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="novel-card-info">
                    <Link href={`/novel/${novel.slug}`}>
                      <h4 className="novel-card-title">{novel.title}</h4>
                    </Link>
                    
                    {novel.lastReadSlug ? (
                      <Link 
                        href={`/chapter/${novel.lastReadSlug}?novel=${novel.slug}`}
                        style={{
                          display: "block",
                          marginTop: "8px",
                          padding: "6px 8px",
                          backgroundColor: "var(--bg-surface-hover)",
                          borderRadius: "8px",
                          fontSize: "0.7rem",
                          fontWeight: "500",
                          color: "var(--accent-color)",
                          textAlign: "center",
                          border: "1px solid var(--border-color)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        متابعة القراءة: {novel.lastReadName?.replace(/الفصل\s+/i, "")}
                      </Link>
                    ) : (
                      <Link 
                        href={`/novel/${novel.slug}`}
                        style={{
                          display: "block",
                          marginTop: "8px",
                          padding: "6px 8px",
                          backgroundColor: "var(--bg-surface-hover)",
                          borderRadius: "8px",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          color: "var(--text-secondary)",
                          textAlign: "center",
                          border: "1px solid var(--border-color)"
                        }}
                      >
                        ابدأ القراءة
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Tab Bar */}
      <BottomNav />
    </main>
  );
}
