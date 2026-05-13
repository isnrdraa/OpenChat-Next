# Plan OpenChat Light

Target: web dasar buat chatbot, gaya `OpenWebUI` tapi lebih ringan. Fokus awal: setup wizard sekali saat first run, lalu masuk ke dashboard chat.

## Tujuan

- Wizard awal saat deploy pertama.
- Admin set `username/password`.
- Admin set `nama website`.
- Admin pilih `system prompt` dari template.
- Admin set provider OpenAI-compatible: `base_url`, `api_key`, `model`.
- Setelah setup selesai, app langsung masuk ke chat UI.

## Flow Produk

1. App start.
2. Cek apakah setup sudah ada.
3. Jika belum ada, redirect ke wizard.
4. Wizard isi data dasar.
5. Simpan config awal.
6. Buat akun admin.
7. Masuk ke dashboard chat.
8. Admin bisa ubah setting dari halaman settings.

## MVP Feature

- First-run wizard.
- Login admin.
- Chat UI sederhana.
- Provider OpenAI-compatible.
- Prompt template selector.
- Settings page.
- Chat history dasar.

## Tech Stack

### Frontend

- `Next.js`
- `React`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui`

### Backend

- `Next.js App Router` untuk fullstack sederhana.
- API route / server action untuk auth, setup, chat.

### Database

- `PostgreSQL`
- `Prisma`
- Connection: `postgresql://openchat:password-kuat@localhost:5432/openchat`

### Auth

- Custom auth sederhana untuk admin.
- Password hash aman (bcrypt).
- Session cookie (iron-session atau jose JWT).

### LLM Provider

- Adapter OpenAI-compatible.
- Support `base_url`, `api_key`, `model`.
- Streaming response dari server.

### Validation

- `Zod`

### State

- `zustand` hanya jika perlu state client yang kompleks.
- Kalau belum perlu, pakai React state + server data.

## Data Model Awal

- `users`
  - `id`
  - `username`
  - `password_hash`
  - `role`
- `app_settings`
  - `id`
  - `site_name`
  - `system_prompt`
  - `provider_base_url`
  - `provider_api_key_encrypted`
  - `provider_model`
- `chat_sessions`
  - `id`
  - `title`
  - `user_id`
- `messages`
  - `id`
  - `session_id`
  - `role`
  - `content`

## Struktur Halaman

- `/setup`
- `/login`
- `/chat`
- `/settings`
- `/api/chat`
- `/api/setup`

## Prompt Template

- General assistant.
- Customer support.
- Coding assistant.
- Roleplay.
- Blank custom prompt.

## Keputusan Arsitektur

- Simpan API key di server, bukan browser.
- Pakai satu repo dulu.
- Jangan terlalu cepat tambah fitur berat seperti RAG, plugin, multi-agent.
- Fokus ke setup cepat, chat stabil, dan config gampang.
- Tidak pakai gradasi warna.
- Tidak pakai emoji di UI manapun.

## Urutan Implementasi (Checklist)

### Stage 1: Scaffold Next.js + Tailwind + Prisma

- [ ] Init Next.js project dengan TypeScript + App Router
- [ ] Setup Tailwind CSS
- [ ] Install shadcn/ui
- [ ] Install Prisma + init
- [ ] Setup .env dengan DATABASE_URL
- [ ] Verifikasi dev server jalan

### Stage 2: Buat Schema DB

- [ ] Definisi model User
- [ ] Definisi model AppSettings
- [ ] Definisi model ChatSession
- [ ] Definisi model Message
- [ ] Jalankan prisma migrate dev
- [ ] Verifikasi tabel terbuat di PostgreSQL

### Stage 3: Buat Wizard First-Run

- [ ] Middleware cek apakah setup sudah ada
- [ ] Halaman /setup dengan multi-step form
- [ ] Step 1: Admin username + password
- [ ] Step 2: Nama website
- [ ] Step 3: System prompt (pilih template)
- [ ] Step 4: Provider config (base_url, api_key, model)
- [ ] API route POST /api/setup untuk simpan data
- [ ] Redirect ke /login setelah setup selesai

### Stage 4: Buat Auth Admin

- [ ] API route POST /api/auth/login
- [ ] API route POST /api/auth/logout
- [ ] Password hash dengan bcrypt
- [ ] Session management (cookie/JWT)
- [ ] Middleware proteksi route /chat dan /settings
- [ ] Halaman /login
- [ ] Redirect ke /chat setelah login

### Stage 5: Buat Provider Adapter OpenAI-Compatible

- [ ] Fungsi adapter: kirim request ke base_url dengan api_key
- [ ] Support streaming response (SSE)
- [ ] Ambil config provider dari DB
- [ ] Error handling kalau provider gagal
- [ ] API route POST /api/chat untuk proxy ke provider

### Stage 6: Buat Chat UI + Streaming

- [ ] Layout chat: sidebar + main area
- [ ] Input message box
- [ ] Display message list (user + assistant)
- [ ] Streaming render token by token
- [ ] Loading state
- [ ] Auto scroll ke bawah
- [ ] Simpan message ke DB

### Stage 7: Buat Settings Page

- [ ] Halaman /settings
- [ ] Form ubah nama website
- [ ] Form ubah system prompt
- [ ] Form ubah provider config
- [ ] Form ubah password admin
- [ ] API route PUT /api/settings
- [ ] Validasi dengan Zod

### Stage 8: Tambah Template Prompt

- [ ] Daftar template prompt tersedia
- [ ] Selector di wizard dan di settings
- [ ] Template: General assistant
- [ ] Template: Customer support
- [ ] Template: Coding assistant
- [ ] Template: Roleplay
- [ ] Template: Blank/custom

### Stage 9: Tambah History Chat

- [ ] Sidebar list chat sessions
- [ ] Buat session baru
- [ ] Load session lama
- [ ] Rename session
- [ ] Hapus session
- [ ] Auto-title dari pesan pertama

## Fase Lanjutan (Nanti)

- Knowledge base / RAG.
- Upload file.
- Multi-user.
- Role dan permission.
- Audit log.
- Embed widget.
- Theme branding.
