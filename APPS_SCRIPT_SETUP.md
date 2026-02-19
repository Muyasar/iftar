# Apps Script Deployment Guide

## Quick Setup (5 minutes)

### 1. Open the Apps Script Editor
Go to: https://docs.google.com/spreadsheets/d/1XHLRjVZXxuidu0lWqKQzQgur89uE_lCSslxEQsX0yos/edit

Click **Extensions → Apps Script**

### 2. Replace the Code
Delete everything in `Code.gs` and paste the contents of `appsscript_code.js` from this folder.

### 3. Deploy as Web App
1. Click **Deploy → New deployment**
2. Click the gear icon ⚙️ → Select **Web app**
3. Set:
   - **Description**: "Iftar Booking API"
   - **Execute as**: Me (jay@skyvertise.io)
   - **Who has access**: Anyone
4. Click **Deploy**
5. Authorize when prompted (click Advanced → Go to project)
6. **Copy the Web App URL** — it looks like: `https://script.google.com/macros/s/XXXXX/exec`

### 4. Update the Frontend
Open `index.html` and find this line near the top of the `<script>`:
```
const APPS_SCRIPT_URL = '';  // <-- PASTE YOUR WEB APP URL HERE
```
Paste your Web App URL between the quotes.

### 5. Test
Visit the page and make a test booking. Check the Google Sheet to verify it was recorded.

### 6. Commit & Push
```bash
cd /Users/jay/.openclaw/workspace/iftar
git add . && git commit -m "Add Apps Script URL" && git push
```

## Sheet URL
https://docs.google.com/spreadsheets/d/1XHLRjVZXxuidu0lWqKQzQgur89uE_lCSslxEQsX0yos/edit

## Important Notes
- The sheet is publicly readable (for availability checking)
- The Apps Script handles all email notifications
- If you redeploy, the URL stays the same (use "Manage deployments" to update)
