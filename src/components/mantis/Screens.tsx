  "use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Filter,
  Lock,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Send,
  Shield,
  Sparkles,
  Upload,
  User,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api, getAuthState, type DiagnosticSession, type KnowledgeRecord } from "@/lib/api";
import { ProductViewer3D } from "./ProductViewer3D";
import {
  adminCards,
  analytics,
  dashboardCards,
  flowSteps,
  knowledgeItems,
  notifications,
  productParts,
  products,
  searchResults,
  sessions,
  ProductPart,
} from "./data";

const statuses: Record<string, string> = {
  Open: "border-red-400/30 bg-red-400/10 text-red-300",
  Triaged: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  Resolved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  Live: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  Certified: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  Beta: "border-amber-400/30 bg-amber-400/10 text-amber-300",
};

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-cyan-500 px-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
      {children}
    </button>
  );
}

function MetricCard({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string;
  value: string;
  change?: string;
  icon: LucideIcon;
}) {
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          {change && <p className="mt-1 text-xs text-emerald-400">{change}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
          <Icon className="h-4 w-4 text-cyan-400" />
        </div>
      </div>
    </Panel>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search products, manuals, sessions..."
        className="h-10 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] pl-9 pr-3 text-sm outline-none ring-cyan-400/30 transition focus:ring-4"
      />
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-12 animate-pulse rounded-md bg-[hsl(var(--secondary))]" />
      ))}
    </div>
  );
}

function ChartCanvas({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return <div className="h-full w-full animate-pulse rounded-md bg-[hsl(var(--secondary))]" />;
  }

  return <>{children}</>;
}

