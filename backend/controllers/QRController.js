import { getAuth, getSpreadSheet, getSpreadSheetValues, updateSpreadSheetsValues } from "../services/GoogleSheetServices.js";
import QRCode from "qrcode";
import Event from "../models/eventModel.js";

export const ScanQR = async (req, res, next) => {
    try {
        const { id } = req.body;
        const auth = await getAuth();
        const spreadsheetId = process.env.SHEET_ID;
        const sheets = await getSpreadSheetValues({spreadsheetId, auth, range: "FOOD_COUPONS_QR!A2:F1000"});  
        for(let i=0; i<sheets.values.length; i++) {
            if(id === sheets.values[i][1]) {
                return res.status(200).json({excelRow: i+2,name: sheets.values[i][0],couponsLeft: sheets.values[i][4]});
            }
        }
        return res.status(404).json({msg: "User didn't register"})
    } catch(ex) {
        next(ex);
    }
}

export const RedeemQR = async (req, res, next) => {
    try {
        const {id, count} = req.body;
        const auth = await getAuth();
        const spreadsheetId = process.env.SHEET_ID;
        const sheets = await getSpreadSheetValues({spreadsheetId, auth, range: "FOOD_COUPONS_QR!A2:F1000"});  
        for(let i=0; i<sheets.values.length; i++) {
            if(id === sheets.values[i][1]) {
                console.log(sheets.values[i][4])
                if (sheets.values[i][4] === "0") {
                    return res.status(401).json({msg: "All Coupons Scanned"});
                } else {
                    updateSpreadSheetsValues({spreadsheetId, auth, range: `FOOD_COUPONS_QR!E${i+2}:E${i+2}`, data: [[sheets.values[i][4]-count]]});
                    return res.status(200).json({excelRow: i+2,msg: "Scanned Sucessfully", couponsLeft: sheets.values[i][4]-count});
                }
            }
        }
        return res.status(404).json({msg: "User didn't register"})
    } catch (ex) {
        next(ex);
    }
}

export const GenerateQR = async (req, res, next) => {
    try {
        const {from, to} = req.body;
        const auth = await getAuth();
        const spreadsheetId = process.env.SHEET_ID;
        const sheets = await getSpreadSheetValues({spreadsheetId, auth, range: `FOOD_COUPONS_QR!A${from}:F${to}`});
        for(let i=0; i<sheets.values.length; i++) {
            const generatedQRCode = await QRCode.toDataURL(sheets.values[i][1]);
            updateSpreadSheetsValues({spreadsheetId, auth, range: `FOOD_COUPONS_QR!C${i+from}:C${i+from}`, data: [[generatedQRCode]]});
        }
        res.send(sheets);
    } catch (ex) {
        next(ex);
    }
}

