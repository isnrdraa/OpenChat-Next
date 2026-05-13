# OpenChat

> Lightweight self-hosted AI chatbot platform with modern web UI.
> Inspired by OpenWebUI, ChatGPT, and OpenCode.
> Deploy in under 5 minutes.

---

## ✨ Preview

* ⚡ Public chat tanpa login
* 🤖 Support semua provider format OpenAI
* 🌙 Modern dark mode interface
* 🔒 API key aman di server
* 📦 Self-hosted & lightweight
* 🚀 Setup wizard otomatis

---

# ✨ Features

## 💬 Chat Experience

* Public chat tanpa perlu login
* Real-time streaming response
* Markdown rendering + syntax highlighting
* Riwayat chat tersimpan per browser
* Responsive UI untuk desktop & mobile

---

## 🤖 AI Provider Support

Kompatibel dengan semua provider yang menggunakan format API OpenAI:

* OpenAI
* OpenRouter
* Ollama
* vLLM
* LM Studio
* dan provider kompatibel lainnya

### Fitur Provider

* Auto-detect model list
* Test connection langsung dari dashboard
* Streaming response server-side
* API key tidak pernah terekspos ke client

---

## 🛠️ Admin Panel

* First-run setup wizard
* Konfigurasi tanpa restart server
* Model selector dropdown
* System prompt templates:

  * General Assistant
  * Customer Support
  * Coding Assistant
  * Roleplay
  * Custom Prompt

---

## 🎨 UI & Design

* Dark mode default
* Toggle dark/light theme
* Sidebar collapsible
* Modern OpenCode-inspired warm accent
* Clean & minimal interface
* Lightweight dan cepat

---

## 🔐 Security

* Rate limiting untuk login & chat
* Browser identity dengan HMAC signature
* JWT authentication middleware
* Markdown sanitization (XSS protection)
* API key aman di server
* Session isolation antar browser

---

# 🧱 Tech Stack

| Technology               | Description                      |
| ------------------------ | -------------------------------- |
| Next.js 16               | Fullstack framework (App Router) |
| React 19                 | UI library                       |
| TypeScript               | Type safety                      |
| Tailwind CSS v4          | Styling                          |
| shadcn/ui                | UI components                    |
| PostgreSQL               | Database                         |
| Prisma 7                 | ORM & schema management          |
| Jose                     | JWT authentication               |
| Bcrypt                   | Password hashing                 |
| Zod                      | Validation                       |
| react-markdown           | Markdown rendering               |
| react-syntax-highlighter | Code highlighting                |
| rehype-sanitize          | XSS protection                   |

---

# 🏗️ Architecture

```txt
Browser (Public/Admin)
    |
    v
[ Next.js App Router ]
    |
    +-- /chat .............. Public chat UI
    +-- /login ............. Admin login
    +-- /settings .......... Protected admin settings
    +-- /setup ............. First-run setup wizard
    |
    +-- /api/chat .......... LLM proxy (streaming)
    +-- /api/sessions ...... Chat session CRUD
    +-- /api/browser ....... Browser identity
    +-- /api/settings ...... App configuration
    +-- /api/models ........ Provider model list
    +-- /api/test-provider . Provider connection test
    |
    v
[ PostgreSQL ]
    - users
    - app_settings
    - chat_sessions
    - messages
```

---

# ⚙️ Application Flow

```txt
First Deploy
    ↓
Setup Wizard
    ↓
Configure Admin + AI Provider
    ↓
Application Ready
    ↓
Public Chat Accessible
```

Admin login hanya diperlukan untuk mengakses settings.

---

# 📦 Requirements

* Node.js 20+
* PostgreSQL 14+

---

# 🚀 Installation

## 1. Clone Repository

```bash
git clone git@github.com:isnrdraa/OpenChat-Next.git
cd OpenChat-Next
```

---

## 2. Install Dependencies

```bash
NODE_ENV=development npm install
```

---

## 3. Configure Environment

```bash
cp .env.example .env
```

Isi `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/openchat"
AUTH_SECRET="random-secret-string-minimal-32-karakter"
```

Generate secret:

```bash
openssl rand -base64 32
```

---

## 4. Setup Database

```bash
npx prisma generate
npx prisma db push
```

---

## 5. Run Development Server

```bash
NODE_ENV=development npx next dev -p 3000
```

Buka:

```txt
http://localhost:3000
```

---

# 🌐 Deployment

## Production Build

```bash
NODE_ENV=production npm run build
npm start
```

Default berjalan di:

```txt
http://localhost:3000
```

---

## 🐳 Docker Notes

Pastikan:

* PostgreSQL dapat diakses container
* `DATABASE_URL` sudah di-set
* `AUTH_SECRET` sudah di-set
* Port `3000` di-expose

---

# 🔑 Environment Variables

| Variable       | Required | Description                  |
| -------------- | -------- | ---------------------------- |
| `DATABASE_URL` | Yes      | PostgreSQL connection string |
| `AUTH_SECRET`  | Yes      | Secret key untuk JWT signing |

---

# 📌 Roadmap

* [ ] File upload support
* [ ] Image generation support
* [ ] Chat sharing
* [ ] Message search
* [ ] Redis caching

---

# 📄 License

MIT License

---

# ⭐ Support

Jika project ini membantu, jangan lupa beri ⭐ di GitHub.
