#!/usr/bin/env python3
"""Iftar/Suhoor Booking API — runs on Mac mini, exposed via Tailscale Funnel."""

import json
import subprocess
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
from datetime import datetime

SHEET_ID = "1UxWNVgalxHktpYqOteEntaPtVqWhFkruzAQqFI-rYjA"
ACCOUNT = "jay@skyvertise.io"
GOG = "/opt/homebrew/bin/gog"
PORT = 8092


def get_bookings():
    """Read all bookings from Google Sheet."""
    result = subprocess.run(
        [GOG, "sheets", "get", SHEET_ID, "A2:H100", "--account", ACCOUNT, "--json"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        return []

    try:
        data = json.loads(result.stdout)
    except (json.JSONDecodeError, TypeError):
        return []
    rows = data.get("values") or []
    bookings = []
    for row in rows:
        if len(row) >= 2 and row[0] and row[1]:
            bookings.append({"date": row[0], "meal": row[1]})
    return bookings


def add_booking(params):
    """Add a booking to the sheet."""
    date = params["date"]
    meal = params["meal_type"]
    name = params["name"]
    email = params["email"]
    phone = params["phone"]
    guests = str(params["guests"])
    notes = params.get("notes", "")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Check for duplicates
    existing = get_bookings()
    for b in existing:
        if b["date"] == date and b["meal"] == meal:
            return {"success": False, "error": f"{meal} on {date} is already booked."}

    # Append to sheet (pipe-separated = separate cells)
    row = f"{date}|{meal}|{name}|{email}|{phone}|{guests}|{notes}|{timestamp}"
    result = subprocess.run(
        [GOG, "sheets", "append", SHEET_ID, "A:H", row,
         "--account", ACCOUNT],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        return {"success": False, "error": "Failed to save booking."}

    # Send notification email to Abdullah
    subject = f"New {meal} Booking — {date} — Skyvertise"
    body = (
        f"New booking received:\n\n"
        f"Date: {date}\n"
        f"Meal: {meal}\n"
        f"Name: {name}\n"
        f"Email: {email}\n"
        f"Phone: {phone}\n"
        f"Guests: {guests}\n"
        f"Notes: {notes}\n\n"
        f"Please confirm this reservation."
    )
    subprocess.run(
        [GOG, "gmail", "send",
         "--to", "Abdullah.Jlelati@skyvertise.io",
         "--cc", "muyasar.abulkhair@skyvertise.io,yasser.mousli@skyvertise.io",
         "--subject", subject,
         "--body", body,
         "--account", ACCOUNT],
        capture_output=True, text=True
    )

    # Send confirmation to booker
    confirm_body = (
        f"Dear {name},\n\n"
        f"Thank you for your {meal} booking!\n\n"
        f"Date: {date}\n"
        f"Meal: {meal}\n"
        f"Guests: {guests}\n"
        f"Venue: Address Montgomery, Dubai\n\n"
        f"Our team will confirm your reservation shortly.\n\n"
        f"Ramadan Mubarak! 🌙\n— Skyvertise Team"
    )
    subprocess.run(
        [GOG, "gmail", "send",
         "--to", email,
         "--subject", f"{meal} Booking Confirmation — Skyvertise",
         "--body", confirm_body,
         "--account", ACCOUNT],
        capture_output=True, text=True
    )

    return {"success": True, "message": "Booking confirmed!"}


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/bookings":
            bookings = get_bookings()
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"bookings": bookings}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/bookings":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                params = json.loads(body)
                # Validate required fields
                required = ["date", "meal_type", "name", "email", "phone", "guests"]
                for field in required:
                    if field not in params or not params[field]:
                        self.send_response(400)
                        self._cors()
                        self.send_header("Content-Type", "application/json")
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": False, "error": f"Missing field: {field}"}).encode())
                        return

                result = add_booking(params)
                self.send_response(200 if result["success"] else 409)
                self._cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())

            except json.JSONDecodeError:
                self.send_response(400)
                self._cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Invalid JSON"}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]}")


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"Iftar Booking API running on port {PORT}")
    server.serve_forever()
