"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, BookMarked, RefreshCw, TrendingUp, Clock } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { getSavedBaseUrl } from "@/lib/storage";

interface Novel {
  title: string;
  slug: string;
  cover: string;
  rating: string;
  latestChapter: string;
}

export default function LibraryPage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState("update");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedSettings = localStorage.getItem("kolnovel_reader_settings");
    if (savedSettings) {
      try {
        const { theme } = JSON.parse(savedSettings);
        if (theme) document.documentElement.setAttribute("data-theme", theme);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchNovels();
  }, [mounted, order]);

  const fetchNovels = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/novels?order=${order}&baseUrl=https://free.kolnovel.com`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNovels(data.novels || []);
    } catch (err: any) {
      setError(err.message || "فشل تحميل الروايات");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <main className="animate-fade-in" style={{ paddingBottom: "80px" }}>
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">ملوك الروايات</h1>
        <div style={{ color: "var(--text-secondary)" }}>
          <BookMarked size={22} />
        </div>
      </header>

      <div style={{ padding: "16px" }}>
        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {[
            { id: "update", label: "آخر التحديثات", icon: <Clock size={14} /> },
            { id: "popular", label: "الأكثر شعبية", icon: <TrendingUp size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setOrder(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "20px",
                border: `1px solid ${order === tab.id ? "var(--accent-color)" : "var(--border-color)"}`,
                backgroundColor: order === tab.id ? "var(--accent-glow)" : "var(--bg-surface)",
                color: order === tab.id ? "var(--accent-color)" : "var(--text-secondary)",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <button
            onClick={fetchNovels}
            style={{
              marginRight: "auto",
              padding: "8px",
              borderRadius: "20px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid var(--border-color)", borderTopColor: "var(--accent-color)", animation: "spin 1s linear infinite" }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
            <p style={{ marginBottom: "12px" }}>{error}</p>
            <button onClick={fetchNovels} className="btn btn-primary">إعادة المحاولة</button>
          </div>
        )}

        {/* Novels Grid */}
        {!loading && !error && (
          <div className="animate-fade-up">
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
              {novels.length} رواية
            </p>
            <div className="shelf-grid">
              {novels.map((novel) => (
                <div key={novel.slug} className="novel-card">
                  <Link href={`/novel/${novel.slug}`}>
                    <div className="novel-card-image">
                      {novel.cover ? (
                        <img src={novel.cover} alt={novel.title} loading="lazy" />
                      ) : (
                        <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
                          <BookOpen size={32} />
                        </div>
                      )}
                      {novel.rating && (
                        <div style={{
                          position: "absolute", top: "6px", left: "6px",
                          backgroundColor: "rgba(0,0,0,0.7)",
                          color: "#ffd700", fontSize: "0.65rem", fontWeight: "700",
                          padding: "2px 6px", borderRadius: "6px"
                        }}>
                          ★ {novel.rating}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="novel-card-info">
                    <Link href={`/novel/${novel.slug}`}>
                      <h4 className="novel-card-title">{novel.title}</h4>
                    </Link>
                    {novel.latestChapter && (
                      <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block", marginTop: "4px" }}>
                        {novel.latestChapter}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}