// 🆕 Event-basierte QR-Code-Generierung für Rechnungen
export const GenerateEventQRCodes = async (req, res, next) => {
    try {
        const { eventId, options = {} } = req.body;
        const userId = req.user.userId; // Aus dem Auth-Middleware
        
        // Event finden und Berechtigung prüfen
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: "Event not found" });
        }
        
        if (event.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ msg: "Not authorized to generate QR codes for this event" });
        }
        
        const auth = await getAuth();
        const { sheetId, sheetName } = event;
        
        // Standardkonfiguration für Rechnungen
        const config = {
            dataRange: options.dataRange || `${sheetName}!A2:F1000`, // Startzeile 2 (Header überspringen)
            idColumn: options.idColumn || 1, // Spalte B (Index 1) für Rechnungs-IDs
            qrColumn: options.qrColumn || 'C', // Spalte C für QR-Codes
            nameColumn: options.nameColumn || 0, // Spalte A für Namen/Beschreibung
            amountColumn: options.amountColumn || 2, // Spalte C für Betrag
            statusColumn: options.statusColumn || 4, // Spalte E für Status
            ...options
        };
        
        // Daten aus Google Sheet lesen
        const sheets = await getSpreadSheetValues({
            spreadsheetId: sheetId, 
            auth, 
            range: config.dataRange
        });
        
        if (!sheets.values || sheets.values.length === 0) {
            return res.status(404).json({ msg: "No data found in the specified range" });
        }
        
        const generatedQRs = [];
        let successCount = 0;
        let errorCount = 0;
        
        // Für jede Rechnung QR-Code generieren
        for (let i = 0; i < sheets.values.length; i++) {
            const row = sheets.values[i];
            const invoiceId = row[config.idColumn];
            const invoiceName = row[config.nameColumn];
            
            // Skip empty rows
            if (!invoiceId || invoiceId.trim() === '') {
                continue;
            }
            
            try {
                // QR-Code Datenstruktur für Rechnungen
                const qrData = {
                    eventId: eventId,
                    invoiceId: invoiceId,
                    type: 'invoice',
                    timestamp: new Date().toISOString()
                };
                
                // QR-Code als Data URL generieren
                const generatedQRCode = await QRCode.toDataURL(JSON.stringify(qrData), {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                
                // QR-Code in Google Sheet schreiben (Spalte C)
                const cellRange = `${sheetName}!${config.qrColumn}${i + 2}:${config.qrColumn}${i + 2}`;
                await updateSpreadSheetsValues({
                    spreadsheetId: sheetId, 
                    auth, 
                    range: cellRange, 
                    data: [[generatedQRCode]]
                });
                
                generatedQRs.push({
                    row: i + 2,
                    invoiceId: invoiceId,
                    invoiceName: invoiceName,
                    qrCodeGenerated: true
                });
                
                successCount++;
                
            } catch (error) {
                console.error(`Error generating QR for invoice ${invoiceId}:`, error);
                generatedQRs.push({
                    row: i + 2,
                    invoiceId: invoiceId,
                    invoiceName: invoiceName,
                    qrCodeGenerated: false,
                    error: error.message
                });
                errorCount++;
            }
        }
        
        res.status(200).json({
            msg: "QR Code generation completed",
            eventId: eventId,
            eventName: event.name,
            totalProcessed: generatedQRs.length,
            successCount: successCount,
            errorCount: errorCount,
            details: generatedQRs
        });
        
    } catch (ex) {
        console.error('GenerateEventQRCodes Error:', ex);
        next(ex);
    }
}

// 🆕 QR-Code-Status für Event abrufen
export const GetEventQRStatus = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.userId;
        
        // Event finden und Berechtigung prüfen
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: "Event not found" });
        }
        
        if (event.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ msg: "Not authorized" });
        }
        
        const auth = await getAuth();
        const { sheetId, sheetName } = event;
        
        // Daten aus Google Sheet lesen
        const sheets = await getSpreadSheetValues({
            spreadsheetId: sheetId, 
            auth, 
            range: `${sheetName}!A2:F1000`
        });
        
        if (!sheets.values) {
            return res.status(404).json({ msg: "No data found" });
        }
        
        const qrStatus = {
            totalRows: sheets.values.length,
            qrCodesGenerated: 0,
            qrCodesMissing: 0,
            details: []
        };
        
        sheets.values.forEach((row, index) => {
            const invoiceId = row[1];
            const qrCode = row[2]; // Spalte C
            
            if (invoiceId && invoiceId.trim() !== '') {
                const hasQR = qrCode && qrCode.startsWith('data:image');
                
                if (hasQR) {
                    qrStatus.qrCodesGenerated++;
                } else {
                    qrStatus.qrCodesMissing++;
                }
                
                qrStatus.details.push({
                    row: index + 2,
                    invoiceId: invoiceId,
                    invoiceName: row[0],
                    hasQRCode: hasQR
                });
            }
        });
        
        res.status(200).json({
            eventId: eventId,
            eventName: event.name,
            status: qrStatus
        });
        
    } catch (ex) {
        console.error('GetEventQRStatus Error:', ex);
        next(ex);
    }
}
