# 🚀 Mikbotam Next - Rinjani Edition

### _Modern Evolution MOD v2.4.0_

![Mikrotik](https://img.shields.io/badge/Mikrotik-Hotspot%20Bot-emerald?style=for-the-badge&logo=mikrotik)
![Next.js 16](https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma ORM](https://img.shields.io/badge/Prisma%20ORM-blue?style=for-the-badge&logo=prisma)
![Version](https://img.shields.io/badge/version-2.4.0-emerald?style=for-the-badge)

**Mikbotam Next** adalah evolusi revolusioner dari versi **Krakatau (Master)**. Dibangun ulang dari nol menggunakan **Next.js 16**, aplikasi ini menawarkan performa kilat, keamanan tingkat tinggi, dan fitur yang sepenuhnya mendukung **RouterOS 7**. Versi Rinjani Edition ini telah ditingkatkan untuk penggunaan skala industri dengan basis data **PostgreSQL**.

---

## 🎖️ Credits & Appreciation

- **Original Founder:** [BangAchil](https://github.com/bangachil) (Mikbotam Master PHP)
- **Lead Developer (Next Gen):** [Sanrian Surenggana, MTCNA](https://github.com/surenggana)

---

## 🔑 Login Default (Admin Master)

Untuk login pertama kali ke dashboard, gunakan akun berikut:
- **Username:** `admin`
- **Password:** `admin123`

_Segera ubah password Anda di menu Profile setelah berhasil masuk._

---

## 🆕 Changelog v2.4.0 (Latest Updates)

- ✅ **Database Migration to PostgreSQL** — Migrasi penuh dari SQLite ke PostgreSQL untuk performa yang lebih stabil, konkurensi tinggi, dan skalabilitas data reseller yang lebih besar.
- ✅ **Voucher Usage Tracking (HilwaNet Logic)** — Fitur pelacakan waktu nyata: Sekarang riwayat transaksi mencatat kapan voucher **Mulai Digunakan (Start Time)** dan kapan akan **Habis (Expiry Time)** secara otomatis saat user login pertama kali di MikroTik.
- ✅ **Balance Correction (Top Up & Top Down)** — Admin kini memiliki kontrol penuh untuk menambah atau **menarik kembali (Withdraw/Top Down)** saldo reseller langsung melalui dashboard dengan notifikasi instan ke Bot.
- ✅ **Global Bot Text Editor** — Kustomisasi balasan otomatis Bot Telegram (teks /daftar, menu, informasi, footer saldo/voucher) sekarang bisa dilakukan langsung melalui UI Dashboard tanpa menyentuh kodingan.
- ✅ **Premium UI/UX Standardization** — Seluruh antarmuka telah distandardisasi menggunakan desain "Premium" dengan tombol *rounded-xl*, tipografi *uppercase bold*, dan bayangan lembut untuk pengalaman pengguna yang lebih profesional.
- ✅ **Advanced Data Tables** — Fitur pencarian cerdas (**Debounced Search**) dan navigasi halaman (**Pagination**) yang sinkron dengan URL di seluruh tabel utama (Users, Transaksi, Topup).
- ✅ **Next.js 16 & Turbopack Ready** — Optimalisasi performa pengembangan dan runtime menggunakan mesin *bundling* terbaru untuk efisiensi tinggi.

---

## 🚀 Panduan Instalasi

### 1. Prasyarat
*   Node.js v20 atau lebih baru.
*   Database **PostgreSQL** sudah terpasang dan berjalan.

### 2. Instalasi (Development)

1.  **Clone Repository:**
    ```bash
    git clone https://github.com/theworldinyourhand/Mikbotam-Next-Rinjani-Edition-MOD.git
    cd Mikbotam-Next-Rinjani-Edition-MOD
    ```
2.  **Konfigurasi Environment:**
    Buat file `.env` di root direktori:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/mikbotam"
    NEXTAUTH_SECRET="rahasia-anda"
    NEXTAUTH_URL="http://localhost:3560"
    ```
3.  **Instal Dependencies:**
    ```bash
    npm install
    ```
4.  **Sinkronisasi Database:**
    ```bash
    npx prisma generate
    npx prisma db push
    ```
5.  **Jalankan:**
    ```bash
    npm run dev
    ```
    Akses dashboard di: `http://localhost:3560`

---

## ✨ Fitur Utama Rinjani Edition (Next-Gen)

- 🗄️ **Industrial Grade Database** — Migrasi penuh ke **PostgreSQL** untuk performa yang lebih tangguh, konkurensi tinggi, dan skalabilitas data reseller tanpa batas.
- 🕒 **Real-time Voucher Tracking** — Pantau siklus hidup voucher secara presisi: Mencatat otomatis waktu **Start Login** dan menghitung waktu **Expired** langsung di dashboard.
- 💰 **Precision Balance Control** — Manajemen saldo reseller yang fleksibel dengan fitur **Top-Up** dan **Top-Down (Tarik Saldo)** disertai notifikasi Telegram instan.
- 🤖 **Global Bot Customizer** — Ubah semua teks balasan Bot Telegram (Daftar, Menu, Info, Footer) secara dinamis melalui UI Dashboard tanpa menyentuh kode.
- ⚡ **Premium UI & Search Engine** — Antarmuka modern dengan standar desain premium, dilengkapi fitur **Debounced Search** dan **Pagination** yang sangat cepat di semua tabel.
- 📡 **Native RouterOS 7 Support** — Dukungan penuh untuk firmware MikroTik terbaru, termasuk sistem pembersihan voucher expired otomatis yang lebih cerdas.
- 🏢 **Single Router Management** — Kelola satu router MikroTik Anda dengan ribuan reseller dalam satu dashboard tersentralisasi secara efisien.
- 🔐 **Enterprise Security** — Pengamanan berlapis dengan **BCrypt Hashing**, Middleware Protection, dan integrasi Webhook Telegram yang aman.

---

## 📄 Lisensi

Proyek ini bersifat Open Source. Tetap sertakan kredit kepada pengembang awal dan pengembang versi Next Gen ini sebagai bentuk apresiasi terhadap karya komunitas.
