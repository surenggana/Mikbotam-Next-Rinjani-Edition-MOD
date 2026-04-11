# 🚀 Mikbotam Next - Rinjani Edition
### *The Modern Evolution of MikroTik Bot Management (MOD v2.1.0)*

![Mikbotam Banner](https://img.shields.io/badge/Mikrotik-Hotspot%20Bot-teal?style=for-the-badge&logo=mikrotik)
![Next.js 15](https://img.shields.io/badge/Next.js%2015-black?style=for-the-badge&logo=next.js)
![Prisma ORM](https://img.shields.io/badge/Prisma%20ORM-blue?style=for-the-badge&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

**Mikbotam Next (MOD v2.1.0)** adalah evolusi revolusioner dari versi **Krakatau (Master)**. Dibangun ulang menggunakan framework **Next.js 15**, aplikasi ini menawarkan stabilitas tinggi, keamanan data, dan antarmuka pengguna (UI/UX) yang dirancang khusus untuk pengusaha ISP dan pengelola jaringan hotspot di Indonesia.

---

## 🎖️ Credits & Legacy
Proyek ini dikembangkan dengan rasa hormat kepada akar sejarahnya:
- **Original Founder:** [BangAchil](https://github.com/bangachil) (Pencetus konsep Mikbotam Master PHP).
- **Lead Developer (Next Gen):** **Sanrian Surenggana, MTCNA**.
- **Special Thanks:** Komunitas MikroTik Indonesia yang terus memberikan inspirasi.

---

## 📊 Perbandingan Fitur: Krakatau vs Rinjani Edition

| Fitur | Krakatau (Legacy PHP) | Rinjani Edition (Next.js) |
| :--- | :--- | :--- |
| **Arsitektur** | Prosedural PHP 7.x | **Next.js 15 (React + Node.js)** |
| **Database** | Medoo / SQLite | **Prisma ORM / SQLite** |
| **Keamanan** | Plain-text Password | **BCrypt Password Hashing** |
| **RouterOS 7** | Sering gagal hapus voucher | **Native ROS 7 (Cloud Cleaner)** |
| **Bandwidth** | Standar Speed Limit | **Advanced Burst & Priority Support** |
| **Antarmuka** | Bootstrap 4 (Statis) | **Tailwind + Shadcn (Reaktif)** |
| **Multi-Router** | Terbatas / Kompleks | **Dynamic Multi-Router Dashboard** |

---

## ✨ Fitur Unggulan Terbaru

### 🛡️ Native RouterOS 7 (ROS 7) Failsafe
Kami memecahkan bug klasik di mana voucher kadaluarsa tidak terhapus otomatis di ROS 7. Mikbotam Next menggunakan logika **Cloud Cleaner** yang melakukan pembersihan ganda (User & Active Sessions) langsung dari server dashboard.

### ⚡ Power User Bandwidth Management
Konfigurasi MikroTik tingkat lanjut kini tersedia dalam format visual yang mudah:
- **Burst Support:** Atur Burst Limit, Threshold, dan Time secara akurat.
- **Priority:** Skalakan prioritas traffic jaringan (1-8).
- **Rate-Limit Utility:** Generator string rate-limit otomatis yang presisi.

### 👥 Hybrid Bot Engine
Mendukung dua metode koneksi bot sekaligus:
1. **Webhook Mode:** Sangat cepat untuk produksi (Membutuhkan HTTPS).
2. **Long Polling Mode:** Stabil untuk development atau jika server tidak memiliki SSL.

---

## 🚀 Panduan Instalasi Cepat

### Opsi 1: One-Click Deploy (VPS Ubuntu/Debian)
Jalankan perintah ini di terminal Anda:
```bash
wget -qO- https://raw.githubusercontent.com/theworldinyourhand/Mikbotam-Next-Rinjani-Edition-MOD/main/deploy.sh | bash
```

### Opsi 2: Docker Deployment
```bash
docker-compose up -d
```

---

## 🛠️ Konfigurasi Setelah Instalasi
1. **Akses Dashboard:** Buka `http://ip-anda:3000`.
2. **Setup Kredensial:** Gunakan akun admin default Anda.
3. **Menu Settings:**
   - Masukkan IP, User, Pass MikroTik. Gunakan tombol **Test Connection**.
   - Masukkan Bot Token. Gunakan tombol **Set Webhook**.
4. **Bot Message Editor:** Kustomisasi teks balasan bot langsung dari dashboard tanpa menyentuh kode.

---

## 🔧 Troubleshooting Umum
- **Gagal Konek Router:** Pastikan port 8728 (API) di MikroTik sudah di-enable (IP > Services).
- **Bot Tidak Merespon:** Gunakan fitur **Test Bot Connection** di Settings untuk memvalidasi token.
- **Database Error:** Pastikan folder `prisma/` memiliki izin tulis (write permission) jika menggunakan VPS manual.

---

## 🤝 Kontribusi
Kami sangat terbuka bagi siapa pun yang ingin berkontribusi memperbaiki bug atau menambah fitur baru. Silakan kirimkan **Pull Request** Anda!

---
**Mikbotam Next - Empowering Your Network Management with Speed and Security.**
