var SHEET_ID = "1UxWNVgalxHktpYqOteEntaPtVqWhFkruzAQqFI-rYjA";

function doGet(e) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName("Sheet1");
  var lastRow = sheet.getLastRow();
  
  var bookings = [];
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0]) {
        var d = new Date(data[i][0]);
        var dateStr = Utilities.formatDate(d, "Asia/Dubai", "yyyy-MM-dd");
        bookings.push({ date: dateStr, meal: data[i][1] });
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ bookings: bookings }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var date = params.date;
    var meal = params.meal_type;
    var name = params.name;
    var email = params.email;
    var phone = params.phone;
    var guests = params.guests;
    var notes = params.notes || "";
    
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName("Sheet1");
    var lastRow = sheet.getLastRow();
    
    // Check for duplicate booking
    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
      for (var i = 0; i < data.length; i++) {
        if (data[i][0]) {
          var existingDate = Utilities.formatDate(new Date(data[i][0]), "Asia/Dubai", "yyyy-MM-dd");
          if (existingDate === date && data[i][1] === meal) {
            return ContentService.createTextOutput(JSON.stringify({
              success: false,
              error: meal + " on " + date + " is already booked."
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
    }
    
    // Add booking to sheet
    sheet.appendRow([date, meal, name, email, phone, guests, notes, new Date()]);
    
    // Send notification to Abdullah + CC Muyasar & Yasser
    var subject = "New " + meal + " Booking — " + date + " — Skyvertise";
    var body = "New booking received:\n\n" +
      "📅 Date: " + date + "\n" +
      "🍽 Meal: " + meal + "\n" +
      "👤 Name: " + name + "\n" +
      "📧 Email: " + email + "\n" +
      "📱 Phone: " + phone + "\n" +
      "👥 Guests: " + guests + "\n" +
      "📝 Notes: " + notes + "\n\n" +
      "Please confirm this reservation.";
    
    GmailApp.sendEmail("Abdullah.Jlelati@skyvertise.io", subject, body, {
      cc: "muyasar.abulkhair@skyvertise.io,yasser.mousli@skyvertise.io",
      name: "Skyvertise Bookings"
    });
    
    // Send confirmation to booker with .ics calendar invite
    var isIftar = (meal === "Iftar");
    var startH = isIftar ? 18 : 3;
    var startM = isIftar ? 15 : 0;
    var endH = isIftar ? 21 : 5;
    var endM = 30;
    
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    var dp = date.split("-");
    var dtStart = dp[0] + dp[1] + dp[2] + "T" + pad(startH) + pad(startM) + "00";
    var dtEnd = dp[0] + dp[1] + dp[2] + "T" + pad(endH) + pad(endM) + "00";
    
    var ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Skyvertise//Booking//EN",
      "BEGIN:VEVENT",
      "DTSTART;TZID=Asia/Dubai:" + dtStart,
      "DTEND;TZID=Asia/Dubai:" + dtEnd,
      "SUMMARY:" + meal + " at Address Montgomery — Skyvertise",
      "LOCATION:Address Montgomery\\, Dubai",
      "DESCRIPTION:" + meal + " booking for " + guests + " guest(s). Booked by " + name + ".",
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
    
    var confirmBody = "Dear " + name + ",\n\n" +
      "Thank you for your " + meal + " booking! 🌙\n\n" +
      "📅 Date: " + date + "\n" +
      "🍽 Meal: " + meal + "\n" +
      "👥 Guests: " + guests + "\n" +
      "📍 Venue: Address Montgomery, Dubai\n\n" +
      "A calendar invite is attached.\n" +
      "Our team will confirm your reservation shortly.\n\n" +
      "Ramadan Mubarak!\n— Skyvertise Team";
    
    GmailApp.sendEmail(email, meal + " Booking Confirmation — Skyvertise", confirmBody, {
      name: "Skyvertise Bookings",
      attachments: [Utilities.newBlob(ics, "text/calendar", meal.toLowerCase() + "-" + date + ".ics")]
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Booking confirmed!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