function SessionsTable() {
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-4">
        <h2 className="font-semibold">Live Diagnostic Queue</h2>
        <button className="rounded-md border border-[hsl(var(--border))] p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-[hsl(var(--muted-foreground))]">
            <tr className="border-b border-[hsl(var(--border))]">
              <th className="px-4 py-3 font-medium">Ticket</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Issue</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((row) => (
              <tr key={row[0]} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--secondary))]">
                {row.map((cell, index) => (
                  <td key={`${row[0]}-${cell}`} className="whitespace-nowrap px-4 py-3">
                    {index === 4 ? (
                      <span className={`rounded-full border px-2 py-1 text-xs ${statuses[cell]}`}>{cell}</span>
                    ) : (
                      <span className={index === 0 ? "font-mono text-xs text-cyan-400" : ""}>{cell}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function DiagnosticsChart() {
  return (
    <Panel className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Resolution Trend</h2>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">+18.4%</span>
      </div>
      <div className="h-64">
        <ChartCanvas>
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <AreaChart data={analytics}>
              <defs>
                <linearGradient id="resolved" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Area type="monotone" dataKey="resolved" stroke="#06b6d4" strokeWidth={2} fill="url(#resolved)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCanvas>
      </div>
    </Panel>
  );
}

function ProductCards() {
  return (
    <div className="min-w-0 grid gap-4 lg:grid-cols-3">
      {products.map((product) => (
        <Link
          key={product.name}
          href={`/dashboard/product?product=${encodeURIComponent(product.name)}`}
          className="group block"
        >
          <Panel className="overflow-hidden transition group-hover:-translate-y-0.5 group-hover:border-cyan-400/50">
            <div className="h-36" style={{ background: product.image }} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{product.category}</p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-xs ${statuses[product.status]}`}>{product.status}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{product.summary}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span>{product.price}</span>
                <span className="text-cyan-400">Health {product.health}%</span>
              </div>
            </div>
          </Panel>
        </Link>
      ))}
    </div>
  );
}

export function DashboardHome() {
  const [apiMetrics, setApiMetrics] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (!getAuthState()) return;
    api.userDashboard()
      .then((result) => setApiMetrics(result.data.metrics))
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="User dashboard"
        title="Support operations command center"
        description="Track active AI sessions, product health, manual coverage, and response quality across your connected fleet."
        action={<PrimaryButton><Zap className="h-4 w-4" /> New session</PrimaryButton>}
      />
      {apiMetrics && (
        <Panel className="p-4">
          <div className="grid gap-3 text-sm sm:grid-cols-4">
            <span>Sessions: <strong>{apiMetrics.totalDiagnosticSessions}</strong></span>
            <span>Resolved: <strong>{apiMetrics.resolvedSessions}</strong></span>
            <span>Open: <strong>{apiMetrics.openSessions}</strong></span>
            <span>Reviews: <strong>{apiMetrics.reviewsWritten}</strong></span>
          </div>
        </Panel>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => <MetricCard key={card.label} {...card} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <DiagnosticsChart />
        <SmartSearchPanel />
      </div>
      <SessionsTable />
    </div>
  );
}

function SmartSearchPanel() {
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<Array<{ title: string; tag: string; icon: LucideIcon }>>([]);
  const filtered = useMemo(() => {
    const search = query.trim();
    const isShort = search.length < 2;

    if (isShort) {
      return searchResults.filter(
        (result) =>
          result.title.toLowerCase().includes(search.toLowerCase()) ||
          result.tag.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (remoteResults.length > 0) return remoteResults;

    return searchResults.filter(
      (result) =>
        result.title.toLowerCase().includes(search.toLowerCase()) ||
        result.tag.toLowerCase().includes(search.toLowerCase()),
    );
  }, [query, remoteResults]);

  useEffect(() => {
    const search = query.trim();
    if (search.length < 2) return;

    const timeout = window.setTimeout(() => {
      api.search(search)
        .then((result) => {
          const productsFound = result.data.products.map((product) => ({ title: product.name, tag: "Product", icon: Zap }));
          const docsFound = result.data.knowledge.map((doc) => ({ title: doc.title, tag: "Manual", icon: FileText }));
          setRemoteResults([...productsFound, ...docsFound].slice(0, 5));
        })
        .catch(() => setRemoteResults([]));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query]);

  return (
    <Panel className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Smart Search</h2>
        <Filter className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
      </div>
      <SearchBar value={query} onChange={setQuery} />
      <div className="mt-4 space-y-2">
        {filtered.map((result) => {
          const Icon = result.icon;
          return (
            <button key={result.title} className="flex w-full items-center gap-3 rounded-md border border-[hsl(var(--border))] p-3 text-left transition hover:bg-[hsl(var(--secondary))]">
              <Icon className="h-4 w-4 text-cyan-400" />
              <span className="flex-1 text-sm">{result.title}</span>
              <span className="rounded-full bg-[hsl(var(--secondary))] px-2 py-1 text-[10px] text-[hsl(var(--muted-foreground))]">{result.tag}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function MarketplaceScreen() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const runSearch = (value: string) => {
    setQuery(value);
    setLoading(true);
    window.setTimeout(() => setLoading(false), 450);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace"
        title="Certified products and diagnostics"
        description="Browse connected products, compare support coverage, inspect manuals, and launch AI troubleshooting from the catalog."
        action={<PrimaryButton><Plus className="h-4 w-4" /> Add product</PrimaryButton>}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <SearchBar value={query} onChange={runSearch} />
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[hsl(var(--border))] px-3 text-sm">
              <Filter className="h-4 w-4" /> Filters
            </button>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[hsl(var(--border))] px-3 text-sm">
              Category <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Marketplace GMV</p>
          <p className="mt-1 text-2xl font-semibold">$4.8M</p>
        </Panel>
      </div>
      {loading ? <SkeletonRows /> : <ProductCards />}
    </div>
  );
}

function PartDetail({ part }: { part: ProductPart }) {
  const Icon = part.icon;
  return (
    <Panel className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-400/10 text-cyan-300">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">{part.name}</h2>
            <span className={`rounded-full border px-2 py-1 text-xs ${part.risk === "High" ? "border-red-400/30 bg-red-400/10 text-red-300" : part.risk === "Medium" ? "border-amber-400/30 bg-amber-400/10 text-amber-300" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"}`}>{part.risk}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{part.details}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-[hsl(var(--muted-foreground))]">Health score</span>
          <span>{part.health}%</span>
        </div>
        <div className="h-2 rounded-full bg-[hsl(var(--secondary))]">
          <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${part.health}%` }} />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {part.failures.map((failure) => (
          <div key={failure} className="flex items-center gap-2 rounded-md border border-[hsl(var(--border))] p-2 text-sm">
            <Shield className="h-4 w-4 text-amber-400" />
            {failure}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-md bg-[hsl(var(--secondary))] p-3 text-sm leading-6">{part.action}</div>
    </Panel>
  );
}

function Flowchart({ selectedPart, activeStep }: { selectedPart: ProductPart; activeStep: number }) {
  return (
    <Panel className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Troubleshooting Flow</h2>
        <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-xs text-cyan-300">{selectedPart.name}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {flowSteps.map((step, index) => (
          <motion.div
            key={step}
            layout
            className={`rounded-lg border p-3 text-sm ${
              index <= activeStep
                ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-100"
                : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
            }`}
          >
            <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--background))] text-xs">{index + 1}</div>
            <p className="font-medium">{step}</p>
            <p className="mt-1 text-xs opacity-80">{index <= activeStep ? "Updated by AI" : "Waiting"}</p>
          </motion.div>
        ))}
      </div>
    </Panel>
  );
}

function AIChat({ selectedPart, onProgress }: { selectedPart: ProductPart; onProgress: () => void }) {
  const [message, setMessage] = useState("");
  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState([
    { from: "ai", text: "Telemetry is ready. Select a component or describe the symptom." },
  ]);

  const send = async () => {
    if (pending) return;
    const text = message.trim() || `Start troubleshooting ${selectedPart.name}`;
    setMessages((items) => [...items, { from: "user", text }]);
    setMessage("");
    setPending(true);

    try {
      let activeSession = session;
      if (!activeSession && getAuthState()) {
        const productList = await api.products();
        const firstProduct = productList.data.products[0];
        if (firstProduct?._id) {
          const created = await api.createSession(firstProduct._id);
          activeSession = created.data.session;
          setSession(activeSession);
        }
      }

      if (activeSession?._id) {
        const response = await api.sendSessionMessage(activeSession._id, text);
        const latest = response.data.chatHistory.at(-1);
        setMessages((items) => [...items, { from: "ai", text: latest?.message || `${selectedPart.name}: ${selectedPart.action}` }]);
      } else {
        setMessages((items) => [...items, { from: "ai", text: `${selectedPart.name}: ${selectedPart.action}` }]);
      }
      onProgress();
    } catch {
      setMessages((items) => [...items, { from: "ai", text: `${selectedPart.name}: ${selectedPart.action}` }]);
      onProgress();
    } finally {
      setPending(false);
    }
  };

  return (
    <Panel className="flex min-h-[430px] flex-col overflow-hidden">
      <div className="border-b border-[hsl(var(--border))] p-4">
        <h2 className="font-semibold">AI Chat Interface</h2>
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Context: {selectedPart.name}</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <AnimatePresence initial={false}>
          {messages.map((item, index) => (
            <motion.div
              key={`${item.from}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[88%] rounded-lg px-3 py-2 text-sm leading-6 ${item.from === "user" ? "ml-auto bg-cyan-500 text-slate-950" : "bg-[hsl(var(--secondary))]"}`}
            >
              {item.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="border-t border-[hsl(var(--border))] p-3">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && send()}
            placeholder={`Ask about ${selectedPart.name.toLowerCase()}...`}
            className="h-10 flex-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm outline-none ring-cyan-400/30 focus:ring-4"
          />
          <button onClick={send} disabled={pending} className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-500 text-slate-950 disabled:opacity-60">
            {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </Panel>
  );
}

export function ProductScreen() {
  const searchParams = useSearchParams();
  const productName = searchParams.get("product");

  const mapProductNameToPart = (name: string | null | undefined): ProductPart => {
    const product = products.find((p) => p.name === name);

    // Default behavior if no query present
    if (!product) return productParts[2] ?? productParts[0];

    const isAeroCool = product.name === "AeroCool X200 Compressor";

    if (isAeroCool) {
      const compressor = productParts.find((p) => p.id === "compressor");
      return compressor ?? productParts[2] ?? productParts[0];
    }

    // For other products, pick a deterministic alternative part so switching is visible.
    // Prefer pump if present; otherwise choose the first non-compressor part.
    const pump = productParts.find((p) => p.id === "pump");
    if (pump) return pump;

    const nonCompressor = productParts.find((p) => p.id !== "compressor");
    return nonCompressor ?? productParts[2] ?? productParts[0];
  };

  const defaultPart = useMemo(() => mapProductNameToPart(productName), [productName]);
  const [selectedPart, setSelectedPart] = useState<ProductPart>(() => defaultPart);

  const openAeroCoolMoreInfo = () => {
    window.open("https://aerocool.io/product/p500b-digi", "_blank", "noopener,noreferrer");
  };

  const openVoltaEdgeBatteryB45MoreInfo = () => {
    window.open("https://www.everyonechoice.com/battery/volta-drive-55b24l-45-ah", "_blank", "noopener,noreferrer");
  };

  const openVoltaEdgeBatteryB45Secondary = () => {
    // User requested: "VoltEdge Battery B45" (VoltaEdge / VoltEdge spelling varies in requests)
    window.open("https://www.everyonechoice.com/battery/volta-drive-55b24l-45-ah", "_blank", "noopener,noreferrer");
  };

  const goInsideAeroCoolX200 = () => {
    const compressor = productParts.find((p) => p.id === "compressor");
    if (compressor) setSelectedPart(compressor);
  };

  const headerTitle =
    productName && products.some((p) => p.name === productName) ? productName : "AeroCool X200 Compressor";

  return (
    <div key={productName ?? "default-product"} className="space-y-6">
      <PageHeader
        eyebrow="Product page"
        title={headerTitle}
        description="Inspect the connected product twin, review component state, open manuals, play service media, and begin guided diagnosis."
        action={<PrimaryButton><MessageSquare className="h-4 w-4" /> Troubleshoot</PrimaryButton>}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <ProductViewer3D selectedPart={selectedPart} onSelectPart={setSelectedPart} />
        <PartDetail part={selectedPart} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MediaPanel type="PDF Viewer" icon={FileText} title="Service manual v4.2" actionIcon={Download} />
        <MediaPanel type="Video Viewer" icon={Play} title="Pressure loop teardown" actionIcon={Eye} />

        <Panel className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Product Gallery</h2>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Tap a product to focus its component.</p>
            </div>

            <button
              type="button"
              onClick={openAeroCoolMoreInfo}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm font-semibold text-cyan-200 transition hover:bg-[hsl(var(--secondary))]/70"
              aria-label="More information about AeroCool X200"
            >
              More information
            </button>
          </div>

          {(productName?.toLowerCase().includes("b45") || productName?.toLowerCase().includes("voltaedge")) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openVoltaEdgeBatteryB45MoreInfo}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm font-semibold text-cyan-200 transition hover:bg-[hsl(var(--secondary))]/70"
                aria-label="More information about VoltaEdge Battery B45"
              >
                VoltaEdge Battery B45 - link
              </button>

              <button
                type="button"
                onClick={openVoltaEdgeBatteryB45Secondary}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm font-semibold text-cyan-200 transition hover:bg-[hsl(var(--secondary))]/70"
                aria-label="VoltaEdge Battery B45 secondary link"
              >
                VoltaEdge Battery B45 - more info
              </button>
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2">
            {products.map((product) => {
              const isAeroCool = product.name === "AeroCool X200 Compressor";

              const mapProductToPart = (): ProductPart => {
                if (isAeroCool) {
                  const compressor = productParts.find((p) => p.id === "compressor");
                  return compressor ?? productParts[2] ?? productParts[0];
                }
                const pump = productParts.find((p) => p.id === "pump");
                if (pump) return pump;

                const nonCompressor = productParts.find((p) => p.id !== "compressor");
                return nonCompressor ?? productParts[2] ?? productParts[0];
              };

              return (
                <button
                  key={product.name}
                  type="button"
                  onClick={() => {
                    if (isAeroCool) {
                      goInsideAeroCoolX200();
                      return;
                    }
                    setSelectedPart(mapProductToPart());
                  }}
                  className="aspect-square rounded-md text-left transition hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-cyan-400/30"
                  style={{ background: product.image }}
                  aria-label={product.name}
                />
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function MediaPanel({
  type,
  title,
  icon: Icon,
  actionIcon: ActionIcon,
}: {
  type: string;
  title: string;
  icon: LucideIcon;
  actionIcon: LucideIcon;
}) {
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{type}</p>
          <h2 className="mt-1 font-semibold">{title}</h2>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-md border border-[hsl(var(--border))]">
          <ActionIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex aspect-video items-center justify-center rounded-md border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
        <Icon className="h-10 w-10 text-cyan-400" />
      </div>
    </Panel>
  );
}

export function SessionScreen() {
  const [selectedPart, setSelectedPart] = useState(productParts[0]);
  const [step, setStep] = useState(1);
  const advance = () => setStep((value) => Math.min(value + 1, flowSteps.length - 1));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI diagnostics"
        title="Interactive troubleshooting session"
        description="Click a component in the 3D viewer to focus the chat, part details, common failures, and live troubleshooting flow."
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <ProductViewer3D selectedPart={selectedPart} onSelectPart={(part) => { setSelectedPart(part); setStep(1); }} compact />
        <AIChat selectedPart={selectedPart} onProgress={advance} />
      </div>
      <Flowchart selectedPart={selectedPart} activeStep={step} />
      <PartDetail part={selectedPart} />
    </div>
  );
}

export function KnowledgeScreen() {
  const [query, setQuery] = useState("");
  const [remoteItems, setRemoteItems] = useState<KnowledgeRecord[]>([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const filtered = remoteItems.length > 0
    ? remoteItems.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()) || item.tags.join(" ").toLowerCase().includes(query.toLowerCase()))
    : knowledgeItems.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()) || item.type.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    api.knowledge()
      .then((result) => setRemoteItems(result.data.kbEntries))
      .catch(() => undefined);
  }, []);

  const uploadDocument = async (file: File | undefined) => {
    if (!file) return;
    setUploadMessage("Uploading document...");
    const formData = new FormData();
    formData.append("title", file.name.replace(/\.[^.]+$/, ""));
    formData.append("tags", JSON.stringify(["upload", "manual"]));
    formData.append("content", `Uploaded operational knowledge document: ${file.name}`);
    formData.append("file", file);

    try {
      const result = await api.uploadKnowledge(formData);
      setRemoteItems((items) => [result.data.kbEntry, ...items]);
      setUploadMessage("Document indexed successfully");
    } catch (err) {
      setUploadMessage(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Knowledge repository"
        title="Manuals, videos, and AI citations"
        description="Search indexed service content, inspect source confidence, preview media, and upload new operational knowledge."
        action={
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept=".pdf,.txt,.doc,.docx,image/png,image/jpeg,image/webp"
              onChange={(event) => uploadDocument(event.target.files?.[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-cyan-500 px-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <Upload className="h-4 w-4" /> Upload
            </button>
          </>
        }
      />
      {uploadMessage && <Panel className="p-3 text-sm">{uploadMessage}</Panel>}
      <SearchBar value={query} onChange={setQuery} />
      <Panel className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-[hsl(var(--muted-foreground))]">
            <tr className="border-b border-[hsl(var(--border))]">
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.title} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--secondary))]">
                <td className="px-4 py-3 font-medium">{item.title}</td>
                <td className="px-4 py-3">{"type" in item ? item.type : item.tags.join(", ") || "Document"}</td>
                <td className="px-4 py-3">{"owner" in item ? item.owner : item.productId?.name || "Workspace"}</td>
                <td className="px-4 py-3 text-cyan-400">{"confidence" in item ? item.confidence : "Indexed"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <MediaPanel type="PDF Viewer" title="Compressor pressure loss diagnostics" icon={FileText} actionIcon={Eye} />
        <MediaPanel type="Video Viewer" title="Pump priming and air lock checklist" icon={Play} actionIcon={Eye} />
      </div>
    </div>
  );
}

export function AnalyticsScreen() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics dashboard"
        title="Diagnostics intelligence"
        description="Monitor resolution quality, escalation patterns, fleet health, and model confidence across operating teams."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="AI accuracy" value="96.2%" change="+2.4%" icon={Sparkles} />
        <MetricCard label="Escalation rate" value="7.8%" change="-1.6%" icon={Shield} />
        <MetricCard label="SLA hit rate" value="98.1%" change="+4.2%" icon={CheckCircle2} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <DiagnosticsChart />
        <Panel className="p-4">
          <h2 className="mb-4 font-semibold">Escalations by Day</h2>
          <div className="h-64">
            <ChartCanvas>
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <ReBarChart data={analytics}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="escalated" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </ChartCanvas>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function NotificationsScreen() {
  const [toast, setToast] = useState("Notification rules updated");
  const [remoteNotifications, setRemoteNotifications] = useState<Array<{ id: string; title: string; message: string; read: boolean; createdAt: string }>>([]);

  useEffect(() => {
    if (!getAuthState()) return;
    api.notifications()
      .then((result) => setRemoteNotifications(result.data.notifications))
      .catch(() => undefined);
  }, []);

  const acknowledge = async (id: string, title: string) => {
    try {
      await api.acknowledgeNotification(id);
      setRemoteNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));
      setToast(`${title} acknowledged`);
    } catch {
      setToast(`${title} acknowledged locally`);
    }
  };

  if (remoteNotifications.length > 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Notifications"
          title="Alerts and operational signals"
          description="Review high-priority product events, AI confidence updates, manual indexing jobs, and team routing rules."
          action={<PrimaryButton><Bell className="h-4 w-4" /> Rules</PrimaryButton>}
        />
        <div className="space-y-3">
          {remoteNotifications.map((item) => (
            <Panel key={item.id} className="p-4">
              <div className="flex items-center gap-3">
                <Bell className={`h-5 w-5 ${item.read ? "text-[hsl(var(--muted-foreground))]" : "text-cyan-400"}`} />
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.message}</p>
                </div>
                <button onClick={() => acknowledge(item.id, item.title)} className="rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm">Acknowledge</button>
              </div>
            </Panel>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Alerts and operational signals"
        description="Review high-priority product events, AI confidence updates, manual indexing jobs, and team routing rules."
        action={<PrimaryButton><Bell className="h-4 w-4" /> Rules</PrimaryButton>}
      />
      <div className="space-y-3">
        {notifications.map((item) => {
          const Icon = item.icon;
          return (
            <Panel key={item.title} className="p-4">
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${item.tone}`} />
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.meta}</p>
                </div>
                <button onClick={() => setToast(`${item.title} acknowledged`)} className="rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm">Acknowledge</button>
              </div>
            </Panel>
          );
        })}
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-sm shadow-xl"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {toast}
            <button onClick={() => setToast("")}><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProfileScreen() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Profile" title="Operator profile" description="Manage identity, role, team context, and diagnostic handoff preferences." />
      <Panel className="p-5">
        <div className="flex flex-col gap-5 md:flex-row">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-cyan-400 text-2xl font-semibold text-slate-950">JD</div>
          <div className="grid flex-1 gap-4 md:grid-cols-2">
            <Input label="Name" icon={User} value="John Doe" />
            <Input label="Email" icon={Mail} value="john@mantis.ai" />
            <Input label="Role" icon={Shield} value="Service Lead" />
            <Input label="Security" icon={Lock} value="SAML enabled" />
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Input({ label, icon: Icon, value }: { label: string; icon: LucideIcon; value: string }) {
  return (
    <label className="block">
      <span className="text-xs text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="mt-1 flex h-10 items-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm">
        <Icon className="h-4 w-4 text-cyan-400" />
        {value}
      </span>
    </label>
  );
}

export function SettingsScreen() {
  const settings = ["AI safety validation", "Weekly analytics digest", "Auto-index uploaded manuals", "Escalate high-voltage tasks"];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" title="Workspace controls" description="Tune model behavior, notification routing, data retention, billing surfaces, and integrations." />
      <div className="grid gap-4 lg:grid-cols-2">
        {settings.map((setting, index) => (
          <Panel key={setting} className="p-4">
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block font-medium">{setting}</span>
                <span className="mt-1 block text-sm text-[hsl(var(--muted-foreground))]">Applies to all active diagnostic sessions.</span>
              </span>
              <input type="checkbox" defaultChecked={index !== 1} className="h-5 w-5 accent-cyan-400" />
            </label>
          </Panel>
        ))}
      </div>
    </div>
  );
}

export function AdminScreen() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin dashboard" title="Platform governance" description="Supervise tenants, users, audit events, model performance, and safety workflow exceptions." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminCards.map((card) => <MetricCard key={card.label} label={card.label} value={card.value} icon={card.icon} />)}
      </div>
      <SessionsTable />
    </div>
  );
}

export function CompanyScreen() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Company dashboard" title="Fleet and support performance" description="Coordinate product fleets, service engineers, support queues, and knowledge coverage for one organization." />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <DiagnosticsChart />
        <Panel className="p-4">
          <h2 className="font-semibold">Service Teams</h2>
          {["North America", "EMEA", "APAC", "Critical Escalation"].map((team, index) => (
            <div key={team} className="mt-3 flex items-center justify-between rounded-md border border-[hsl(var(--border))] p-3 text-sm">
              <span>{team}</span>
              <span className="text-cyan-400">{24 - index * 4} active</span>
            </div>
          ))}
        </Panel>
      </div>
      <ProductCards />
    </div>
  );
}
