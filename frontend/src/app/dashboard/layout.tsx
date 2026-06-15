"use client";

import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  Bot,
  BookOpen,
  BarChart3,
  Bell,
  Settings,
  User,
  Zap,
  Search,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Shield,
  Building,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api, clearAuthState, getAuthState, type AuthUser } from "@/lib/api";
import { useTheme } from "@/hooks/useTheme";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Marketplace", href: "/dashboard/marketplace", icon: ShoppingBag },
  { label: "AI Diagnostics", href: "/dashboard/session", icon: Bot },
  { label: "Knowledge Base", href: "/dashboard/kb", icon: BookOpen },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const adminItems: NavItem[] = [
  { label: "Admin Panel", href: "/dashboard/admin", icon: Shield },
  { label: "Companies", href: "/dashboard/company", icon: Building },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ label: string; href: string; type: string }>>([]);
  const [user, setUser] = useState<AuthUser | null>(() => getAuthState()?.user || null);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const allNav = [...navItems, ...adminItems];

  useEffect(() => {
    api.profile().then((result) => setUser(result.data.user)).catch(() => undefined);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      // Avoid synchronous setState warnings; clear asynchronously.
      window.setTimeout(() => setSearchResults([]), 0);
      return;
    }

    const timeout = window.setTimeout(() => {
      api.search(query)
        .then((result) => {
          const productResults = result.data.products.map((product) => ({
            label: product.name,
            href: "/dashboard/product",
            type: "Product",
          }));
          const knowledgeResults = result.data.knowledge.map((item) => ({
            label: item.title,
            href: "/dashboard/kb",
            type: "Knowledge",
          }));
          setSearchResults([...productResults, ...knowledgeResults].slice(0, 6));
        })
        .catch(() => setSearchResults([]));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  const logout = () => {
    clearAuthState();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="p-5 border-b border-[hsl(var(--border))]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Mantis AI</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Main
          </p>
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-violet-500/10 text-violet-400 font-medium"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {active && (
                  <ChevronRight className="w-3 h-3 ml-auto" />
                )}
              </Link>
            );
          })}

          <div className="pt-4">
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Admin
            </p>
            {adminItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    active
                      ? "bg-violet-500/10 text-violet-400 font-medium"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom User Section */}
        <div className="p-3 border-t border-[hsl(var(--border))]">
          <button onClick={logout} className="flex w-full items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--secondary))] cursor-pointer transition-all text-left">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {(user?.name || "Mantis").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "Guest user"}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user?.email || "Sign in to sync data"}</p>
            </div>
            <LogOut className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/60"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] flex flex-col"
            >
              <div className="p-5 border-b border-[hsl(var(--border))] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold">Mantis AI</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {allNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        pathname === item.href
                          ? "bg-violet-500/10 text-violet-400 font-medium"
                          : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-[hsl(var(--secondary))]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, manuals, tickets..."
                className="w-80 pl-9 pr-4 py-1.5 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all placeholder:text-[hsl(var(--muted-foreground))]"
              />
              {searchResults.length > 0 && (
                <div className="absolute left-0 top-10 z-50 w-80 overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl">
                  {searchResults.map((item) => (
                    <Link
                      key={`${item.type}-${item.label}`}
                      href={item.href}
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-[hsl(var(--secondary))]"
                    >
                      <span className="truncate">{item.label}</span>
                      <span className="rounded-md bg-[hsl(var(--secondary))] px-2 py-1 text-[10px] text-[hsl(var(--muted-foreground))]">{item.type}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/dashboard/notifications"
              className="relative p-2 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-violet-500" />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-grid-pattern">
          {children}
        </main>
      </div>
    </div>
  );
}
