// MongoDB Initialisierung für event-qr Database
// Wird automatisch beim ersten Start ausgeführt

db = db.getSiblingDB('event-qr');

// Erstelle Collections mit Indexes
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });

db.events.createIndex({ "name": 1 });
db.events.createIndex({ "createdBy": 1 });
db.events.createIndex({ "sheetId": 1 });

// Optional: Erstelle einen Admin-User für Tests
// db.users.insertOne({
//   username: "admin",
//   email: "admin@qr.joerghalfmann.de",
//   password: "$2b$10$...", // Gehashtes Passwort
//   createdAt: new Date(),
//   role: "admin"
// });

print("Event-QR Database initialized successfully");