# OpenChat

Platform chatbot ringan dengan antarmuka web modern. Terinspirasi dari OpenWebUI, ChatGPT, dan OpenCode.

## Fitur

- Setup wizard saat pertama kali deploy (admin, nama site, prompt, provider)
- Chat terbuka untuk publik tanpa perlu login
- History chat per browser (privasi terjaga)
- Provider OpenAI-compatible (support semua API yang mengikuti format OpenAI)
- Streaming response
- Markdown rendering dengan syntax highlighting
- Tombol copy untuk setiap response AI
- Dark/light mode
- Settings page untuk admin (model dropdown, test connection, ubah prompt)
- Multi-model support dengan auto-detect dari provider

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- PostgreSQL + Prisma 7
- Zod (validasi)
- Jose (JWT session)

## Prasyarat

- Node.js 20+
- PostgreSQL

## Instalasi

```bash
# Clone repo
git clone git@github.com:isnrdraa/OpenChat-Next.git
cd OpenChat-Next

# Install dependencies
NODE_ENV=development npm install

# Setup environment
cp .env.example .env
# Edit .env sesuai konfigurasi database

# Generate Prisma client
npx prisma generate

# Push schema ke database
npx prisma db push

# Jalankan development server
NODE_ENV=development npx next dev -p 3000
```

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/openchat"
AUTH_SECRET="random-secret-string"
```

## Penggunaan

1. Buka browser, akses `http://localhost:3000`
2. Saat pertama kali, akan muncul setup wizard
3. Isi data admin, nama website, system prompt, dan provider AI
4. Setelah setup selesai, chat langsung bisa digunakan oleh siapapun
5. Login admin hanya diperlukan untuk mengakses halaman settings

## Build Production

```bash
NODE_ENV=production npm run build
npm start
```

## Lisensi

MIT
