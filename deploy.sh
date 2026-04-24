#!/bin/bash

# --- MIKBOTAM NEXT - RINJANI EDITION (MOD v2.3.0) ---
# Auto Deployment Script for Linux (Ubuntu/Debian)

APP_PORT=3560
APP_DOMAIN="mikbotam.angelicadigital.id"
APP_DIR="/var/www/mikbotam"
PM2_NAME="mikbotam-next"

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

# 3. Install Nginx
if ! command -v nginx &> /dev/null
then
    echo "📦 Installing Nginx..."
    sudo apt install -y nginx
fi

# 4. Setup Environment Variables
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        echo "AUTH_SECRET=$(openssl rand -base64 32)" > .env
    fi
    echo "✅ .env created with random AUTH_SECRET."
fi

# 5. Fresh Install Dependencies
echo "📦 Installing/Refreshing Dependencies..."
rm -rf node_modules package-lock.json
npm install

# 6. Fix SQLite Binary Compatibility
echo "🔧 Rebuilding SQLite binaries for current Node.js version..."
npm rebuild better-sqlite3

# 7. Database Setup
echo "🗄️ Syncing Database Schema..."
npx prisma generate
npx prisma db push

# 8. Build Project
echo "🏗️ Building Next.js Application..."
npm run build

# 9. Run with PM2 on port 3560
echo "🏁 Launching Application on port $APP_PORT..."
pm2 delete $PM2_NAME 2>/dev/null
PORT=$APP_PORT pm2 start npm --name "$PM2_NAME" -- start

# 10. Auto Start on Reboot
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# 11. Configure Nginx reverse proxy
echo "🌐 Configuring Nginx for $APP_DOMAIN..."
sudo tee /etc/nginx/sites-available/$APP_DOMAIN > /dev/null <<EOF
server {
    listen 80;
    server_name $APP_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/$APP_DOMAIN /etc/nginx/sites-enabled/$APP_DOMAIN
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Mikbotam Next is now running!"
echo "🔗 Local:  http://localhost:$APP_PORT"
echo "🔗 Domain: http://$APP_DOMAIN"