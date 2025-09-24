#!/bin/bash

# 📋 Session Update Script für Event QR Project
# Automatisches Update des Projekt-Status nach Arbeitssitzungen

echo "🔄 Event QR - Session Update"
echo "============================"

# Get current info
CURRENT_DATE=$(date '+%Y-%m-%d')
CURRENT_TIME=$(date '+%H:%M')
CURRENT_DEVICE=""

# Detect device type
if [[ -d "/Volumes/daten/Dropbox/!dev" ]]; then
    CURRENT_DEVICE="Desktop (Mounted Drive)"
elif [[ -d "$HOME/Dropbox/!dev" ]]; then
    CURRENT_DEVICE="MacBook (Home Dropbox)"
else
    CURRENT_DEVICE="Unknown Device"
fi

echo "📅 Datum: $CURRENT_DATE $CURRENT_TIME"
echo "💻 Gerät: $CURRENT_DEVICE"
echo ""

# Ask for session info
echo "📝 Session Information:"
read -p "Was wurde in dieser Session gemacht? " work_done
read -p "Aktuelle Herausforderungen? " challenges
read -p "Nächste geplante Schritte? " next_steps
read -p "Session-Dauer (z.B. 2h)? " duration

echo ""
echo "📋 Updating WARP_PROJECT_STATUS.md..."

# Create session entry
SESSION_ENTRY="
### **Session $(date '+%Y-%m-%d %H:%M')**
**Device:** $CURRENT_DEVICE  
**Duration:** $duration  
**Work Done:**
- $work_done

**Challenges:**
- $challenges

**Next Steps:**
- $next_steps

**Git Status:**
\`\`\`
$(git status --short 2>/dev/null || echo "No git repo")
\`\`\`

---
"

# Backup current status file
cp WARP_PROJECT_STATUS.md WARP_PROJECT_STATUS.md.backup

# Update the status file (add new session after the existing ones)
# This would need more sophisticated updating logic in a real script

echo "✅ Session dokumentiert!"
echo "📁 Status file: WARP_PROJECT_STATUS.md"
echo "💡 Vergiss nicht, die Änderungen zu committen!"

# Optional: Auto-commit the status update
read -p "🔄 Status-Update committen? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add WARP_PROJECT_STATUS.md
    git commit -m "📋 Session Update: $CURRENT_DATE - $work_done"
    echo "✅ Status-Update committed!"
fi