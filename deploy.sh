#!/bin/bash

# --- MIKBOTAM NEXT AUTO DEPLOY ---
# Support: Ubuntu / Debian

echo "🚀 Starting Mikbotam Next Deployment..."

# 1. Update System
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (Version 20+)
if ! command -v node &> /dev/null
then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# 3. Install PM2 (Process Manager)
if ! command -v pm2 &> /dev/null
then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# 4. Install Dependencies
echo "📦 Installing Project Dependencies..."
npm install

# 5. Setup Database
echo "🗄️ Setting up Database..."
npx prisma generate
npx prisma db push

# 6. Build Project
echo "🏗️ Building Project (this may take a while)..."
npm run build

# 7. Start with PM2
echo "🏁 Starting Application with PM2..."
pm2 delete mikbotam-next 2>/dev/null
pm2 start npm --name "mikbotam-next" -- start

# 8. Bot Polling (Optional - if webhook not used)
# pm2 start npm --name "mikbotam-bot" -- run bot:polling

echo "✅ Deployment Finished!"
echo "🔗 Access your dashboard at http://YOUR_SERVER_IP:3000"
echo "---"
pm2 list
