# Event-QR Deployment Guide
## Vollautomatisches Deployment via WordPress Plugin

> **🚀 NEU:** Das event-qr System wird jetzt vollautomatisch über das WP Amelia QR Tickets Plugin deployed!
> Kein manueller Server-Zugriff mehr nötig.

## 🎯 Ein-Klick-Deployment (Empfohlen)

### Voraussetzungen

1. **WP Amelia QR Tickets Plugin** installiert
2. **Server mit Docker und Docker Compose**
3. **Domain qr.joerghalfmann.de** zeigt auf Server-IP
4. **Google Service Account JSON** (wird über Plugin konfiguriert)

### 🚀 Automatisches Deployment

#### 1. Plugin Setup
```bash
# WP Plugin installieren (über WordPress Admin oder manuell)
cd /wp-content/plugins/
git clone https://github.com/netztaucher/WP-Amelia-QR-Tickets.git wp-amelia-qr-tickets
cd wp-amelia-qr-tickets
composer install --no-dev
```

#### 2. Plugin aktivieren & konfigurieren
1. **WordPress Admin → Plugins → WP Amelia QR Tickets aktivieren**
2. **WP Amelia QR → Settings:**
   - Google Credentials JSON hochladen
   - Spreadsheet ID eingeben
   - "Verbindung testen" ✅

#### 3. Ein-Klick-Deployment
1. **WP Amelia QR → Dashboard**
2. **🚀 "Deploy / Restart Scanner" Button klicken**
3. **Automatischer Ablauf:**
   - ✅ Google Credentials werden kopiert
   - ✅ Sichere .env Datei generiert
   - ✅ event-qr Submodul aktualisiert
   - ✅ Docker Container gestartet (MongoDB + Backend + Frontend + Nginx)
   - ✅ Health Checks verifizieren Deployment
   - ✅ Scanner ist live: https://qr.joerghalfmann.de

#### 4. Status & Monitoring
- **Deployment Status:** Live im WordPress Admin
- **Logs anzeigen:** "📋 Logs anzeigen" Button
- **Container stoppen:** "⏹️ Stop Scanner" Button
- **Health Check:** Automatisch alle 30 Sekunden
- **URL:** https://qr.joerghalfmann.de (automatisch verfügbar nach Deployment)

### 📝 Was passiert beim automatischen Deployment?

1. **Git Submodul Update:** `event-qr` Submodul wird aktualisiert
2. **Credentials Setup:** Google Service Account JSON wird sicher kopiert
3. **Environment Generation:** Sichere `.env` Datei mit JWT Secret wird generiert
4. **Docker Build:** Multi-stage Dockerfile baut optimierte Container
5. **Service Start:** 
   - **MongoDB:** Datenbank mit Health Checks
   - **event-qr Backend:** Node.js API mit PM2 Process Management
   - **Frontend Build:** React App optimiert für Produktion
   - **Nginx Proxy:** SSL/HTTPS Reverse Proxy mit Rate Limiting
6. **Health Verification:** Automatische Tests auf localhost:5000 und qr.joerghalfmann.de
7. **Status Update:** WordPress Admin zeigt Live-Status

### 🎨 Admin Interface Features

- **Real-time Status:** Deployment Status (running/stopped/error) mit Timestamps
- **Version Management:** Wechsel zwischen `main` und `dev` Branches
- **Live Logs:** Docker Container Logs direkt im WordPress Admin
- **One-Click Actions:** Deploy, Stop, Restart, Logs - alles mit einem Klick
- **Automatic Retry:** Bei Fehlern automatische Neuversuche mit Exponential Backoff

---

## 🎨 Docker-Architektur

### 💻 Container Stack

```
┌──────────────────────────────────────────────┐
│              🌐 qr.joerghalfmann.de (HTTPS)              │
├──────────────────────────────────────────────┤
│  🚪 Nginx Reverse Proxy (SSL, Rate Limiting)  │
├──────────────────────────────────────────────┤
│   ⚙️ event-qr Backend (Node.js + PM2)   │   ⚛️ React Frontend (Static Build)   │
│        Port 5000 (Internal)         │         Nginx Served             │
├───────────────────────┴──────────────────────┤
│              🟢 MongoDB Database              │
│          Port 27017 (Internal Only)           │
└──────────────────────────────────────────────┘
```

### 📊 Datenfluss

```
WordPress Plugin → Google Sheets ←→ event-qr Backend ←→ MongoDB
                     ↑                                 ↑
              QR Scanner (React)              User Database
```

### 🔐 Sicherheit & Performance

