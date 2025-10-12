#!/bin/bash

# Stop on any error
set -e

# Configuration
DEPLOY_DIR="/opt/event-qr"
DOMAIN="qr.joerhalfmann.de"
REPO_URL="https://github.com/netztaucher/WP-Amelia-QR-Tickets.git"

# 1. Setup directories
echo "🔧 Setting up directories..."
sudo mkdir -p "$DEPLOY_DIR"
sudo chown $USER:$USER "$DEPLOY_DIR"

# 2. Clone/update repository
echo "📦 Cloning/updating repository..."
if [ -d "$DEPLOY_DIR/.git" ]; then
    cd "$DEPLOY_DIR"
    git pull
else
    git clone "$REPO_URL" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
fi

# 3. SSL Setup
echo "🔒 Setting up SSL..."
sudo mkdir -p docker/ssl
if [ ! -f docker/ssl/cert.pem ]; then
    sudo certbot certonly --standalone -d "$DOMAIN"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" docker/ssl/cert.pem
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" docker/ssl/key.pem
    sudo chown -R $USER:$USER docker/ssl
    sudo chmod 600 docker/ssl/*.pem
fi

# 4. Environment Setup
echo "🌍 Setting up environment..."
if [ ! -f .env ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    cat > .env << EOF
JWT_SECRET=${JWT_SECRET}
NODE_ENV=production
DB_URL=mongodb://mongodb:27017/event-qr
EOF
fi

# 5. Google Credentials Check
echo "🔑 Checking Google credentials..."
if [ ! -f google-credentials.json ]; then
    echo "⚠️  Warning: google-credentials.json not found!"
    echo "Please place your Google credentials file in $DEPLOY_DIR/google-credentials.json"
    exit 1
fi

# 6. Build and Deploy
echo "🚀 Building and deploying..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 7. Firewall Setup
echo "🛡️ Setting up firewall..."
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 8. SSL Renewal Cron
echo "🔄 Setting up SSL renewal cron..."
(crontab -l 2>/dev/null; echo "0 3 * * 0 certbot renew --quiet && docker-compose -f $DEPLOY_DIR/docker-compose.yml restart nginx") | crontab -

# 9. Verify Deployment
echo "✅ Verifying deployment..."
sleep 10
docker-compose ps
echo "🌐 Testing API health endpoint..."
curl -k "https://$DOMAIN/health" || echo "Warning: Health check failed, please check logs"

echo "
📝 Deployment complete!

Services:
- Frontend: https://$DOMAIN
- Health Check: https://$DOMAIN/health

To view logs:
cd $DEPLOY_DIR && docker-compose logs -f

To monitor:
cd $DEPLOY_DIR && docker-compose ps
"