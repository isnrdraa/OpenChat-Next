# OpenChat

OpenChat adalah platform chatbot self-hosted dengan UI web modern. Fokus pada chat publik, setup cepat, dan integrasi provider yang kompatibel dengan format API OpenAI.

## Fitur

- Chat publik tanpa login
- Streaming response realtime
- Markdown rendering dan syntax highlighting
- Riwayat chat per browser
- Admin panel untuk setup dan konfigurasi
- Dukungan provider OpenAI-compatible
- Dark mode dan UI responsif
- Proteksi dasar untuk API key dan session

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- PostgreSQL
- Prisma 7

## Requirements

- Node.js 20+
- PostgreSQL 14+

## Setup

```bash
git clone git@github.com:isnrdraa/OpenChat-Next.git
cd OpenChat-Next
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npx next dev -p 3000
```

Isi `.env` minimal:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/openchat"
AUTH_SECRET="random-secret-string-minimal-32-karakter"
```

## Production

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Secret untuk JWT signing |

## License

MIT. Lihat `LICENSE`.
