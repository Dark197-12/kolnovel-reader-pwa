// LocalStorage keys
const KEYS = {
  BOOKMARKS: "kolnovel_bookmarks",
  READER_SETTINGS: "kolnovel_reader_settings",
  BASE_URL: "kolnovel_base_url",
  READING_PROGRESS: "kolnovel_reading_progress"
};

export interface ReaderSettings {
  theme: "dark" | "light" | "sepia" | "oled";
  fontSize: number; // in pixels
  lineHeight: number;
  fontFamily: "cairo" | "amiri" | "tajawal";
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "dark",
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: "cairo"
};

export interface Bookmark {
  slug: string;
  title: string;
  cover: string;
  latestChapter?: string;
  lastReadSlug?: string;
  lastReadName?: string;
  updatedAt: number;
}

export interface ReadingProgress {
  chapterSlug: string;
  chapterName: string;
  scrollPercent: number;
  readAt: number;
}

// Custom domain handling
export function getSavedBaseUrl(): string {
  if (typeof window === "undefined") return "https://kolnovel.com";
  return localStorage.getItem(KEYS.BASE_URL) || "https://kolnovel.com";
}

export function saveBaseUrl(url: string): void {
  if (typeof window === "undefined") return;
  let formattedUrl = url.trim().replace(/\/$/, "");
  if (!formattedUrl.startsWith("http")) {
    formattedUrl = "https://" + formattedUrl;
  }
  localStorage.setItem(KEYS.BASE_URL, formattedUrl);
}

// Bookmarks / Bookshelf management
export function getBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(KEYS.BOOKMARKS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse bookmarks", e);
    return [];
  }
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
}

export function toggleBookmark(novel: { slug: string; title: string; cover: string }): boolean {
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex(b => b.slug === novel.slug);
  let isBookmarked = false;
  
  if (index > -1) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push({
      slug: novel.slug,
      title: novel.title,
      cover: novel.cover,
      updatedAt: Date.now()
    });
    isBookmarked = true;
  }
  
  saveBookmarks(bookmarks);
  return isBookmarked;
}

export function isNovelBookmarked(slug: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.slug === slug);
}

export function updateBookmarkProgress(
  novelSlug: string, 
  chapterSlug: string, 
  chapterName: string
): void {
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex(b => b.slug === novelSlug);
  
  if (index > -1) {
    bookmarks[index].lastReadSlug = chapterSlug;
    bookmarks[index].lastReadName = chapterName;
    bookmarks[index].updatedAt = Date.now();
    saveBookmarks(bookmarks);
  }
}

// Reader Settings management
export function getReaderSettings(): ReaderSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem(KEYS.READER_SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveReaderSettings(settings: ReaderSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.READER_SETTINGS, JSON.stringify(settings));
}

// Reading position persistence
export function getReadingProgress(novelSlug: string): ReadingProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(`${KEYS.READING_PROGRESS}_${novelSlug}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function saveReadingProgress(
  novelSlug: string, 
  chapterSlug: string, 
  chapterName: string, 
  scrollPercent: number
): void {
  if (typeof window === "undefined") return;
  const progress: ReadingProgress = {
    chapterSlug,
    chapterName,
    scrollPercent,
    readAt: Date.now()
  };
  localStorage.setItem(`${KEYS.READING_PROGRESS}_${novelSlug}`, JSON.stringify(progress));
  
  // Also update corresponding bookshelf item
  updateBookmarkProgress(novelSlug, chapterSlug, chapterName);
}
export function markChapterRead(novelSlug: string, chapterSlug: string) {
  const key = `read_chapters_${novelSlug}`;
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  const normalizedSlug = decodeURIComponent(chapterSlug);
  if (!existing.includes(normalizedSlug)) {
    existing.push(normalizedSlug);
    localStorage.setItem(key, JSON.stringify(existing));
  }
}

export function getReadChapters(novelSlug: string): string[] {
  const key = `read_chapters_${novelSlug}`;
  const stored = JSON.parse(localStorage.getItem(key) || "[]");
  // Normalize all stored slugs to decoded form
  return stored.map((s: string) => {
    try { return decodeURIComponent(s); } catch { return s; }
  });
}
