import express from "express";
import { GenerateQR, RedeemQR, ScanQR, GenerateEventQRCodes, GetEventQRStatus } from "../controllers/QRController.js";
import adminAuthRouter from "./adminAuthRoutes.js";
import eventRouter from "./eventRouter.js";
import eventQRRouter from "./eventQRRouter.js";
import ticketRoutes from "./ticketRoutes.js";
import adminAuthMiddleware from "../middlewares/adminAuthMiddleware.js";

const router = express.Router();

router.get("/health", (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

router.get("/", (req, res) => {
    res.send("You are on home route");
});
router.post("/generate-qr", GenerateQR);
router.post("/scan-qr", ScanQR);
router.post("/redeem-qr", RedeemQR);

// 🆕 Event-basierte QR-Code-Generierung für Rechnungen
router.post("/events/qr-codes/generate", adminAuthMiddleware, GenerateEventQRCodes);
router.get("/events/:eventId/qr-status", adminAuthMiddleware, GetEventQRStatus);

// Use event routes
router.use('/events', eventRouter);
router.use('/tickets', ticketRoutes);

router.use("/auth", adminAuthRouter); 

router.use("/event/qr", eventQRRouter) // Use admin routes

export default router;
