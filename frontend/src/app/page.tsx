"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  CheckCircle2,
  Moon,
  Search,
  Shield,
  ShoppingBag,
  Sun,
  Zap,
} from "lucide-react";
import { ProductViewer3D } from "@/components/mantis/ProductViewer3D";
import { ProductPart, dashboardCards, productParts, products } from "@/components/mantis/data";
import { useTheme } from "@/hooks/useTheme";

const platform = [
  { label: "AI Chat", icon: Bot, href: "/dashboard/session" },
  { label: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
  { label: "Knowledge", icon: BookOpen, href: "/dashboard/kb" },
  { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { label: "Search", icon: Search, href: "/dashboard" },
  { label: "Alerts", icon: Bell, href: "/dashboard/notifications" },
];

function ThemeButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function PartSummary({ part }: { part: ProductPart }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">Selected part</p>
          <h2 className="mt-1 text-xl font-semibold">{part.name}</h2>
        </div>
        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs text-amber-300">{part.risk}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{part.details}</p>
      <div className="mt-4 grid gap-2">
        {part.failures.slice(0, 2).map((failure) => (
          <div key={failure} className="flex items-center gap-2 rounded-md bg-[hsl(var(--secondary))] px-3 py-2 text-sm">
            <Shield className="h-4 w-4 text-amber-400" />
            {failure}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [selectedPart, setSelectedPart] = useState(productParts[2]);

  return (
    <div className="min-h-screen overflow-hidden bg-[hsl(var(--background))] bg-grid-pattern">
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/86 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-400 text-slate-950">
              <Zap className="h-5 w-5" />
            </span>
            <span className="font-semibold tracking-tight">Mantis AI</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[hsl(var(--muted-foreground))] md:flex">
            <Link href="/marketplace" className="hover:text-[hsl(var(--foreground))]">Marketplace</Link>
            <Link href="/product" className="hover:text-[hsl(var(--foreground))]">Product</Link>
            <Link href="/dashboard" className="hover:text-[hsl(var(--foreground))]">Dashboards</Link>
            <Link href="/dashboard/session" className="hover:text-[hsl(var(--foreground))]">AI Chat</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeButton />
            <Link href="/login" className="hidden rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm md:inline-flex">Sign in</Link>
            <Link href="/register" className="rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950">Start</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 px-4 py-8 md:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs text-[hsl(var(--muted-foreground))]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Multi-agent diagnostics for connected products
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight md:text-7xl">Mantis AI</h1>
              <p className="max-w-2xl text-lg leading-8 text-[hsl(var(--muted-foreground))]">
                A premium product support workspace for AI troubleshooting, 3D inspection, searchable manuals, fleet dashboards, and operational analytics.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/session" className="inline-flex h-11 items-center gap-2 rounded-md bg-cyan-400 px-4 text-sm font-semibold text-slate-950">
                Start diagnosis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className="inline-flex h-11 items-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-sm">
                Open dashboard
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {dashboardCards.map((card) => (
                <div key={card.label} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="text-lg font-semibold">{card.value}</p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{card.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="space-y-4">
            <ProductViewer3D selectedPart={selectedPart} onSelectPart={setSelectedPart} compact />
            <PartSummary part={selectedPart} />
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">Workspace</p>
              <h2 className="mt-2 text-2xl font-semibold">All core surfaces connected</h2>
            </div>
            <Link href="/dashboard" className="hidden items-center gap-2 text-sm text-cyan-400 md:flex">
              Explore <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {platform.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/50">
                  <Icon className="h-5 w-5 text-cyan-400" />
                  <p className="mt-3 font-medium">{item.label}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {products.map((product) => (
              <Link key={product.name} href="/product" className="overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition hover:-translate-y-0.5 hover:border-cyan-400/50">
                <div className="h-40" style={{ background: product.image }} />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{product.name}</h3>
                    <span className="text-sm text-cyan-400">{product.health}%</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{product.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
