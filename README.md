# 💍 Undangan Pernikahan Digital — Ivan & Sioni

Undangan pernikahan digital mobile-first bertema **elegan glamour emerald & gold**, dengan navigasi fullscreen slide (swipe ke atas seperti story). Di-host gratis di GitHub Pages.

## Struktur

| File | Isi |
|---|---|
| `js/config.js` | **Semua data acara** — nama, tanggal, lokasi, rekening, dll. Cukup edit file ini. |
| `index.html` | Struktur halaman (8 section + cover) |
| `css/style.css` | Tema & animasi |
| `js/main.js` | Logika: slide, countdown, musik, RSVP |
| `assets/img/` | Foto (sementara placeholder) |
| `assets/audio/` | Musik latar (`music.mp3`) |
| `apps-script/Code.gs` | Backend RSVP untuk Google Sheets |

## 1. Mengisi Data Acara

Buka `js/config.js`, ganti semua nilai bertanda `GANTI_INI`:
nama lengkap & orang tua, tanggal (`mainDateISO`, format `2026-12-12T08:00:00+07:00`), jadwal akad & resepsi, link Google Maps, dan nomor rekening.

## 2. Mengganti Foto

1. Taruh foto pre-wedding di `assets/img/` (format `.jpg`/`.webp`, kompres dulu di [squoosh.app](https://squoosh.app) agar ringan — idealnya < 300 KB per foto).
2. Di `js/config.js`:
   - `couple.groom.photo` & `couple.bride.photo` → foto profil (rasio kotak paling pas).
   - `gallery` → daftar foto galeri (foto pertama tampil melebar, rasio landscape paling pas; sisanya portrait 3:4).

## 3. Menambah Musik

Taruh file `music.mp3` di `assets/audio/`. Lihat catatan di `assets/audio/TARUH-MUSIK-DISINI.txt`.

## 4. Setup RSVP & Ucapan (Google Sheets)

Ikuti langkah di bagian atas file `apps-script/Code.gs` (±10 menit). Intinya:

1. Buat spreadsheet baru → Extensions → Apps Script → tempel isi `Code.gs`.
2. Deploy → New deployment → Web app → akses **Anyone** → salin URL `/exec`.
3. Tempel URL itu ke `appsScriptUrl` di `js/config.js`.

Sebelum di-setup, undangan tetap jalan — form RSVP hanya menampilkan pesan bahwa backend belum aktif.

## 5. Deploy ke GitHub Pages

```bash
# di folder proyek ini
git add -A
git commit -m "Update data undangan"

# buat repo di GitHub (sekali saja), lalu:
git remote add origin https://github.com/USERNAME/wedding-ivan-sioni.git
git branch -M main
git push -u origin main
```

Lalu di GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / root → Save**. Tunggu ±1 menit, undangan live di:

```
https://USERNAME.github.io/wedding-ivan-sioni/
```

## 6. Menyebar Undangan dengan Nama Tamu

Tambahkan `?to=Nama+Tamu` di belakang link (spasi = `+` atau `%20`):

```
https://USERNAME.github.io/wedding-ivan-sioni/?to=Budi+Santoso
https://USERNAME.github.io/wedding-ivan-sioni/?to=Keluarga+Bapak+Ahmad
```

Nama akan muncul otomatis di halaman cover ("Kepada Yth. …").

Template pesan WhatsApp:

> Bismillahirrahmanirrahim.
> Kepada Yth. *[Nama]*, tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara pernikahan kami:
> 👉 https://USERNAME.github.io/wedding-ivan-sioni/?to=Nama+Tamu
> Merupakan suatu kehormatan bagi kami apabila berkenan hadir. Terima kasih. 🙏

## Testing Lokal

```bash
python -m http.server 8000
# buka http://localhost:8000/?to=Nama+Tes di browser (mode mobile / device toolbar)
```
