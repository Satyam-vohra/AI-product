"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, User, Building, ArrowRight, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

const roles = [
  { value: "User", label: "Individual User", desc: "Get AI diagnostics for your products" },
  { value: "Company", label: "Company", desc: "Manage products, engineers & support" },
  { value: "ServiceEngineer", label: "Service Engineer", desc: "Handle escalated diagnostic tickets" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("User");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    domain: "",
    companyId: "",
  });

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: selectedRole,
        companyName: selectedRole === "Company" ? form.companyName : undefined,
        domain: selectedRole === "Company" ? form.domain : undefined,
        companyId: selectedRole === "ServiceEngineer" ? form.companyId : undefined,
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid-pattern relative py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg mx-4"
      >
        <div className="glow-card p-8 rounded-2xl">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
              Join Mantis AI to access intelligent diagnostics
            </p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRole(r.value)}
                className={`p-3 rounded-xl border text-center transition-all text-xs ${
                  selectedRole === r.value
                    ? "border-violet-500 bg-violet-500/10 text-violet-400"
                    : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--muted-foreground))]"
                }`}
              >
                <span className="font-semibold block">{r.label}</span>
                <span className="mt-0.5 block opacity-70 leading-tight">{r.desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all placeholder:text-[hsl(var(--muted-foreground))]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all placeholder:text-[hsl(var(--muted-foreground))]"
                  required
                />
              </div>
            </div>

            {selectedRole === "Company" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <label className="text-sm font-medium">Company Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(event) => update("companyName", event.target.value)}
                    placeholder="Acme Corporation"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all placeholder:text-[hsl(var(--muted-foreground))]"
                    required
                  />
                </div>
              </motion.div>
            )}

            {selectedRole === "Company" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Domain</label>
                <input
                  type="text"
                  value={form.domain}
                  onChange={(event) => update("domain", event.target.value)}
                  placeholder="acme.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all placeholder:text-[hsl(var(--muted-foreground))]"
                  required
                />
              </div>
            )}

            {selectedRole === "ServiceEngineer" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Company ID</label>
                <input
                  type="text"
                  value={form.companyId}
                  onChange={(event) => update("companyId", event.target.value)}
                  placeholder="Mongo company id from your administrator"
                  className="w-full px-4 py-2.5 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all placeholder:text-[hsl(var(--muted-foreground))]"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => update("password", event.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all placeholder:text-[hsl(var(--muted-foreground))]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            {error && (
              <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200" role="alert">
                {error}
              </p>
            )}
          </form>

          <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
