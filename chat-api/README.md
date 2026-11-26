# Chat Q&A Madrasah I AM: endpoint Cloudflare Worker

Laman `madrasahiam.org` ialah laman statik (GitHub Pages), jadi kunci API Claude disimpan dalam Cloudflare Worker ini.

## Struktur
- `src/index.js`: endpoint `POST /` yang panggil Claude API dengan prompt sistem dan bahan rujukan.
- `knowledge/knowledge.md`: bahan rujukan Madrasah I AM. Kemas kini fail ini apabila kurikulum berubah, kemudian deploy semula.
- `wrangler.toml`: konfigurasi Worker.

## Deploy (sekali sahaja)
```bash
cd chat-api
npm install -g wrangler        # atau guna npx
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY   # tampal kunci API di prompt, jangan dalam fail
npx wrangler deploy
```
Selepas deploy, Worker akan ada URL seperti `https://madrasah-chat.<akaun>.workers.dev`. Salin URL ini ke `chat-widget.js` (pembolehubah `ENDPOINT`).

## Tukar model
Tambah dalam `wrangler.toml`:
```toml
[vars]
MODEL = "claude-haiku-5-5"
```
Lalai ialah `claude-sonnet-5-5`, yang lebih teliti untuk jawapan berkaitan agama.

## Kemas kini bahan
Edit `knowledge/knowledge.md`, kemudian `npx wrangler deploy`.

## Had semasa
- Tiada had kadar (rate limit) lagi. Tambah Cloudflare Rate Limiting atau KV jika trafik meningkat.
- Hanya `https://madrasahiam.org` dan `https://www.madrasahiam.org` dibenarkan memanggil endpoint.
