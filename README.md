# 🚀 Mikbotam Next - Rinjani Edition

### _Modern Evolution MOD v2.2.0_

![Mikbotam Banner](https://img.shields.io/badge/Mikrotik-Hotspot%20Bot-emerald?style=for-the-badge&logo=mikrotik)
![Next.js 16](https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js)
![Prisma ORM](https://img.shields.io/badge/Prisma%20ORM-blue?style=for-the-badge&logo=prisma)
![Version](https://img.shields.io/badge/version-2.2.0-emerald?style=for-the-badge)

**Mikbotam Next** adalah evolusi revolusioner dari versi **Krakatau (Master)**. Dibangun ulang dari nol menggunakan **Next.js 16**, aplikasi ini menawarkan performa kilat, keamanan tingkat tinggi, dan fitur yang sepenuhnya mendukung **RouterOS 7**.

---

## 🎖️ Credits & Appreciation

- **Original Founder:** [BangAchil](https://github.com/bangachil) (Mikbotam Master PHP)
- **Lead Developer (Next Gen):** **Sanrian Surenggana, MTCNA**

---

## 🆕 Changelog v2.2.0

- ✅ **Multi-Router Management** — Tambah/hapus banyak MikroTik langsung dari Settings, identity otomatis diambil dari router
- ✅ **Emerald Primary Theme** — Konsistensi warna penuh, tidak ada lagi warna sky/blue yang bocor
- ✅ **User Menu Dropdown** — Avatar pojok kanan atas: Edit Profile, Settings, dan Keluar Sesi
- ✅ **Router Selector** — Menampilkan identity MikroTik asli, fallback ke IP jika belum dikonfigurasi
- ✅ **Uptime Formatter** — Format waktu MikroTik rapi: `1h 5j 20m` (hari/jam/menit)
- ✅ **Webhook UI** — Field domain HTTPS + preview URL lengkap + panduan setup
- ✅ **Light Theme** — Semua card dark (broadcast, profile, bot-editor, logs) diubah ke tema terang konsisten
- ✅ **Income Chart** — Komponen chart pendapatan 7 hari dengan Recharts (AreaChart)
- ✅ **System Logs** — Tabel log rapi dengan sticky header opaque dan badge topic berwarna

---

## 🌩️ Deployment Gratis (Vercel)

Anda bisa menjalankan Mikbotam Next secara gratis selamanya menggunakan Vercel.

### Langkah-langkah:

1.  **Fork** repository ini ke akun GitHub Anda.
2.  Buka [Vercel.com](https://vercel.com) dan hubungkan dengan GitHub Anda.
3.  Pilih repository `Mikbotam-Next-Rinjani-Edition-MOD`.
4.  **Environment Variables:** Tambahkan variabel berikut di dashboard Vercel:
    - `AUTH_SECRET`: (Buat string acak panjang untuk keamanan session).
    - `DATABASE_URL`: (Gunakan koneksi PostgreSQL dari Supabase/Neon jika ingin data awet, atau biarkan default SQLite jika hanya untuk testing).
5.  Klik **Deploy**.
6.  Selesai! Aplikasi Anda langsung online dengan HTTPS gratis.

> ⚠️ **Catatan Penting:** SQLite di Vercel akan reset setiap kali ada update kode. Untuk penggunaan produksi (saldo asli), sangat disarankan menggunakan Database Cloud gratis seperti **Neon.tech** atau **Supabase**.

---

## 🚀 Opsi Instalasi Lainnya

### 1. VPS Linux (Ubuntu/Debian) - Rekomendasi

Gunakan skrip otomatis kami untuk setup yang paling stabil:

```bash
wget -qO- https://raw.githubusercontent.com/theworldinyourhand/Mikbotam-Next-Rinjani-Edition-MOD/main/deploy.sh | bash
```

### 2. Docker (Instan & Terisolasi)

```bash
docker-compose up -d
```

---

## ✨ Fitur Utama Rinjani Edition

- ✅ **Native ROS 7 Support:** Cloud Cleaner logic untuk hapus voucher otomatis.
- ✅ **Advanced Bandwidth:** Support Burst Limit, Threshold, & Priority.
- ✅ **Security:** Password BCrypt & Stateless JWT.
- ✅ **Real-time:** Dashboard interaktif dengan grafik pendapatan harian.
- ✅ **Multi-Router:** Kelola banyak router MikroTik dalam satu dashboard.
- ✅ **Telegram Bot:** Support Polling & Webhook dengan konfigurasi visual.

---

## 📄 Lisensi

Proyek ini bersifat Open Source. Tetap sertakan kredit kepada pengembang awal dan pengembang versi Next Gen ini.
