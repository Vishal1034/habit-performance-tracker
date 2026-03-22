# ðŸš€ Chrome Extension Setup Guide

## Installation Steps

### 1. Load Extension into Chrome

**Quick Steps:**
1. Open `chrome://extensions` in address bar
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select folder: `c:\...\habit-stability-tracker\extension\`
5. Done! âš¡ Icon appears in toolbar

### 2. Configure & Test

#### Step 1: Prepare Backend & Frontend
```
Terminal 1 (Backend):
cd server
npm run dev

Terminal 2 (Frontend):
cd client  
npm start
```

#### Step 2: Login to Web App
- Open http://localhost:3000
- Email: `demo@habitstabilitytracker.com`
- Password: `demo123`
- Click either **"Login (Real Email)"** or **"Login (Dummy Email)"**
- Important: Use the same email in extension popup (Step 4), otherwise habits/logs appear under different users

#### Step 3: Create Test Habits

**Habit 1: YouTube Tracking**
- Name: `YouTube`
- Type: `Focus`
- URLs: `youtube.com`
- Daily Goal: `60` mins

**Habit 2: GitHub Coding**
- Name: `GitHub`
- Type: `Focus`
- URLs: `github.com`
- Daily Goal: `120` mins

#### Step 4: Setup Extension Email

1. Click âš¡ extension icon in Chrome toolbar
2. See popup showing:
   - Stability Score: --
   - Focus: --m
   - Distraction: --m
3. Enter email field: `demo@habitstabilitytracker.com`
4. Click **Save Email**
5. Keep this email exactly same as the one used at web login
6. Click **ðŸ”„ Sync Data** â†’ Should sync with empty data first time

#### Step 5: Test Real Activity Tracking

1. **Open YouTube tab** (or other habit URL)
2. **Stay for 30+ seconds**
3. **Switch to another tab** (or different window)
   - Extension logs activity automatically
4. **Return to tracker tab**
5. **Open extension popup**
6. Click **ðŸ”„ Sync Data**
7. **Check Dashboard**
   - Go back to web app
   - See habit showing tracked time
   - Stability score updates with real %

## ðŸ“Š How Extension Tracking Works

```
Browser Activity â†’ Extension Detects â†’ Logs Stored Locally â†’ 
Click Sync â†’ Sends to Backend â†’ Dashboard Updates
```

**Auto-logging triggers:**
- âœ… Tab/window switch (when you click away)
- âœ… URL change (same tab, different domain)
-âœ… Every 15 seconds (periodic flush)

## âš ï¸ Common Issues

### Extension Icon Not Appearing
- âœ“ Refresh `chrome://extensions`
- âœ“ Make sure Developer mode is ON
- âœ“ Check manifest.json has correct "extension" path

### "Can't connect to localhost:5000"
- âœ“ Backend must be running (`npm run dev` in server/)
- âœ“ Check no other process on port 5000: `netstat -ano | findstr :5000`

### Dashboard Shows 0% Even After Tracking
- âœ“ Click **ðŸ”„ Sync Data** in extension popup
- âœ“ Check email matches in popup field
- âœ“ Check backend logs for errors: `npm run dev` output

### Extension Doesn't Track Activity
- âœ“ Extension must be loaded (visible in `chrome://extensions`)
- âœ“ No errors in extension? Check: Right-click extension â†’ "Inspect" 
- âœ“ Background service worker running? Should see in popup

## ðŸ§ª Quick Test Sequence

1. **Login** â†’ demo@habitstabilitytracker.com / demo123
2. **Create habit** â†’ YouTube / 60min goal
3. **Extension popup** â†’ Save email: demo@habitstabilitytracker.com
4. **Open YouTube** â†’ Wait 30s â†’ Switch tabs
5. **Extension popup** â†’ Click Sync Data
6. **Dashboard** â†’ See YouTube habit with tracked time % âœ“

## ðŸ“ Extension File Structure

```
extension/
â”œâ”€â”€ manifest.json          â† Chrome extension config
â”œâ”€â”€ background.js          â† Auto-tracking service worker
â”œâ”€â”€ popup/
â”‚   â”œâ”€â”€ popup.html         â† What user sees when click icon
â”‚   â”œâ”€â”€ popup.js           â† Sync & analytics display
â”‚   â””â”€â”€ popup.css          â† Popup styling
â””â”€â”€ icons/                 â† Extension icon images
```

## ðŸ”„ Extension <â†’ Backend Communication

**Extension Sends:**
```json
POST /api/logs
{
  "url": "youtube.com",
  "duration": 45,
  "email": "demo@habitstabilitytracker.com"
}
Header: X-User-Email: demo@habitstabilitytracker.com
```

**Dashboard Sends:**
```json
GET /api/analytics/today
Header: X-User-Email: demo@habitstabilitytracker.com
```

Both use **email-based identity** (no JWT token needed).

## ðŸŽ¯ Next Steps After Setup

- âœ… Test on different websites (GitHub, YouTube, etc.)
- âœ… Create distraction habits (Reddit, Twitter, etc.) to test Type
- âœ… Leave active for full day to see real analytics
- âœ… Check Peer Insights to see community comparison
- âœ… Export CSV report for external analysis

---

**Status:** Once extension is loaded and email is configured, you're ready to track! ðŸš€

