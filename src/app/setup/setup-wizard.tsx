"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROMPT_TEMPLATES } from "@/lib/templates";
import { Check } from "lucide-react";

const STEPS = ["Akun Admin", "Website", "System Prompt", "Provider AI"];

export function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [siteName, setSiteName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(PROMPT_TEMPLATES[0].prompt);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [providerBaseUrl, setProviderBaseUrl] = useState(
    "https://api.openai.com/v1"
  );
  const [providerApiKey, setProviderApiKey] = useState("");
  const [providerModel, setProviderModel] = useState("gpt-4o-mini");

  const totalSteps = 4;

  function nextStep() {
    setError("");

    if (step === 1) {
      if (!username || username.length < 3) {
        setError("Username minimal 3 karakter");
        return;
      }
      if (!password || password.length < 6) {
        setError("Password minimal 6 karakter");
        return;
      }
      if (password !== confirmPassword) {
        setError("Password tidak cocok");
        return;
      }
    }

    if (step === 2) {
      if (!siteName) {
        setError("Nama website harus diisi");
        return;
      }
    }

    if (step === 3) {
      if (!systemPrompt) {
        setError("System prompt harus diisi");
        return;
      }
    }

    setStep(step + 1);
  }

  function prevStep() {
    setError("");
    setStep(step - 1);
  }

  async function handleSubmit() {
    setError("");

    if (!providerBaseUrl || !providerApiKey || !providerModel) {
      setError("Semua field provider harus diisi");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          siteName,
          systemPrompt,
          providerBaseUrl,
          providerApiKey,
          providerModel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Setup gagal");
        return;
      }

      router.push("/login");
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                i + 1 < step
                  ? "bg-accent text-accent-foreground"
                  : i + 1 === step
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}
            >
              {i + 1 < step ? <Check size={14} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-8 h-px ${
                  i + 1 < step ? "bg-accent" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="mb-6">
          <h2 className="text-base font-medium text-foreground">
            {STEPS[step - 1]}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Langkah {step} dari {totalSteps}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Nama Website
              </label>
              <input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="OpenChat"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Template
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROMPT_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(i);
                      setSystemPrompt(tpl.prompt);
                    }}
                    className={`text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      selectedTemplate === i
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
                System Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                placeholder="Tulis system prompt..."
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Base URL
              </label>
              <input
                value={providerBaseUrl}
                onChange={(e) => setProviderBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                API Key
              </label>
              <input
                type="password"
                value={providerApiKey}
                onChange={(e) => setProviderApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Model
              </label>
              <input
                value={providerModel}
                onChange={(e) => setProviderModel(e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground border border-border hover:border-accent/30 transition-colors"
            >
              Kembali
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              onClick={nextStep}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Lanjut
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Menyimpan..." : "Selesai"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
