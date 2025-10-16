import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import router from "./routes/router.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Resolve paths for serving frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "../frontend/dist");

// Health check endpoint
app.get('/qr/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// API routes must come before frontend catch-all
app.use('/qr/api', router);

// Serve static frontend under /qr
app.use('/qr', express.static(frontendDir));

// Serve root SPA paths explicitly
app.get(['/qr', '/qr/'], (_req, res) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
});

// SPA fallback for any /qr/* route to index.html
app.get('/qr/*', (_req, res) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
});

connectDB().then(() => {
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
}).catch((error) => {
    console.error("Failed to connect to the database", error);
});
