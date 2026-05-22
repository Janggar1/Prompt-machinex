# Image to Prompt Machine — Vercel

Versi ini fokus ke **image-to-prompt**.

## Fungsi
- Upload gambar
- Pilih target generator
- AI menganalisis gambar
- Output: prompt, negative prompt, reference lock, short version

## Struktur
```txt
index.html
api/generate-prompt.js
vercel.json
.env.example
```

## Deploy ke Vercel
1. Upload semua file ke GitHub
2. Import repository ke Vercel
3. Tambahkan Environment Variables:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (opsional, default `gpt-4.1`)
4. Redeploy

## Penting
Jangan taruh API key langsung di HTML.
Gunakan Vercel Environment Variables.
