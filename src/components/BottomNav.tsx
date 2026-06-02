"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Search, Settings } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      <Link 
        href="/" 
        className={`bottom-nav-item ${pathname === "/" ? "active" : ""}`}
      >
        <BookOpen size={22} />
        <span>المكتبة</span>
      </Link>

      <Link 
        href="/search" 
        className={`bottom-nav-item ${pathname === "/search" ? "active" : ""}`}
      >
        <Search size={22} />
        <span>البحث</span>
      </Link>

      <Link 
        href="/settings" 
        className={`bottom-nav-item ${pathname === "/settings" ? "active" : ""}`}
      >
        <Settings size={22} />
        <span>الإعدادات</span>
      </Link>
    </nav>
  );
}
