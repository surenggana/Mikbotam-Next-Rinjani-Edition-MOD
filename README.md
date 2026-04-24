# 🚀 Mikbotam Next - Rinjani Edition

### _Modern Evolution MOD v2.3.0_

![Mikbotam Banner](https://img.shields.io/badge/Mikrotik-Hotspot%20Bot-emerald?style=for-the-badge&logo=mikrotik)
![Next.js 16](https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js)
![Prisma ORM](https://img.shields.io/badge/Prisma%20ORM-blue?style=for-the-badge&logo=prisma)
![Version](https://img.shields.io/badge/version-2.3.0-emerald?style=for-the-badge)

**Mikbotam Next** adalah evolusi revolusioner dari versi **Krakatau (Master)**. Dibangun ulang dari nol menggunakan **Next.js 16**, aplikasi ini menawarkan performa kilat, keamanan tingkat tinggi, dan fitur yang sepenuhnya mendukung **RouterOS 7**.

---

## 🎖️ Credits & Appreciation

- **Original Founder:** [BangAchil](https://github.com/bangachil) (Mikbotam Master PHP)
- **Lead Developer (Next Gen):** [Sanrian Surenggana, MTCNA](https://github.com/surenggana)

---

## 🆕 Changelog v2.3.0

- ✅ **Interactive Admin Notifications** — Notifikasi instan ke Telegram Admin untuk pendaftaran reseller baru dan request topup, lengkap dengan tombol interaktif **[SETUJUI]** dan **[TOLAK]**.
- ✅ **Dynamic Voucher Generation** — Pengaturan panjang karakter, tipe karakter (Angka/Huruf/Campur), dan mode (User=Pass atau Beda) kini bisa diatur per paket voucher melalui dashboard.
- ✅ **Commission-Based Deduction** — Penyesuaian alur keuangan: Saldo reseller dipotong berdasarkan **(Harga Jual - Komisi)**, sesuai dengan logika asli Mikbotam Master.
- ✅ **Advanced Active Monitoring** — Halaman monitoring kini menampilkan detail real-time yang lengkap: Nama User, IP Address, **MAC Address**, Uptime, dan **Sisa Waktu (Remaining Time)** voucher.
- ✅ **Enhanced SEO & Branding** — Metadata media sosial (WhatsApp/FB/Twitter) kini menampilkan logo asli Mikbotam dan deskripsi profesional. Favicon juga sudah diseragamkan.
- ✅ **Strict Access Control** — Pembatasan akses command bot yang lebih ketat antara Admin dan Reseller untuk menjamin keamanan multi-tenant.
- ✅ **Automatic Binary Rebuild** — Skrip deployment otomatis membangun ulang modul `better-sqlite3` untuk menjamin stabilitas database di berbagai versi Node.js.

---

## 🚀 Panduan Instalasi

### 1. VPS Linux (Ubuntu/Debian) - Rekomendasi Utama

Gunakan skrip otomatis untuk instalasi yang paling stabil dan cepat:

```bash
wget -qO- https://raw.githubusercontent.com/surenggana/Mikbotam-Next-Rinjani-Edition-MOD/main/deploy.sh | bash
```

> **Note:** Skrip ini akan otomatis menginstal Node.js 20, PM2, dependencies, dan melakukan build aplikasi serta setting port otomatis.

### 2. Instalasi Manual (Development)

1.  **Clone Repository:** `git clone https://github.com/surenggana/Mikbotam-Next-Rinjani-Edition-MOD.git`
2.  **Instal Dependencies:** `npm install`
3.  **Database Sync:** `npx prisma generate && npx prisma db push`
4.  **Jalankan:** `npm run dev`

---

## ✨ Fitur Utama Rinjani Edition

- ✅ **Native ROS 7 Support:** Cloud Cleaner logic untuk hapus voucher otomatis di MikroTik.
- ✅ **Interactive Telegram Bot:** Full menu keyboard & perintah interaktif untuk kemudahan reseller.
- ✅ **Multi-Router:** Kelola banyak router MikroTik dalam satu dashboard admin.
- ✅ **Security First:** Password BCrypt, Stateless JWT, dan integrasi Webhook Telegram yang aman.
- ✅ **Real-time Analytics:** Dashboard interaktif dengan grafik pendapatan harian menggunakan Recharts.

---

## 📄 Lisensi

Proyek ini bersifat Open Source. Tetap sertakan kredit kepada pengembang awal dan pengembang versi Next Gen ini sebagai bentuk apresiasi terhadap karya komunitas.
