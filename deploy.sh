#!/bin/bash

# --- MIKBOTAM NEXT - RINJANI EDITION (MOD v2.4.0) ---
# Auto Deployment Script for Linux (Ubuntu/Debian) - PostgreSQL Version

APP_PORT=3560
APP_DOMAIN="mikbotam.angelicadigital.id"
PM2_NAME="mikbotam-next"

echo "🚀 Starting Mikbotam Next Deployment (v2.4.0)..."

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

# 3. Check for PostgreSQL
if ! command -v psql &> /dev/null
then
    echo "⚠️ Warning: PostgreSQL is not detected on this system."
    echo "Please ensure PostgreSQL is installed and running before proceeding."
    echo "Run: sudo apt install postgresql postgresql-contrib"
fi

# 4. Setup Environment Variables
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env <<EOF
DATABASE_URL="postgresql://user:password@localhost:5432/mikbotam"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://$APP_DOMAIN"
EOF
    echo "✅ .env created. PLEASE UPDATE DATABASE_URL manually!"
fi

# 5. Fresh Install Dependencies
echo "📦 Installing Dependencies..."
rm -rf node_modules package-lock.json
npm install

# 6. Database Setup
echo "🗄️ Generating Prisma Client..."
npx prisma generate
# Note: db push is skipped here to avoid data loss on production
# Run it manually if you are sure: npx prisma db push

# 7. Build Project
echo "🏗️ Building Next.js Application..."
npm run build

# 8. Run with PM2
echo "🏁 Launching Application..."
pm2 delete $PM2_NAME 2>/dev/null
pm2 start npm --name "$PM2_NAME" -- run start

# 9. Auto Start on Reboot
pm2 save

# 10. Configure Nginx reverse proxy
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
# sudo nginx -t && sudo systemctl reload nginx

echo "✅ Mikbotam Next is now running!"
echo "🔗 Access: http://$APP_DOMAIN"
echo "⚠️ IMPORTANT: Update your .env with real database credentials!"
