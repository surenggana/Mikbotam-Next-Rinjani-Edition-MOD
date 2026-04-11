#!/bin/bash

# --- MIKBOTAM NEXT - RINJANI EDITION (MOD v2.1.0) ---
# Auto Deployment Script for Linux (Ubuntu/Debian)

echo "🚀 Starting Mikbotam Next Deployment..."

# 1. Update & Check Node.js
sudo apt update
if ! command -v node &> /dev/null
then
    echo "📦 Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# 2. Install PM2
if ! command -v pm2 &> /dev/null
then
    echo "📦 Installing PM2 Manager..."
    sudo npm install -g pm2
fi

# 3. Fresh Install Dependencies
echo "📦 Installing/Refreshing Dependencies..."
rm -rf node_modules package-lock.json
npm install

# 4. Database Setup
echo "🗄️ Syncing Database Schema..."
npx prisma generate
npx prisma db push

# 5. Build Project
echo "🏗️ Building Next.js Application..."
npm run build

# 6. Run with PM2
echo "🏁 Launching Application..."
pm2 delete mikbotam-next 2>/dev/null
pm2 start npm --name "mikbotam-next" -- start

# 7. Auto Start on Reboot
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

echo "✅ Mikbotam Next is now running!"
echo "🔗 Dashboard: http://YOUR_SERVER_IP:3000"
