"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { PROMPT_TEMPLATES } from "@/lib/templates";

type ProviderForm = {
  id?: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  isPrimary: boolean;
};

function createProvider(name = "Provider") : ProviderForm {
  return {
    name,
    baseUrl: "",
    apiKey: "",
    model: "",
    enabled: true,
    isPrimary: false,
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [siteName, setSiteName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [providers, setProviders] = useState<ProviderForm[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const res = await fetch("/api/models", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingModels(false);
    }
  }, []);

  const checkAuthAndLoad = useCallback(async () => {
    // Check auth first
    const authRes = await fetch("/api/settings");
    if (authRes.status === 401) {
      router.push("/login");
      return;
    }
    if (authRes.ok) {
      const data = await authRes.json();
      setSiteName(data.siteName || "");
      setSystemPrompt(data.systemPrompt || "");
      setProviders(
        (data.providerConfigs || []).map((p: ProviderForm) => ({
          id: p.id,
          name: p.name || "Provider",
          baseUrl: p.baseUrl || "",
          apiKey: "",
          model: p.model || "",
          enabled: p.enabled ?? true,
          isPrimary: !!p.isPrimary,
        }))
      );
    }
    setLoading(false);
    // Then load models
    fetchModels();
  }, [router, fetchModels]);

  async function handleTestProvider() {
    setTesting(true);
    setTestResult(null);

    const provider = providers.find((p) => p.isPrimary) || providers[0];
    if (!provider) {
      setTestResult({ success: false, message: "Belum ada provider" });
      setTesting(false);
      return;
    }

    try {
      const res = await fetch("/api/test-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.id,
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey || "existing",
          model: provider.model,
        }),
      });

      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.success ? data.message : data.error,
      });
    } catch {
      setTestResult({ success: false, message: "Gagal menghubungi server" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setError("");
    setMessage("");
    setSaving(true);

    const payload: Record<string, unknown> = {};
    if (siteName) payload.siteName = siteName;
    if (systemPrompt) payload.systemPrompt = systemPrompt;
    if (providers.length > 0) {
      payload.providerConfigs = providers;
    }
    if (currentPassword && newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menyimpan");
        return;
      }

      setMessage("Settings berhasil disimpan");
      setProviders((prev) => prev.map((p) => ({ ...p, apiKey: "" })));
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkAuthAndLoad();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [checkAuthAndLoad]);

  function updateProvider(index: number, patch: Partial<ProviderForm>) {
    setProviders((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addProvider() {
    setProviders((prev) => [...prev, createProvider(`Provider ${prev.length + 1}`)]);
  }

  function removeProvider(index: number) {
    setProviders((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (!next.some((p) => p.isPrimary) && next[0]) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  }

  function moveProvider(index: number, delta: number) {
    setProviders((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function setPrimaryProvider(index: number) {
    setProviders((prev) => prev.map((p, i) => ({ ...p, isPrimary: i === index })));
  }

  const canSaveProviders =
    providers.length > 0 &&
    providers.every((provider) => provider.name.trim() && provider.baseUrl.trim() && provider.model.trim()) &&
    providers.some((provider) => provider.enabled);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-12">
          <button
            onClick={() => router.push("/chat")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Logout
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !canSaveProviders}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Notifications */}
        {error && (
          <div className="p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
            {error}
          </div>
        )}
        {message && (
          <div className="p-3 text-sm bg-accent/10 text-accent border border-accent/20 rounded-lg">
            {message}
          </div>
        )}

        {/* General */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-4">Umum</h2>
          <div className="space-y-4 p-4 rounded-xl bg-card border border-border">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Nama Website
              </label>
              <input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
          </div>
        </section>

        {/* System Prompt */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-4">
            System Prompt
          </h2>
          <div className="space-y-4 p-4 rounded-xl bg-card border border-border">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Template
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROMPT_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSystemPrompt(tpl.prompt)}
                    className={`text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      systemPrompt === tpl.prompt
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "bg-secondary text-muted-foreground border border-border hover:border-accent/30 hover:text-foreground"
                    }`}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
          </div>
        </section>

        {/* Provider Chain */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-4">
            Provider AI
          </h2>
          <div className="space-y-4 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Urutan atas ke bawah. 1 primary, sisanya fallback.
              </p>
              <button
                type="button"
                onClick={addProvider}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-accent/30 transition-colors"
              >
                <Plus size={14} />
                Tambah Provider
              </button>
            </div>

            <div className="space-y-3">
              {providers.map((provider, index) => (
                <div key={provider.id || index} className="p-4 rounded-xl border border-border bg-background/40 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => moveProvider(index, -1)} className="p-1 rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={index === 0}><ChevronUp size={14} /></button>
                      <button type="button" onClick={() => moveProvider(index, 1)} className="p-1 rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={index === providers.length - 1}><ChevronDown size={14} /></button>
                      <span className="text-xs font-medium text-foreground">{index + 1}. {provider.isPrimary ? "Primary" : "Fallback"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setPrimaryProvider(index)} className={`text-xs px-2 py-1 rounded border ${provider.isPrimary ? "border-accent text-accent" : "border-border text-muted-foreground hover:text-foreground"}`}>Jadi Primary</button>
                      <button type="button" onClick={() => removeProvider(index)} className="p-1 rounded border border-border text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Nama</label>
                      <input value={provider.name} onChange={(e) => updateProvider(index, { name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Base URL</label>
                      <input value={provider.baseUrl} onChange={(e) => updateProvider(index, { baseUrl: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">API Key {provider.id ? "(kosongkan jika tidak diubah)" : ""}</label>
                      <input type="password" value={provider.apiKey} onChange={(e) => updateProvider(index, { apiKey: e.target.value })} placeholder={provider.id ? "API key baru" : "sk-..."} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Model</label>
                      {models.length > 0 ? (
                        <select value={provider.model} onChange={(e) => updateProvider(index, { model: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all">
                          {!models.includes(provider.model) && provider.model && <option value={provider.model}>{provider.model}</option>}
                          {models.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      ) : (
                        <input value={provider.model} onChange={(e) => updateProvider(index, { model: e.target.value })} placeholder={loadingModels ? "Memuat model..." : "Masukkan nama model"} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all" />
                      )}
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input type="checkbox" checked={provider.enabled} onChange={(e) => updateProvider(index, { enabled: e.target.checked })} />
                      Aktif
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTestProvider}
                disabled={testing || providers.length === 0}
                className="px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {testing ? "Testing..." : "Test Primary"}
              </button>
              {testResult && (
                <div className={`p-2 rounded-lg text-xs ${testResult.success ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-sm font-medium text-foreground mb-4">
            Ubah Password
          </h2>
          <div className="space-y-4 p-4 rounded-xl bg-card border border-border">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Password Lama
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Password Baru
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
