# Chrome Extension Setup Guide

## Installation Steps

### 1. Load Extension into Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `extension/` folder from this project.
5. Confirm the extension icon appears in the browser toolbar.

### 2. Start Backend and Frontend

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm start
```

### 3. Login to the Web App

1. Open `http://localhost:3000`.
2. Login with your account.
3. Use the same email in the extension popup to keep data under one user.

### 4. Configure Extension Email

1. Click the extension icon.
2. Enter your login email.
3. Click **Save Email**.
4. Click **Sync Data** once to initialize data flow.

### 5. Test Activity Tracking

1. Open a site that matches a habit URL (for example `youtube.com` or `github.com`).
2. Stay on the tab for at least 30 seconds.
3. Switch tabs or windows.
4. Open the extension popup and click **Sync Data**.
5. Verify the dashboard shows updated tracked time.

## How Tracking Works

`Browser activity -> Extension detects tab/url change -> Local log buffer -> Sync Data -> Backend logs -> Dashboard analytics`

Auto logging is triggered by:
- Tab/window switch
- URL/domain change
- Periodic flush (about every 15 seconds)

## Common Issues

### Extension icon not appearing
- Refresh `chrome://extensions`.
- Make sure Developer mode is enabled.
- Confirm the `extension/manifest.json` path is correct.

### Cannot connect to `localhost:5000`
- Ensure backend is running: `cd server && npm run dev`.
- Check if port 5000 is occupied: `netstat -ano | findstr :5000`.

### Dashboard still shows no data
- Click **Sync Data** in popup.
- Confirm popup email matches web app login email.
- Check backend terminal logs for API errors.

### Extension not tracking activity
- Confirm extension is enabled on `chrome://extensions`.
- Inspect extension popup/background for errors from extension details page.
- Verify background service worker is active.

## Extension File Structure

```text
extension/
|-- manifest.json
|-- background.js
|-- popup/
|   |-- popup.html
|   |-- popup.js
|   `-- popup.css
`-- icons/
```

## Extension and Backend Requests

Extension sends activity logs:

```json
POST /api/logs
{
  "url": "youtube.com",
  "duration": 45,
  "email": "demo@habitstabilitytracker.com"
}
```

Dashboard fetches analytics:

```json
GET /api/analytics/today
Header: X-User-Email: demo@habitstabilitytracker.com
```

## Status

When the extension is loaded and email is configured, tracking is ready to use.