- **SSL/TLS:** Automatische HTTPS-Weiterleitung
- **Rate Limiting:** API: 10 req/s, Scanning: 5 req/s
- **Internal Network:** MongoDB nur intern erreichbar
- **Health Checks:** Alle Container mit Monitoring
- **PM2 Clustering:** Automatischer Restart bei Fehlern
- **Gzip Compression:** Optimierte Übertragung

---

## 📚 Manuelles Deployment (Legacy)

> **⚠️ Nur bei Problemen mit automatischem Deployment verwenden**

### Manuelle Voraussetzungen

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
certbot certonly --standalone -d qr.joerghalfmann.de
cp /etc/letsencrypt/live/qr.joerghalfmann.de/fullchain.pem docker/ssl/cert.pem
cp /etc/letsencrypt/live/qr.joerghalfmann.de/privkey.pem docker/ssl/key.pem
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

Stelle sicher, dass `qr.joerghalfmann.de` auf deine Server-IP zeigt:

```dns
qr.joerghalfmann.de.  A     YOUR_SERVER_IP
```

### 📊 Monitoring

#### Health Checks
- **Backend:** `https://qr.joerghalfmann.de/health`
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

#### 🚀 Automatisches Deployment

**Problem:** Deployment Button funktioniert nicht
- **Lösung:** WordPress Admin → WP Amelia QR → "📋 Logs anzeigen" Button klicken
- **Debug:** Browser Konsole (F12) auf JavaScript-Fehler prüfen
- **Alternative:** Plugin deaktivieren/reaktivieren

**Problem:** "Docker is not available on this server"
- **Lösung:** Docker und Docker Compose auf Server installieren
- **Test:** SSH zum Server: `docker --version && docker-compose --version`

**Problem:** "Google credentials not found"
- **Lösung:** WP Admin → Settings → Google Credentials JSON konfigurieren
- **Test:** "Verbindung testen" Button verwenden

**Problem:** Container starten, aber Health Check schlägt fehl
- **Lösung:** "📋 Logs anzeigen" → Backend/MongoDB Logs prüfen
- **Häufig:** Port 5000 oder 3000 bereits belegt
- **Alternative:** Container manuell neustarten: "⏹️ Stop" → "🚀 Deploy"

#### 💻 Manuelle Fehlerbehebung

**Container startet nicht**
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

#### 🎯 Erste Hilfe (WordPress Admin)
1. **WP Amelia QR → Dashboard → "📋 Logs anzeigen"** klicken
2. **Browser Konsole (F12)** auf JavaScript-Fehler prüfen
3. **Plugin deaktivieren/reaktivieren** (manchmal hilft das)
4. **"Verbindung testen"** in Settings ausführen

#### 📊 Monitoring URLs
- **Scanner Frontend:** https://qr.joerghalfmann.de
- **API Health Check:** https://qr.joerghalfmann.de/health  
- **Backend Direct:** http://localhost:5000/health (nur lokal)

#### 📝 Logs & Debugging
```bash
# WordPress Debug-Log
tail -f /path/to/wordpress/wp-content/debug.log

# Docker Container Logs
docker-compose logs -f event-qr
docker-compose logs -f mongodb
docker-compose logs -f nginx

# System Resources
docker stats
```

#### 🆘 Frequently Asked Questions (FAQ)

**Q: Kann ich das System ohne WordPress Plugin deployen?**
A: Ja, siehe "Manuelles Deployment (Legacy)" Sektion oben.

**Q: Welche Ports werden verwendet?**
A: Extern nur 80/443 (HTTP/HTTPS), intern 5000 (Backend), 27017 (MongoDB).

**Q: Wie aktualisiere ich das System?**
A: "Deploy / Restart Scanner" Button zieht automatisch neueste Versionen.

**Q: Funktioniert das mit anderen Domains?**
A: Ja, Nginx-Konfiguration in `docker/nginx.conf` anpassen.

**Q: Kann ich mehrere Events parallel scannen?**
A: Ja, im Frontend können mehrere Events mit verschiedenen Google Sheets erstellt werden.

#### 🚑 Support Kanäle

Bei Problemen:
1. **Logs prüfen:** WordPress Admin → "📋 Logs anzeigen"
2. **Health Checks:** https://qr.joerghalfmann.de/health
3. **GitHub Issues:** [Problem melden](https://github.com/netztaucher/WP-Amelia-QR-Tickets/issues)
4. **Dokumentation:** [Wiki](https://github.com/netztaucher/WP-Amelia-QR-Tickets/wiki)

#### 💼 Enterprise Support

Für professionellen Support und Custom-Deployments:
- **Email:** info@netztaucher.de
- **Custom Domains:** qr.your-domain.de Setup
- **Scaling:** Multi-Server Deployment
- **Integration:** Custom WordPress/WooCommerce Anpassungen
