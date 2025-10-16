# Changelog

## [1.1.0] - 2025-10-16

### Changed
- 🔄 Simplified routing structure:
  - Frontend now served at root (/) instead of /qr
  - API routes under /api
  - Health check at /health
- ♻️ Refactored Google Sheets integration:
  - Use environment variables for credentials
  - Auto-detect sheet name from first sheet
  - Support for sheet name override via SHEET_NAME env var

### Fixed
- 🐛 Fixed sheet name resolution in QR controller
- 🔒 Improved environment variable handling for Google credentials

### Added
- ✨ Auto-detection of Google Sheet name
- 📝 Health check endpoint at /health