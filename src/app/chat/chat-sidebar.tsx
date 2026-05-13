"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Session {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  refreshKey: number;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}h lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export function ChatSidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  refreshKey,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetchSessions();
  }, [refreshKey]);

  async function fetchSessions() {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // Ignore
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions(sessions.filter((s) => s.id !== id));
        if (currentSessionId === id) {
          onNewChat();
        }
      }
    } catch {
      // Ignore
    }
  }

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* New chat button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
        >
          <Plus size={16} />
          Chat Baru
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        <div className="space-y-0.5">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`group flex items-center rounded-lg cursor-pointer transition-colors ${
                currentSessionId === s.id
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <button
                onClick={() => onSelectSession(s.id)}
                className="flex-1 text-left px-3 py-2 min-w-0"
              >
                <div className="text-sm truncate">{s.title}</div>
                <div className="text-xs text-muted-foreground/70 mt-0.5">
                  {timeAgo(s.updatedAt)}
                </div>
              </button>
              <button
                onClick={(e) => handleDelete(e, s.id)}
                className="hidden group-hover:flex items-center justify-center p-1.5 mr-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Delete session"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground/60 px-3 py-4 text-center">
              Belum ada riwayat chat
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
