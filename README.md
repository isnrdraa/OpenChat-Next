# OpenChat

Platform chatbot ringan dan self-hosted dengan antarmuka web modern. Terinspirasi dari OpenWebUI, ChatGPT, dan OpenCode. Siap deploy dalam 5 menit.

## Fitur Utama

**Chat**
- Chat terbuka untuk publik tanpa perlu login
- Streaming response real-time
- Markdown rendering dengan syntax highlighting
- Tombol copy untuk setiap response dan code block
- History chat per browser (privasi terjaga antar pengguna)
- Auto-create session saat pesan pertama dikirim

**Provider AI**
- Kompatibel dengan semua API format OpenAI (OpenAI, OpenRouter, vLLM, Ollama, dll)
- Auto-detect daftar model dari provider
- Test connection langsung dari settings
- Streaming response dari server (API key tidak terekspos ke client)

**Admin**
- Setup wizard saat pertama kali deploy
- Template system prompt (General, Customer Support, Coding, Roleplay, Custom)
- Model selector dropdown
- Ubah konfigurasi tanpa restart

**Tampilan**
- Dark mode default, toggle dark/light
- Sidebar collapsible dengan riwayat chat
- Responsive dan ringan
- Warna terinspirasi OpenCode (warm peach accent)

**Keamanan**
- Rate limiting pada login dan chat
- Browser identity dengan HMAC server-signed
- JWT session dengan verifikasi di middleware
- Sanitasi markdown (XSS protection)
- API key tersimpan di server, tidak pernah dikirim ke client

## Tech Stack

| Teknologi | Fungsi |
|-----------|--------|
| Next.js 16 | Framework fullstack (App Router) |
| React 19 | UI library |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| shadcn/ui | Komponen UI |
| PostgreSQL | Database |
| Prisma 7 | ORM dan schema management |
| Jose | JWT authentication |
| Bcrypt | Password hashing |
| Zod | Validasi input |
| react-markdown | Rendering markdown |
| react-syntax-highlighter | Syntax highlighting code blocks |
| rehype-sanitize | XSS protection pada markdown |

## Arsitektur

```
Browser (Public/Admin)
    |
    v
[Next.js App Router]
    |
    +-- /chat .............. Chat UI (public, no login)
    +-- /login ............. Admin login
    +-- /settings .......... Admin settings (protected)
    +-- /setup ............. First-run wizard
    |
    +-- /api/chat .......... Proxy ke LLM provider (streaming)
    +-- /api/sessions ...... CRUD chat sessions
    +-- /api/browser ....... Register browser identity
    +-- /api/settings ...... Admin config CRUD
    +-- /api/models ........ List model dari provider
    +-- /api/test-provider . Test koneksi provider
    |
    v
[PostgreSQL]
    - users
    - app_settings
    - chat_sessions
    - messages
```

**Flow:**
1. Deploy pertama kali → wizard setup (admin, nama site, prompt, provider)
2. Setelah setup → chat langsung bisa dipakai siapapun
3. Admin login hanya untuk akses settings

## Prasyarat

- Node.js 20+
- PostgreSQL 14+

## Instalasi

```bash
# Clone repo
git clone git@github.com:isnrdraa/OpenChat-Next.git
cd OpenChat-Next

# Install dependencies
NODE_ENV=development npm install

# Setup environment
cp .env.example .env
# Edit .env sesuai konfigurasi

# Generate Prisma client
npx prisma generate

# Push schema ke database
npx prisma db push

# Jalankan development server
NODE_ENV=development npx next dev -p 3000
```

## Environment Variables

| Variable | Wajib | Deskripsi |
|----------|-------|-----------|
| `DATABASE_URL` | Ya | Connection string PostgreSQL |
| `AUTH_SECRET` | Ya | Secret untuk signing JWT. Generate dengan `openssl rand -base64 32` |

Contoh `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/openchat"
AUTH_SECRET="random-secret-string-minimal-32-karakter"
```

## Deployment

```bash
# Build production
NODE_ENV=production npm run build

# Jalankan
npm start
```

Server akan jalan di port 3000.

Untuk Docker, pastikan:
- PostgreSQL accessible dari container
- `DATABASE_URL` dan `AUTH_SECRET` di-set sebagai environment variable
- Port 3000 di-expose

## Lisensi

MIT
