# Event-QR Deployment Guide
## qr.joerhalfmann.de

### 📋 Voraussetzungen

1. **Server mit Docker und Docker Compose**
2. **Domain qr.joerhalfmann.de** zeigt auf Server-IP
3. **SSL-Zertifikat** für HTTPS (Let's Encrypt empfohlen)
4. **Google Service Account JSON** für Sheets API

### 🚀 Deployment Steps

#### 1. Repository auf Server klonen
```bash
git clone https://github.com/govindvarma1/event-qr.git /opt/event-qr
cd /opt/event-qr
```

#### 2. Google Credentials konfigurieren
```bash
# Google Service Account JSON platzieren
cp /path/to/your/google-credentials.json ./google-credentials.json
chmod 600 ./google-credentials.json
```

#### 3. SSL-Zertifikate einrichten
```bash
# Für Let's Encrypt:
mkdir -p docker/ssl
certbot certonly --standalone -d qr.joerhalfmann.de
cp /etc/letsencrypt/live/qr.joerhalfmann.de/fullchain.pem docker/ssl/cert.pem
cp /etc/letsencrypt/live/qr.joerhalfmann.de/privkey.pem docker/ssl/key.pem
```

#### 4. Environment konfigurieren
```bash
# JWT Secret generieren
JWT_SECRET=$(openssl rand -hex 32)

# .env Datei erstellen
cat > .env << EOF
JWT_SECRET=${JWT_SECRET}
NODE_ENV=production
DB_URL=mongodb://mongodb:27017/event-qr
EOF
```

#### 5. System starten
```bash
# Container bauen und starten
docker-compose up -d

# Status prüfen
docker-compose ps
docker-compose logs -f event-qr
```

#### 6. Firewall konfigurieren
```bash
# Nur HTTPS und SSH zulassen
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 🔧 Wartung

#### Logs anzeigen
```bash
docker-compose logs -f event-qr
docker-compose logs -f mongodb
docker-compose logs -f nginx
```

#### Updates durchführen
```bash
cd /opt/event-qr
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

#### Backup erstellen
```bash
# MongoDB Backup
docker-compose exec mongodb mongodump --db event-qr --out /data/backup/$(date +%Y%m%d)

# Volumes sichern
docker run --rm -v event-qr_mongodb_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/mongodb-backup-$(date +%Y%m%d).tar.gz /data
```

### 🌐 DNS Konfiguration

Stelle sicher, dass `qr.joerhalfmann.de` auf deine Server-IP zeigt:

```dns
qr.joerhalfmann.de.  A     YOUR_SERVER_IP
```

### 📊 Monitoring

#### Health Checks
- **Backend:** `https://qr.joerhalfmann.de/health`
- **Container Status:** `docker-compose ps`
- **System Resources:** `docker stats`

#### SSL-Zertifikat Renewal
```bash
# Automatisches Renewal einrichten
echo "0 3 * * 0 certbot renew --quiet && docker-compose restart nginx" | crontab -
```

### 🔒 Sicherheit

1. **JWT Secret:** Stark und einzigartig
2. **MongoDB:** Nur intern erreichbar
3. **HTTPS:** SSL/TLS korrekt konfiguriert
4. **Updates:** Regelmäßige Security Updates
5. **Backups:** Automatisierte tägliche Backups

### 🐛 Troubleshooting

#### Container startet nicht
```bash
docker-compose logs event-qr
docker-compose down && docker-compose up -d
```

#### SSL-Probleme
```bash
# Zertifikat prüfen
openssl x509 -in docker/ssl/cert.pem -text -noout

# Nginx neu laden
docker-compose restart nginx
```

#### Datenbank-Probleme
```bash
# MongoDB-Status prüfen
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Collections auflisten
docker-compose exec mongodb mongosh event-qr --eval "show collections"
```

### 📞 Support

Bei Problemen:
1. Logs prüfen (`docker-compose logs`)
2. Health Checks durchführen
3. GitHub Issues erstellen: https://github.com/netztaucher/WP-Amelia-QR-Tickets/issues