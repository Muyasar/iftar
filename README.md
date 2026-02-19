# Skyvertise Iftar & Suhoor Booking Page

Ramadan 2026 booking page for Address Montgomery, Dubai.

## Setup

### 1. Formspree Configuration

The form uses [Formspree](https://formspree.io) to handle submissions (no backend needed).

1. Go to **https://formspree.io** and sign in (or create a free account)
2. Click **New Form** → set recipient to `Abdullah.Jlelati@skyvertise.io`
3. In form settings, add CC recipients:
   - `muyasar.abulkhair@skyvertise.io`
   - `yasser.mousli@skyvertise.io`
4. Copy the **endpoint ID** (looks like `xyzabcde`)
5. In `index.html`, replace `YOUR_FORMSPREE_ID` with your endpoint ID:
   ```
   action="https://formspree.io/f/YOUR_FORMSPREE_ID"
   ```

### 2. GitHub Pages Deployment

1. Create a repo (or use the existing `skyvertise.io` repo)
2. Place the `iftar/` folder at the repo root
3. Enable GitHub Pages (Settings → Pages → Deploy from branch)
4. The page will be live at `skyvertise.io/iftar`

## Files

- `index.html` — Complete booking page (HTML + CSS + JS, no dependencies)

## Features

- Dark theme with gold/amber Ramadan accents
- Mobile-responsive design
- Date picker restricted to Ramadan 2026 (Feb 28 – Mar 29)
- Iftar/Suhoor toggle
- AJAX form submission with success message
- CSS-only decorative elements (stars, crescent moon, lanterns)
