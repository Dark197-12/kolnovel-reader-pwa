"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, BookOpen, Compass, AlertCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { getSavedBaseUrl } from "@/lib/storage";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [novels, setNovels] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [baseUrl, setBaseUrl] = useState("https://kolnovel.com");
  const [error, setError] = useState("");

  useEffect(() => {
    setBaseUrl(getSavedBaseUrl());
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&baseUrl=${encodeURIComponent(baseUrl)}`);
      
      if (!response.ok) {
        throw new Error("حدث خطأ أثناء الاتصال بالخادم لجلب النتائج.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setNovels(data.novels || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ غير متوقع. يرجى التحقق من اتصالك بالإنترنت ونطاق الموقع.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="animate-fade-in" style={{ paddingBottom: "80px" }}>
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">استكشاف الروايات</h1>
        <div style={{ color: "var(--text-secondary)" }}>
          <Search size={22} />
        </div>
      </header>

      <div style={{ padding: "16px" }}>
        
        {/* Search Bar Form */}
        <form onSubmit={handleSearch} className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="ابحث باسم الرواية..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="search-icon-wrapper">
            <Search size={20} />
          </div>
        </form>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--border-color)", borderTopColor: "var(--accent-color)", animation: "spin 1s linear infinite", marginBottom: "12px" }}></div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>جاري البحث وتصفية الفصول...</span>
            <style jsx>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Error message Banner */}
        {error && !loading && (
          <div 
            style={{
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "hsl(0, 84%, 75%)",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: "0.85rem",
              lineHeight: "1.5"
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ fontWeight: "700", marginBottom: "4px" }}>تعذر جلب نتائج البحث</p>
              <p>{error}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                نصيحة: تأكد من أن نطاق الموقع المدخل في صفحة الإعدادات يعمل حالياً في المتصفح.
              </p>
            </div>
          </div>
        )}

        {/* Search Results */}
        {!loading && !error && searched && (
          <div className="animate-fade-up">
            <h3 style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "16px", fontWeight: "600" }}>
              نتائج البحث ({novels.length})
            </h3>

            {novels.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "30vh", color: "var(--text-secondary)", textAlign: "center" }}>
                <Compass size={40} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
                <h4 style={{ fontWeight: "700", color: "var(--text-primary)" }}>لم نجد أي نتائج</h4>
                <p style={{ fontSize: "0.8rem", marginTop: "4px" }}>تأكد من كتابة اسم الرواية بشكل صحيح أو ابحث بكلمات مفتاحية أخرى.</p>
              </div>
            ) : (
              <div className="shelf-grid">
                {novels.map((novel) => (
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
                      
                      {novel.latestChapter && (
                        <span 
                          style={{
                            display: "inline-block",
                            marginTop: "6px",
                            fontSize: "0.7rem",
                            color: "var(--accent-color)",
                            fontWeight: "500",
                            backgroundColor: "var(--accent-glow)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {novel.latestChapter}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Initial view before searching */}
        {!searched && !loading && (
          <div 
            className="animate-fade-up"
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center", 
              minHeight: "45vh",
              color: "var(--text-secondary)",
              textAlign: "center"
            }}
          >
            <Search size={48} style={{ color: "var(--border-color)", marginBottom: "12px" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px" }}>ابحث عن روايتك الأولى</h3>
            <p style={{ fontSize: "0.85rem", maxWidth: "260px", lineHeight: "1.5" }}>
              اكتب اسم الرواية بالعربية أو الإنجليزية، على سبيل المثال: "الإمبراطور الشيطاني"، "Demon Emperor".
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
