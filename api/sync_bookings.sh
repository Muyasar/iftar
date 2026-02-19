#!/bin/bash
# Sync FormSubmit booking emails to Google Sheet
# Run via OpenClaw cron every 5 minutes

GOG="/opt/homebrew/bin/gog"
ACCOUNT="jay@skyvertise.io"
SHEET_ID="1UxWNVgalxHktpYqOteEntaPtVqWhFkruzAQqFI-rYjA"

# Search for unread FormSubmit emails in the last hour
EMAILS=$($GOG gmail list --account "$ACCOUNT" --query "from:noreply@formsubmit.co subject:Skyvertise is:unread newer_than:1h" --json 2>/dev/null)

if [ -z "$EMAILS" ] || [ "$EMAILS" = "null" ] || [ "$EMAILS" = "[]" ]; then
  exit 0
fi

echo "$EMAILS" | python3 -c "
import json, sys, subprocess

emails = json.load(sys.stdin)
if not isinstance(emails, list):
    sys.exit(0)

GOG = '/opt/homebrew/bin/gog'
ACCOUNT = 'jay@skyvertise.io'
SHEET_ID = '1UxWNVgalxHktpYqOteEntaPtVqWhFkruzAQqFI-rYjA'

# Get existing bookings to avoid duplicates
result = subprocess.run([GOG, 'sheets', 'get', SHEET_ID, 'A2:B100', '--account', ACCOUNT, '--json'], 
                       capture_output=True, text=True)
existing = set()
try:
    data = json.loads(result.stdout)
    for row in (data.get('values') or []):
        if len(row) >= 2:
            existing.add(f'{row[0]}|{row[1]}')
except:
    pass

for email_info in emails:
    msg_id = email_info.get('id', '')
    if not msg_id:
        continue
    
    # Read the email
    detail = subprocess.run([GOG, 'gmail', 'read', msg_id, '--account', ACCOUNT, '--json'],
                           capture_output=True, text=True)
    try:
        msg = json.loads(detail.stdout)
        body = msg.get('body', '') or msg.get('snippet', '')
        
        # Parse fields from the table email
        import re
        date = re.search(r'Date[:\s]+(\d{4}-\d{2}-\d{2})', body)
        meal = re.search(r'Meal Type[:\s]+(Iftar|Suhoor)', body)
        name = re.search(r'Name[:\s]+(.+?)(?:\n|$)', body)
        email_addr = re.search(r'Email[:\s]+(\S+@\S+)', body)
        phone = re.search(r'Phone[:\s]+(\+?\d[\d\s-]+)', body)
        guests = re.search(r'Guests[:\s]+(\d+)', body)
        notes = re.search(r'Notes[:\s]+(.+?)(?:\n|$)', body)
        
        if date and meal:
            key = f'{date.group(1)}|{meal.group(1)}'
            if key not in existing:
                row = '|'.join([
                    date.group(1),
                    meal.group(1),
                    name.group(1).strip() if name else '',
                    email_addr.group(1).strip() if email_addr else '',
                    phone.group(1).strip() if phone else '',
                    guests.group(1) if guests else '',
                    notes.group(1).strip() if notes else '',
                    'synced'
                ])
                subprocess.run([GOG, 'sheets', 'append', SHEET_ID, 'A:H', row, '--account', ACCOUNT])
                existing.add(key)
                print(f'Added: {key}')
    except Exception as e:
        print(f'Error processing {msg_id}: {e}')
    
    # Mark as read
    subprocess.run([GOG, 'gmail', 'read', msg_id, '--account', ACCOUNT, '--mark-read'], 
                  capture_output=True, text=True)
"
