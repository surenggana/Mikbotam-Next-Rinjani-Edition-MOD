# 🚀 Mikbotam Next - Rinjani Edition
### *Modern Evolution MOD v2.1.0*

![Mikbotam Banner](https://img.shields.io/badge/Mikrotik-Hotspot%20Bot-teal?style=for-the-badge&logo=mikrotik)
![Next.js 15](https://img.shields.io/badge/Next.js%2015-black?style=for-the-badge&logo=next.js)
![Prisma ORM](https://img.shields.io/badge/Prisma%20ORM-blue?style=for-the-badge&logo=prisma)

**Mikbotam Next** adalah evolusi revolusioner dari versi **Krakatau (Master)**. Dibangun ulang dari nol menggunakan **Next.js 15**, aplikasi ini menawarkan performa kilat, keamanan tingkat tinggi, dan fitur yang sepenuhnya mendukung **RouterOS 7**.

---

## 🎖️ Credits & Appreciation
- **Original Founder:** [BangAchil](https://github.com/bangachil) (Mikbotam Master PHP)
- **Lead Developer (Next Gen):** **Sanrian Surenggana, MTCNA**

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
- ✅ **Multi-Bot:** Kelola banyak router & bot dalam satu dashboard.

---

## 📄 Lisensi
Proyek ini bersifat Open Source. Tetap sertakan kredit kepada pengembang awal dan pengembang versi Next Gen ini.

---
**Mikbotam Next - Empowering Your Network Management.**
