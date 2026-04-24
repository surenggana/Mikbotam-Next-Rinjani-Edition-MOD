#!/bin/bash

# --- MIKBOTAM NEXT - RINJANI EDITION (MOD v2.3.0) ---
# Auto Deployment Script for Linux (Ubuntu/Debian)

echo "🚀 Starting Mikbotam Next Deployment (v2.3.0)..."

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

# 3. Setup Environment Variables
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        echo "AUTH_SECRET=$(openssl rand -base64 32)" > .env
    fi
    echo "✅ .env created with random AUTH_SECRET."
fi

# 4. Fresh Install Dependencies
echo "📦 Installing/Refreshing Dependencies..."
rm -rf node_modules package-lock.json
npm install

# 5. Fix SQLite Binary Compatibility
echo "🔧 Rebuilding SQLite binaries for current Node.js version..."
npm rebuild better-sqlite3

# 6. Database Setup
echo "🗄️ Syncing Database Schema..."
npx prisma generate
npx prisma db push

# 7. Build Project
echo "🏗️ Building Next.js Application..."
npm run build

# 8. Run with PM2
echo "🏁 Launching Application..."
pm2 delete mikbotam-next 2>/dev/null
pm2 start npm --name "mikbotam-next" -- start

# 9. Auto Start on Reboot
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

echo "✅ Mikbotam Next is now running!"
echo "🔗 Dashboard: http://localhost:3000"
