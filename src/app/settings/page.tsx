"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { PROMPT_TEMPLATES } from "@/lib/templates";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [siteName, setSiteName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [providerBaseUrl, setProviderBaseUrl] = useState("");
  const [providerApiKey, setProviderApiKey] = useState("");
  const [providerModel, setProviderModel] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  async function checkAuthAndLoad() {
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
      setProviderBaseUrl(data.providerBaseUrl || "");
      setProviderModel(data.providerModel || "");
    }
    setLoading(false);
    // Then load models
    fetchModels();
  }

  async function fetchModels() {
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
  }

  async function handleTestProvider() {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/test-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: providerBaseUrl,
          apiKey: providerApiKey || "existing",
          model: providerModel,
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

    const payload: Record<string, string> = {};
    if (siteName) payload.siteName = siteName;
    if (systemPrompt) payload.systemPrompt = systemPrompt;
    if (providerBaseUrl) payload.providerBaseUrl = providerBaseUrl;
    if (providerApiKey) payload.providerApiKey = providerApiKey;
    if (providerModel) payload.providerModel = providerModel;
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
      setProviderApiKey("");
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
              disabled={saving}
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

        {/* Provider */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-4">
            Provider AI
          </h2>
          <div className="space-y-4 p-4 rounded-xl bg-card border border-border">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Base URL
              </label>
              <input
                value={providerBaseUrl}
                onChange={(e) => setProviderBaseUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                API Key (kosongkan jika tidak ingin mengubah)
              </label>
              <input
                type="password"
                value={providerApiKey}
                onChange={(e) => setProviderApiKey(e.target.value)}
                placeholder="Masukkan API key baru..."
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Model
              </label>
              {models.length > 0 ? (
                <select
                  value={providerModel}
                  onChange={(e) => setProviderModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                >
                  {!models.includes(providerModel) && providerModel && (
                    <option value={providerModel}>{providerModel}</option>
                  )}
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={providerModel}
                  onChange={(e) => setProviderModel(e.target.value)}
                  placeholder={loadingModels ? "Memuat model..." : "Masukkan nama model"}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                />
              )}
            </div>
            {/* Test button */}
            <div>
              <button
                onClick={handleTestProvider}
                disabled={testing || !providerBaseUrl || !providerModel}
                className="px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {testing ? "Testing..." : "Test Connection"}
              </button>
              {testResult && (
                <div
                  className={`mt-2 p-2 rounded-lg text-xs ${
                    testResult.success
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                >
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
