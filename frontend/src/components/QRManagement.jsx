import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const QRManagement = ({ event, isOpen, onClose }) => {
    const [qrStatus, setQrStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // QR-Code-Status abrufen
    const fetchQRStatus = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/events/${event._id}/qr-status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Fehler beim Abrufen des QR-Status');
            }

            const data = await response.json();
            setQrStatus(data.status);
        } catch (error) {
            console.error('QR Status Error:', error);
            toast.error('Fehler beim Laden des QR-Status');
        } finally {
            setIsLoading(false);
        }
    };

    // QR-Codes generieren
    const generateQRCodes = async () => {
        setIsGenerating(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/events/qr-codes/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    eventId: event._id,
                    options: {
                        // Standard-Konfiguration für Rechnungen
                        idColumn: 1, // Spalte B für Rechnungs-IDs
                        qrColumn: 'C', // Spalte C für QR-Codes
                        nameColumn: 0, // Spalte A für Namen
                    }
                }),
            });

            if (!response.ok) {
                throw new Error('Fehler beim Generieren der QR-Codes');
            }

            const data = await response.json();
            
            if (data.errorCount > 0) {
                toast.error(`${data.errorCount} QR-Codes konnten nicht generiert werden`);
            }
            
            if (data.successCount > 0) {
                toast.success(`${data.successCount} QR-Codes erfolgreich generiert!`);
            }

            // Status neu laden
            await fetchQRStatus();
            
        } catch (error) {
            console.error('QR Generation Error:', error);
            toast.error('Fehler beim Generieren der QR-Codes');
        } finally {
            setIsGenerating(false);
        }
    };

    // Status laden wenn Modal geöffnet wird
    useEffect(() => {
        if (isOpen && event) {
            fetchQRStatus();
        }
    }, [isOpen, event]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        QR-Code Management
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Event Info */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900">{event.name}</h3>
                    <p className="text-blue-700 text-sm">{event.description}</p>
                    <p className="text-blue-600 text-xs mt-1">
                        Google Sheet: {event.sheetName}
                    </p>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-600">Status wird geladen...</span>
                    </div>
                )}

                {/* QR Status */}
                {qrStatus && !isLoading && (
                    <div className="mb-6">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-gray-800">
                                    {qrStatus.totalRows}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Datensätze gesamt
                                </div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-800">
                                    {qrStatus.qrCodesGenerated}
                                </div>
                                <div className="text-sm text-green-600">
                                    QR-Codes vorhanden
                                </div>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-red-800">
                                    {qrStatus.qrCodesMissing}
                                </div>
                                <div className="text-sm text-red-600">
                                    QR-Codes fehlen
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Fortschritt</span>
                                <span>{Math.round((qrStatus.qrCodesGenerated / qrStatus.totalRows) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: `${(qrStatus.qrCodesGenerated / qrStatus.totalRows) * 100}%` 
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Aktionen */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={generateQRCodes}
                        disabled={isGenerating}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                            isGenerating
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        }`}
                    >
                        {isGenerating ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                QR-Codes werden generiert...
                            </div>
                        ) : (
                            '🔄 QR-Codes generieren'
                        )}
                    </button>
                    
                    <button
                        onClick={fetchQRStatus}
                        disabled={isLoading}
                        className="py-3 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        🔄 Status aktualisieren
                    </button>
                </div>

                {/* QR Details */}
                {qrStatus && qrStatus.details && qrStatus.details.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-3">
                            Detailansicht ({qrStatus.details.length} Einträge)
                        </h4>
                        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Zeile</th>
                                        <th className="px-3 py-2 text-left">Rechnungs-ID</th>
                                        <th className="px-3 py-2 text-left">Name</th>
                                        <th className="px-3 py-2 text-center">QR-Code</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {qrStatus.details.map((item, index) => (
                                        <tr key={index} className="border-t border-gray-100">
                                            <td className="px-3 py-2 text-gray-600">{item.row}</td>
                                            <td className="px-3 py-2 font-medium">{item.invoiceId}</td>
                                            <td className="px-3 py-2 text-gray-700">{item.invoiceName || '-'}</td>
                                            <td className="px-3 py-2 text-center">
                                                {item.hasQRCode ? (
                                                    <span className="text-green-500 font-bold">✓</span>
                                                ) : (
                                                    <span className="text-red-500 font-bold">✗</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                        <div className="text-yellow-600 mr-2">💡</div>
                        <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">Hinweis:</p>
                            <p>
                                QR-Codes werden automatisch in Spalte C Ihres Google Sheets eingefügt. 
                                Stellen Sie sicher, dass die Spalte leer ist oder überschrieben werden kann.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                        Schließen
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QRManagement;