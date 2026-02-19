// Apps Script Code for Iftar/Suhoor Booking
// Bound to spreadsheet: 1XHLRjVZXxuidu0lWqKQzQgur89uE_lCSslxEQsX0yos

var SHEET_ID = '1XHLRjVZXxuidu0lWqKQzQgur89uE_lCSslxEQsX0yos';
var NOTIFY_TO = 'Abdullah.Jlelati@skyvertise.io';
var NOTIFY_CC = 'muyasar.abulkhair@skyvertise.io,yasser.mousli@skyvertise.io';

function doGet(e) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var bookings = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][1]) {
      var d = data[i][0];
      var dateStr;
      if (d instanceof Date) {
        dateStr = Utilities.formatDate(d, 'Asia/Dubai', 'yyyy-MM-dd');
      } else {
        dateStr = String(d);
      }
      bookings.push({ date: dateStr, meal: String(data[i][1]) });
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ bookings: bookings }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var params = e.parameter;
    var date = params.date;
    var meal = params.meal_type;
    var name = params.name;
    var email = params.email;
    var phone = params.phone;
    var guests = params.guests;
    var notes = params.notes || '';

    if (!date || !meal || !name || !email || !phone || !guests) {
      return jsonResponse({ success: false, error: 'Missing required fields' });
    }

    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    var data = sheet.getDataRange().getValues();

    // Check if date+meal already booked
    for (var i = 1; i < data.length; i++) {
      var d = data[i][0];
      var existingDate;
      if (d instanceof Date) {
        existingDate = Utilities.formatDate(d, 'Asia/Dubai', 'yyyy-MM-dd');
      } else {
        existingDate = String(d);
      }
      if (existingDate === date && String(data[i][1]) === meal) {
        return jsonResponse({ success: false, error: meal + ' on ' + date + ' is already booked' });
      }
    }

    // Append booking
    var timestamp = Utilities.formatDate(new Date(), 'Asia/Dubai', 'yyyy-MM-dd HH:mm:ss');
    sheet.appendRow([date, meal, name, email, phone, guests, notes, timestamp]);

    // Send notification email
    var subject = 'New ' + meal + ' Booking — ' + date;
    var body = 'New booking received:\n\n' +
      'Date: ' + date + '\n' +
      'Meal: ' + meal + '\n' +
      'Name: ' + name + '\n' +
      'Email: ' + email + '\n' +
      'Phone: ' + phone + '\n' +
      'Guests: ' + guests + '\n' +
      'Notes: ' + notes + '\n' +
      'Timestamp: ' + timestamp;

    GmailApp.sendEmail(NOTIFY_TO, subject, body, {
      cc: NOTIFY_CC,
      name: 'Skyvertise Bookings'
    });

    // Send confirmation to booker with ICS
    var isIftar = (meal === 'Iftar');
    var startH = isIftar ? '1815' : '0300';
    var endH = isIftar ? '2130' : '0500';
    var dateParts = date.split('-');
    var dateCompact = dateParts.join('');

    var ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Skyvertise//Booking//EN',
      'BEGIN:VEVENT',
      'DTSTART;TZID=Asia/Dubai:' + dateCompact + 'T' + startH + '00',
      'DTEND;TZID=Asia/Dubai:' + dateCompact + 'T' + endH + '00',
      'SUMMARY:' + meal + ' at Address Montgomery — Skyvertise',
      'LOCATION:Address Montgomery, Dubai',
      'DESCRIPTION:' + meal + ' booking for ' + guests + ' guest(s). Booked by ' + name,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    var icsBlob = Utilities.newBlob(ics, 'text/calendar', meal.toLowerCase() + '-' + date + '.ics');

    GmailApp.sendEmail(email, 'Booking Confirmed — ' + meal + ' on ' + date, 
      'Ramadan Mubarak, ' + name + '! 🌙\n\n' +
      'Your ' + meal + ' booking has been confirmed:\n\n' +
      'Date: ' + date + '\n' +
      'Meal: ' + meal + '\n' +
      'Guests: ' + guests + '\n' +
      'Location: Address Montgomery, Dubai\n\n' +
      'A calendar invite is attached.\n\n' +
      'See you there!\n— Skyvertise Team',
      { attachments: [icsBlob], name: 'Skyvertise Bookings' }
    );

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
