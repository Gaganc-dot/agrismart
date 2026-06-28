const cron = require("node-cron");
const CropCalendar = require("../models/CropCalendar");
const notify = require("./notify");
const mailer = require("./mailer");

async function checkCropCalendarMilestones() {
  console.log("⏰ Scanning Crop Calendar Milestones for notifications...");
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const calendars = await CropCalendar.find({}).populate("farmer");
    let notificationCount = 0;
    
    for (let calendar of calendars) {
      let updated = false;
      const farmerObj = calendar.farmer;
      if (!farmerObj) continue;

      for (let stage of calendar.stages) {
        if (stage.status === "pending" && stage.dueDate <= today && !stage.notifiedAt) {
          // Send SSE & notification doc
          await notify(farmerObj._id, {
            type: "general",
            title: `Crop Calendar Reminder: ${calendar.cropName}`,
            message: `Stage "${stage.name}" is due today or overdue (${new Date(stage.dueDate).toLocaleDateString("en-IN")})!`,
          });

          // Send email notification (non-blocking)
          if (farmerObj.email) {
            mailer.sendCalendarReminderEmail({
              to: farmerObj.email,
              farmerName: farmerObj.name,
              cropName: calendar.cropName,
              stageName: stage.name,
              dueDate: stage.dueDate,
              note: stage.note,
            });
          }

          stage.notifiedAt = new Date();
          updated = true;
          notificationCount++;
        }
      }

      if (updated) {
        await calendar.save();
      }
    }
    console.log(`✅ Milestone check complete. Sent ${notificationCount} new notifications.`);
  } catch (err) {
    console.error("❌ Milestone check error:", err.message);
  }
}

function initCron() {
  // Run on startup
  setTimeout(checkCropCalendarMilestones, 5000); // Wait 5s for DB connection to settle
  
  // Sync mandi prices on startup
  setTimeout(async () => {
    console.log("⏰ Running initial Mandi Price Scraper sync on startup...");
    try {
      const { scrapeAndCacheMandiPrices } = require("../services/mandiScraper");
      await scrapeAndCacheMandiPrices();
    } catch (err) {
      console.error("❌ Mandi initial sync error:", err.message);
    }
  }, 8000); // Wait 8s for DB to settle

  // Schedule daily at 8:00 AM
  cron.schedule("0 8 * * *", () => {
    checkCropCalendarMilestones();
  });

  // Schedule Mandi Scraper every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("⏰ Running scheduled Mandi Price Scraper (every 30 mins)...");
    try {
      const { scrapeAndCacheMandiPrices } = require("../services/mandiScraper");
      await scrapeAndCacheMandiPrices();
    } catch (err) {
      console.error("❌ Mandi scraper cron job error:", err.message);
    }
  });

  console.log("⏰ Daily Crop Calendar & 30-Min Mandi Price Cron Scheduler initialized.");
}

module.exports = { initCron, checkCropCalendarMilestones };
// Trigger restart 5
