"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChatArea } from "./chat-area";
import { ChatSidebar } from "./chat-sidebar";
import { useTheme } from "@/components/theme-provider";
import { getBrowserId } from "@/lib/browser-id";
import { Sun, Moon, Settings, PanelLeftClose, PanelLeft } from "lucide-react";

export default function ChatPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [siteName, setSiteName] = useState("OpenChat");

  useEffect(() => {
    // Initialize browser ID
    getBrowserId();

    // Check if admin is logged in
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.username) setIsAdmin(true);
      })
      .catch(() => {});

    // Get site name
    fetch("/api/setup/check")
      .then((r) => r.json())
      .then((data) => {
        if (data.siteName) setSiteName(data.siteName);
      })
      .catch(() => {});
  }, []);

  function handleNewChat() {
    setSessionId(null);
  }

  const handleSessionCreated = useCallback((id: string, _title: string) => {
    setSessionId(id);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-[260px]" : "w-0"
        } transition-all duration-200 ease-in-out overflow-hidden flex-shrink-0`}
      >
        <ChatSidebar
          currentSessionId={sessionId}
          onSelectSession={setSessionId}
          onNewChat={handleNewChat}
          refreshKey={refreshKey}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 h-12 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <PanelLeftClose size={18} />
              ) : (
                <PanelLeft size={18} />
              )}
            </button>
            <span className="text-sm font-medium text-foreground">
              {siteName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {isAdmin && (
              <button
                onClick={() => router.push("/settings")}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Settings"
              >
                <Settings size={18} />
              </button>
            )}
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden">
          <ChatArea
            sessionId={sessionId}
            onSessionCreated={handleSessionCreated}
          />
        </div>
      </div>
    </div>
  );
}
