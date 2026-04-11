# 🚀 Mikbotam Next - Rinjani Edition
### *Modern Evolution MOD v2.1.0*

![Mikbotam Next Logo](public/logo-next.svg)

**Mikbotam Next (MOD v2.1.0)** adalah kelanjutan revolusioner dari versi **Krakatau (Master)**.
 Dibangun ulang dari nol menggunakan stack teknologi terbaru, proyek ini menghadirkan performa, keamanan, dan stabilitas yang belum pernah ada sebelumnya bagi komunitas pengusaha ISP dan Hotspot di Indonesia.

---

## 🎖️ Credits & Legacy
Proyek ini berdiri di atas bahu para raksasa:
- **Original Founder:** [BangAchil](https://github.com/bangachil) (Pencetus konsep Mikbotam Master).
- **Lead Developer (Next Gen):** **Sanrian Surenggana, MTCNA**.
- **Special Thanks:** Seluruh kontributor dan donatur versi Krakatau yang telah menjaga semangat proyek ini tetap hidup.

---

## ✨ Apa yang Baru di Versi Rinjani?

### 1. 🛰️ Arsitektur "Cloud-Native" MikroTik
Kami meninggalkan skrip PHP prosedural dan berpindah ke **Next.js 15 (Node.js)**. Hasilnya? Aplikasi yang jauh lebih cepat, asinkron, dan mampu menangani ribuan transaksi tanpa hambatan.

### 2. 🛡️ RouterOS 7 (ROS 7) Native Support
Kami memecahkan masalah klasik pada ROS 7 di mana voucher sering gagal terhapus otomatis. Mikbotam Next menggunakan logika **Cloud Cleaner** yang memaksa penghapusan user dan pemutusan sesi langsung dari server dashboard secara presisi.

### 3. 👥 Multi-Router & Multi-Bot Control
Satu instalasi untuk mengelola seluruh jaringan Anda.
- **Dynamic Webhooks:** `/api/telegram/[token]` memungkinkan satu dashboard menerima pesan dari banyak bot sekaligus.
- **Router Isolation:** Statistik dan log transaksi dipisahkan dengan jelas antar router.

### 4. ⚡ Advanced Bandwidth Suite
Konfigurasi MikroTik tingkat lanjut kini tersedia dalam format yang ramah pengguna:
- **Burst Support:** Atur Burst Limit, Threshold, dan Time secara visual.
- **Priority:** Prioritaskan traffic penting (skala 1-8).
- **Limit At:** Jaminan bandwidth minimal untuk setiap pelanggan.

---

## 🛠️ Persyaratan Sistem
- VPS atau Server Lokal (Ubuntu 20.04+ disarankan).
- RAM minimal 1GB.
- Node.js v20.x atau lebih baru.
- Port 8728 (API) terbuka di MikroTik.

---

## 🚀 Panduan Instalasi Berurutan

### Metode A: Instalasi Otomatis (Direkomendasikan untuk VPS)
Jalankan perintah ini di terminal VPS Anda:
```bash
wget -qO- https://raw.githubusercontent.com/username/mikbotam-next/main/deploy.sh | bash
```

### Metode B: Instalasi Docker (Paling Bersih)
Cocok bagi Anda yang tidak ingin mengotori sistem dengan banyak library:
1. Pastikan Docker & Docker Compose sudah terinstall.
2. Jalankan:
   ```bash
   docker-compose up -d
   ```

### Metode C: Instalasi Manual (Developer)
1. **Clone & Install:**
   ```bash
   git clone https://github.com/username/mikbotam-next.git
   cd mikbotam-next
   npm install
   ```
2. **Konfigurasi Database:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```
3. **Build & Jalankan:**
   ```bash
   npm run build
   npm start
   ```

---

## ⚙️ Langkah Konfigurasi Awal (PENTING)
Setelah berhasil menginstal, ikuti urutan ini:
1. **Akses Dashboard:** Buka `http://ip-anda:3000`.
2. **Login:** Gunakan kredensial admin default Anda.
3. **Menu Settings:**
   - Hubungkan MikroTik (IP, User, Pass). Klik **Test Connection**.
   - Masukkan Bot Token dari @BotFather. Klik **Set Webhook**.
4. **Voucher Pricing:** Atur paket voucher Anda agar sinkron dengan Bot Telegram.
5. **Start Selling:** Bot Anda kini siap melayani pelanggan!

---

## 🔒 Standar Keamanan Baru
- **Password:** Semua password di database di-hash menggunakan **BCrypt**.
- **Session:** Menggunakan **Stateless JWT** (NextAuth v5).
- **Validation:** Proteksi input sisi server dengan **Zod**.

---

## 📄 Lisensi & Kontribusi
Proyek ini bersifat **Open Source**. Kami sangat menghargai kontribusi berupa Pull Request atau pelaporan bug. Tetaplah menjadi bagian dari ekosistem yang saling mendukung.

---
**Mikbotam Next - Empowering Your Network with Modern Technology.**
