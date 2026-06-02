"use client";

import { useEffect, useState } from "react";
import { Settings, Globe, Moon, Sun, Type, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { 
  getReaderSettings, 
  saveReaderSettings, 
  getSavedBaseUrl, 
  saveBaseUrl, 
  ReaderSettings,
  DEFAULT_SETTINGS 
} from "@/lib/storage";

const FALLBACK_DOMAINS = [
  "https://kolnovel.com",
  "https://kolnovel.site",
  "https://kolbook.xyz"
];

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [baseUrl, setBaseUrl] = useState("https://kolnovel.com");
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    setBaseUrl(getSavedBaseUrl());
    setSettings(getReaderSettings());
    setMounted(true);
  }, []);

  const handleSaveDomain = (url: string) => {
    saveBaseUrl(url);
    setBaseUrl(url);
    showStatus("تم حفظ النطاق بنجاح!", "success");
  };

  const handleUpdateSetting = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveReaderSettings(updated);
    
    // If theme is changed, apply it to documentElement immediately
    if (key === "theme") {
      document.documentElement.setAttribute("data-theme", value as string);
    }
  };

  const showStatus = (text: string, type: "success" | "error") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: "", type: "" }), 3000);
  };

  const handleClearData = () => {
    if (confirm("هل أنت متأكد من رغبتك في حذف جميع الروايات المحفوظة وسجل القراءة؟ لا يمكن التراجع عن هذا الإجراء.")) {
      localStorage.clear();
      setBaseUrl("https://kolnovel.com");
      setSettings(DEFAULT_SETTINGS);
      document.documentElement.setAttribute("data-theme", "dark");
      showStatus("تم مسح كافة البيانات وتصفير التطبيق!", "success");
    }
  };

  if (!mounted) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--bg-color)" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--border-color)", borderTopColor: "var(--accent-color)", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <main className="animate-fade-in" style={{ paddingBottom: "100px" }}>
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">الإعدادات</h1>
        <div style={{ color: "var(--text-secondary)" }}>
          <Settings size={22} />
        </div>
      </header>

      <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
        
        {/* Status Toast Banner */}
        {statusMessage.text && (
          <div 
            className="animate-fade-up"
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              backgroundColor: statusMessage.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${statusMessage.type === "success" ? "hsl(142, 70%, 45%)" : "hsl(0, 84%, 60%)"}`,
              color: statusMessage.type === "success" ? "hsl(142, 70%, 75%)" : "hsl(0, 84%, 75%)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.85rem",
              marginBottom: "16px",
              fontWeight: "500"
            }}
          >
            {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* SECTION: Website Domain Settings */}
        <section style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", fontWeight: "700", marginBottom: "12px" }}>
            <Globe size={18} style={{ color: "var(--accent-color)" }} />
            <span>نطاق ملوك الروايات (المصدر)</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: "1.5", marginBottom: "12px" }}>
            إذا تم حجب الموقع أو تغير نطاق الموقع الرئيسي، يمكنك كتابة النطاق الجديد هنا لتستمر الخدمة بالعمل دون تحديث التطبيق.
          </p>
          
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input 
              type="text" 
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="search-input" 
              style={{ margin: 0, height: "40px" }}
              placeholder="مثال: https://kolnovel.com"
            />
            <button 
              onClick={() => handleSaveDomain(baseUrl)}
              className="btn btn-primary"
              style={{ height: "40px", padding: "0 16px", fontSize: "0.85rem" }}
            >
              حفظ
            </button>
          </div>

          <div style={{ marginTop: "12px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>نطاقات شائعة/سريعة للاستخدام:</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {FALLBACK_DOMAINS.map((domain) => (
                <button
                  key={domain}
                  onClick={() => handleSaveDomain(domain)}
                  style={{
                    backgroundColor: "var(--bg-bg-color, rgba(0,0,0,0.15))",
                    border: `1px solid ${domain === baseUrl ? "var(--accent-color)" : "var(--border-color)"}`,
                    color: domain === baseUrl ? "var(--accent-color)" : "var(--text-secondary)",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    fontSize: "0.7rem",
                    fontWeight: "500",
                    cursor: "pointer"
                  }}
                >
                  {domain.replace("https://", "")}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: Theme Settings */}
        <section style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", fontWeight: "700", marginBottom: "12px" }}>
            <Moon size={18} style={{ color: "var(--accent-color)" }} />
            <span>مظهر التطبيق</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: "1.5", marginBottom: "12px" }}>
            اختر المظهر المفضل لديك لتسهيل القراءة وتوفير راحة لعينك.
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {[
              { id: "dark", label: "مظلم (تلقائي)", icon: <Moon size={16} /> },
              { id: "light", label: "مضيء", icon: <Sun size={16} /> },
              { id: "sepia", label: "ورق قديم (سيبيا)", icon: <Type size={16} /> },
              { id: "oled", label: "أسود داكن (OLED)", icon: <Moon size={16} style={{ fill: "currentColor" }} /> }
            ].map((themeOpt) => (
              <button
                key={themeOpt.id}
                onClick={() => handleUpdateSetting("theme", themeOpt.id as any)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: settings.theme === themeOpt.id ? "var(--accent-glow)" : "var(--bg-surface-hover)",
                  border: `1px solid ${settings.theme === themeOpt.id ? "var(--accent-color)" : "var(--border-color)"}`,
                  color: settings.theme === themeOpt.id ? "var(--accent-color)" : "var(--text-primary)",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                {themeOpt.icon}
                <span>{themeOpt.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* SECTION: Reading Font Settings */}
        <section style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", fontWeight: "700", marginBottom: "12px" }}>
            <Type size={18} style={{ color: "var(--accent-color)" }} />
            <span>خيارات الخط وحجم النص</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: "1.5", marginBottom: "16px" }}>
            قم بضبط الخطوط لتناسب أسلوب قراءتك المفضل.
          </p>

          {/* Font Family Picker */}
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>نوع الخط العربي:</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {[
                { id: "cairo", label: "خط كايرو (حديث)", font: "var(--font-arabic-sans)" },
                { id: "amiri", label: "خط أميري (نسخ)", font: "var(--font-arabic-serif)" },
                { id: "tajawal", label: "خط تجول (بسيط)", font: "var(--font-arabic-geometric)" }
              ].map((fontOpt) => (
                <button
                  key={fontOpt.id}
                  onClick={() => handleUpdateSetting("fontFamily", fontOpt.id as any)}
                  style={{
                    height: "44px",
                    borderRadius: "10px",
                    backgroundColor: settings.fontFamily === fontOpt.id ? "var(--accent-glow)" : "var(--bg-surface-hover)",
                    border: `1px solid ${settings.fontFamily === fontOpt.id ? "var(--accent-color)" : "var(--border-color)"}`,
                    color: settings.fontFamily === fontOpt.id ? "var(--accent-color)" : "var(--text-primary)",
                    fontWeight: "500",
                    fontSize: "0.85rem",
                    fontFamily: fontOpt.font,
                    cursor: "pointer"
                  }}
                >
                  {fontOpt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Adjust */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>حجم خط القراءة:</span>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--accent-color)" }}>{settings.fontSize}px</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button 
                onClick={() => handleUpdateSetting("fontSize", Math.max(12, settings.fontSize - 1))}
                style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-surface-hover)", color: "var(--text-primary)", fontWeight: "bold" }}
              >
                -
              </button>
              <input 
                type="range" 
                min="12" 
                max="36" 
                value={settings.fontSize}
                onChange={(e) => handleUpdateSetting("fontSize", parseInt(e.target.value))}
                style={{ flex: 1, accentColor: "var(--accent-color)" }}
              />
              <button 
                onClick={() => handleUpdateSetting("fontSize", Math.min(36, settings.fontSize + 1))}
                style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-surface-hover)", color: "var(--text-primary)", fontWeight: "bold" }}
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
                style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-surface-hover)", color: "var(--text-primary)", fontWeight: "bold" }}
              >
                -
              </button>
              <input 
                type="range" 
                min="1.3" 
                max="2.5" 
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) => handleUpdateSetting("lineHeight", parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: "var(--accent-color)" }}
              />
              <button 
                onClick={() => handleUpdateSetting("lineHeight", Math.min(2.5, Number((settings.lineHeight + 0.1).toFixed(1))))}
                style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-surface-hover)", color: "var(--text-primary)", fontWeight: "bold" }}
              >
                +
              </button>
            </div>
          </div>
        </section>

        {/* SECTION: Danger zone */}
        <section style={{ backgroundColor: "var(--bg-surface)", border: "1px solid hsl(0, 50%, 20%)", borderRadius: "16px", padding: "16px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", fontWeight: "700", marginBottom: "12px", color: "hsl(0, 84%, 75%)" }}>
            <Trash2 size={18} />
            <span>منطقة الخطر</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: "1.5", marginBottom: "16px" }}>
            حذف كافة الروايات المخزنة وسجلات القراءة وتعديل الإعدادات والعودة للوضع الأصلي.
          </p>
          <button 
            onClick={handleClearData}
            className="btn btn-secondary"
            style={{ width: "100%", border: "1px solid hsl(0, 60%, 40%)", color: "hsl(0, 84%, 75%)", gap: "8px" }}
          >
            <Trash2 size={16} />
            <span>حذف جميع البيانات</span>
          </button>
        </section>

      </div>

      <BottomNav />
    </main>
  );
}
