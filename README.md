# Küheylan

Next.js App Router + Tailwind + Framer Motion + Lucide + Prisma (SQLite).

## Kurulum

```bash
npm install
```

`.env` içinde SQLite bağlantısı:

```bash
DATABASE_URL="file:./dev.db"
```

DB'yi oluştur / güncelle:

```bash
npm run db:migrate
```

Demo veriyi yükle (lokal DB’yi sıfırlar / destructive):

```bash
npm run db:seed
```

## Çalıştırma

```bash
npm run dev
```

Tarayıcı: http://localhost:3000

## Komutlar

- `npm run lint`
- `npm run build`
- `npm run db:generate`
- `npm run db:studio`

## Notlar (Windows)

`prisma generate` sırasında EPERM/rename hatası alırsan genelde `npm run dev` açıkken Prisma engine dosyaları kilitleniyor.
Dev server’ı kapatıp `npm run db:generate` çalıştır.

## Hızlı Test Checklist

- `/`, `/market`, `/favorites` açılıyor
- `/market` filtreleri (genre/bpmMin/available/sponsored) 200 dönüyor
- Kartta kalp (favori) toggle → refresh sonrası korunuyor
- `/api/preview-tone?bpm=120&ms=200` → `audio/wav` dönüyor
