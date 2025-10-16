import express from 'express';
import { getAuth, getSpreadSheetValues, updateSpreadSheetsValues } from '../services/GoogleSheetServices.js';

const router = express.Router();

function resolveSheetName() {
  return process.env.SHEET_NAME || 'Tickets';
}

router.get('/stats', async (req, res) => {
  try {
    const auth = await getAuth();
    const spreadsheetId = process.env.SHEET_ID;
    if (!spreadsheetId) throw new Error('SHEET_ID not configured');

    const sheetName = resolveSheetName();
    const response = await getSpreadSheetValues({
      spreadsheetId,
      auth,
      range: `${sheetName}!A2:M1000` // Extended to include check-in (L) and check-out (M) columns
    });

    const rows = response.values || [];
    const stats = {
      ticketsSold: rows.length,
      ticketsCheckedIn: rows.filter(r => r[11] && r[11] !== '').length, // Column L (index 11)
      ticketsCheckedOut: rows.filter(r => r[12] && r[12] !== '').length, // Column M (index 12)
      currentlyInside: rows.filter(r => (r[11] && r[11] !== '') && (!r[12] || r[12] === '')).length,
    };
    return res.json(stats);
  } catch (err) {
    console.error('Error fetching ticket stats:', err?.message || err);
    return res.json({ ticketsSold: 0, ticketsCheckedIn: 0, ticketsCheckedOut: 0, currentlyInside: 0, error: 'Keine Verbindung zu Google Sheets - Testmodus' });
  }
});

router.post('/validate/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { action = 'checkin' } = req.body || {};

    const auth = await getAuth();
    const spreadsheetId = process.env.SHEET_ID;
    if (!spreadsheetId) throw new Error('SHEET_ID not configured');

    const sheetName = resolveSheetName();
    const response = await getSpreadSheetValues({
      spreadsheetId,
      auth,
      range: `${sheetName}!A2:M1000`
    });

    const rows = response.values || [];
    let ticketRow = null;
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][9] === ticketId) { // Column J (index 9) contains QR Data = Ticket ID
        ticketRow = rows[i];
        rowIndex = i + 2; // offset for header
        break;
      }
    }

    if (!ticketRow) {
      return res.status(404).json({ status: 'invalid', message: 'Ticket nicht gefunden', ticketId });
    }

    const timestamp = new Date().toLocaleString('de-DE');
    const hasCheckinTime = ticketRow[11] && ticketRow[11] !== ''; // Column L (index 11)
    const hasCheckoutTime = ticketRow[12] && ticketRow[12] !== ''; // Column M (index 12)

    if (action === 'checkin') {
      if (hasCheckinTime) {
        return res.status(400).json({ status: 'already_checked_in', message: 'Ticket bereits eingecheckt', ticketId, ticket: { name: ticketRow[1], checkinTime: ticketRow[11] } });
      }
      await updateSpreadSheetsValues({ spreadsheetId, auth, range: `${sheetName}!L${rowIndex}:L${rowIndex}`, data: [[timestamp]] });
      await updateSpreadSheetsValues({ spreadsheetId, auth, range: `${sheetName}!H${rowIndex}:H${rowIndex}`, data: [['checked_in']] });
      return res.json({ status: 'checked_in', message: 'Erfolgreich eingecheckt', ticketId, timestamp, ticket: { name: ticketRow[1], email: ticketRow[2], checkinTime: timestamp } });
    } else {
      if (!hasCheckinTime) {
        return res.status(400).json({ status: 'not_checked_in', message: 'Ticket wurde noch nicht eingecheckt', ticketId });
      }
      if (hasCheckoutTime) {
        return res.status(400).json({ status: 'already_checked_out', message: 'Ticket bereits ausgecheckt', ticketId, ticket: { name: ticketRow[1], checkoutTime: ticketRow[12] } });
      }
      await updateSpreadSheetsValues({ spreadsheetId, auth, range: `${sheetName}!M${rowIndex}:M${rowIndex}`, data: [[timestamp]] });
      await updateSpreadSheetsValues({ spreadsheetId, auth, range: `${sheetName}!H${rowIndex}:H${rowIndex}`, data: [['checked_out']] });
      return res.json({ status: 'checked_out', message: 'Erfolgreich ausgecheckt', ticketId, timestamp, ticket: { name: ticketRow[1], email: ticketRow[2], checkinTime: ticketRow[11], checkoutTime: timestamp } });
    }
  } catch (err) {
    console.error('Error validating ticket:', err?.message || err);
    return res.status(500).json({ status: 'error', message: 'Server-Fehler bei der Ticket-Validierung', ticketId: req.params.ticketId });
  }
});

router.get('/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const auth = await getAuth();
    const spreadsheetId = process.env.SHEET_ID;
    const sheetName = resolveSheetName();

    const response = await getSpreadSheetValues({ spreadsheetId, auth, range: `${sheetName}!A2:M1000` });
    const rows = response.values || [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][9] === ticketId) { // Column J (index 9) contains QR Data = Ticket ID
        const ticket = { ticketId: rows[i][9], name: rows[i][1], email: rows[i][2], status: rows[i][7], orderId: rows[i][8], checkinTime: rows[i][11], checkoutTime: rows[i][12] };
        return res.json({ status: 'found', ticket });
      }
    }
    return res.status(404).json({ status: 'not_found', message: 'Ticket nicht gefunden', ticketId });
  } catch (err) {
    console.error('Error fetching ticket:', err?.message || err);
    return res.status(500).json({ status: 'error', message: 'Server-Fehler beim Abrufen des Tickets' });
  }
});

export default router;
