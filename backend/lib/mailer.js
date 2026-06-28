/**
 * mailer.js — Nodemailer transporter + email templates
 * Configured for Gmail SMTP via .env credentials.
 * All sends are non-blocking (fire-and-forget with error logging).
 */

const nodemailer = require("nodemailer");

// ── Transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST  || "smtp.gmail.com",
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: { rejectUnauthorized: false },
});

// Verify connection once on startup (non-fatal)
transporter.verify((err) => {
  if (err) console.warn("⚠️  Mailer not ready:", err.message);
  else     console.log("✅ Mailer ready →", process.env.SMTP_EMAIL);
});

// ── HTML Templates ────────────────────────────────────────────

function otpEmailHtml({ buyerName, otp, orderId, productTitle, expireMinutes = 30 }) {
  const shortId = String(orderId).slice(-8).toUpperCase();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Delivery OTP — Agri-Smart Connect</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:32px 0;">
    <tr><td align="center">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#166534 0%,#16a34a 100%);padding:36px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:28px;">🌾</p>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
              Agri-Smart Connect
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
              Secure Delivery Verification
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">

            <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#1f2937;">
              Hello, ${buyerName || "Valued Customer"} 👋
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
              Your order <strong style="color:#374151;">#${shortId}</strong>
              ${productTitle ? `for <strong style="color:#374151;">${productTitle}</strong>` : ""}
              is out for delivery! Use the OTP below to confirm receipt.
            </p>

            <!-- OTP Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center" style="
                  background:linear-gradient(135deg,#1e1b4b,#312e81);
                  border-radius:20px;
                  padding:32px 24px;
                ">
                  <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.6);letter-spacing:0.12em;text-transform:uppercase;">
                    Your Delivery OTP
                  </p>
                  <p style="margin:0 0 12px;font-size:52px;font-weight:900;color:#fbbf24;letter-spacing:14px;font-family:'Courier New',monospace;">
                    ${otp}
                  </p>
                  <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55);">
                    ⏱ Expires in ${expireMinutes} minutes
                  </p>
                </td>
              </tr>
            </table>

            <!-- Steps -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:16px;padding:20px 24px;margin-bottom:28px;">
              <tr><td>
                <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#374151;">How to use your OTP:</p>
                ${[
                  ["📦", "Receive your order from the delivery person"],
                  ["🔍", "Inspect the package to confirm it's correct"],
                  ["🗣️", `Share the OTP <strong style="color:#1e3a5f;">${otp}</strong> with the delivery person`],
                  ["✅", "Order marked delivered — payment released to farmer"],
                ].map(([emoji, text], i) => `
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${i < 3 ? "10px" : "0"};">
                    <tr>
                      <td width="32" valign="top" style="font-size:16px;">${emoji}</td>
                      <td style="font-size:13px;color:#4b5563;line-height:1.5;">${text}</td>
                    </tr>
                  </table>
                `).join("")}
              </td></tr>
            </table>

            <!-- Warning -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:16px 20px;margin-bottom:28px;">
              <tr>
                <td width="24" valign="top" style="font-size:16px;padding-right:8px;">⚠️</td>
                <td style="font-size:12px;color:#dc2626;line-height:1.6;">
                  <strong>Security Notice:</strong> Share this OTP <em>only after</em> physically receiving your order.
                  Never share it before delivery. Agri-Smart Connect will never ask for your OTP.
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
              If you did not place this order, please contact us immediately.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f1f5f9;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
              © ${new Date().getFullYear()} Agri-Smart Connect — Connecting Farmers &amp; Buyers
            </p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">
              This is an automated message. Please do not reply.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

function deliveryConfirmedEmailHtml({ buyerName, orderId, productTitle, totalPrice }) {
  const shortId = String(orderId).slice(-8).toUpperCase();
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Delivery Confirmed</title></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#166534,#16a34a);padding:36px 40px;text-align:center;">
            <p style="margin:0;font-size:48px;">🎉</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;">Delivery Confirmed!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;text-align:center;">
            <p style="margin:0 0 20px;font-size:16px;color:#374151;font-weight:600;">
              Your order has been successfully delivered, ${buyerName || ""}!
            </p>
            <table cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:20px 32px;margin:0 auto 24px;text-align:left;">
              <tr><td style="font-size:13px;color:#166534;">
                <p style="margin:0 0 8px;"><strong>Order ID:</strong> #${shortId}</p>
                ${productTitle ? `<p style="margin:0 0 8px;"><strong>Product:</strong> ${productTitle}</p>` : ""}
                ${totalPrice   ? `<p style="margin:0;"><strong>Amount:</strong> ₹${Number(totalPrice).toLocaleString("en-IN")}</p>` : ""}
              </td></tr>
            </table>
            <p style="margin:0;font-size:13px;color:#6b7280;">
              Thank you for shopping with Agri-Smart Connect. Your payment has been released to the farmer. 🌾
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f1f5f9;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Agri-Smart Connect</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function paymentReleasedEmailHtml({ farmerName, orderId, productTitle, amount }) {
  const shortId = String(orderId).slice(-8).toUpperCase();
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Payment Released</title></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#854d0e,#ca8a04);padding:36px 40px;text-align:center;">
            <p style="margin:0;font-size:48px;">💰</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;">Payment Released!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;text-align:center;">
            <p style="margin:0 0 20px;font-size:16px;color:#374151;font-weight:600;">
              Great news, ${farmerName || "Farmer"}! Your delivery has been confirmed.
            </p>
            <table cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:16px;padding:20px 32px;margin:0 auto 24px;text-align:left;">
              <tr><td style="font-size:13px;color:#92400e;">
                <p style="margin:0 0 8px;"><strong>Order ID:</strong> #${shortId}</p>
                ${productTitle ? `<p style="margin:0 0 8px;"><strong>Product:</strong> ${productTitle}</p>` : ""}
                <p style="margin:0;font-size:20px;font-weight:900;color:#b45309;">
                  ₹${Number(amount).toLocaleString("en-IN")} <span style="font-size:13px;font-weight:400;">released</span>
                </p>
              </td></tr>
            </table>
            <p style="margin:0;font-size:13px;color:#6b7280;">
              The buyer verified delivery using OTP. Funds are being processed. Thank you for using Agri-Smart Connect! 🌾
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f1f5f9;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Agri-Smart Connect</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Send helpers (fire-and-forget) ────────────────────────────

async function sendOtpEmail({ to, buyerName, otp, orderId, productTitle }) {
  if (!to || !process.env.SMTP_EMAIL) return;
  try {
    await transporter.sendMail({
      from:    `"Agri-Smart Connect" <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
      to,
      subject: `🔐 Your Delivery OTP: ${otp} — Order #${String(orderId).slice(-8).toUpperCase()}`,
      html:    otpEmailHtml({ buyerName, otp, orderId, productTitle }),
      text:    `Your Delivery OTP is: ${otp}\n\nShare this ONLY after receiving your order.\nExpires in 30 minutes.\n\nOrder #${String(orderId).slice(-8).toUpperCase()}`,
    });
    console.log(`📧 OTP email sent → ${to}`);
  } catch (err) {
    console.error("📧 OTP email failed:", err.message);
  }
}

async function sendDeliveryConfirmedEmail({ to, buyerName, orderId, productTitle, totalPrice }) {
  if (!to || !process.env.SMTP_EMAIL) return;
  try {
    await transporter.sendMail({
      from:    `"Agri-Smart Connect" <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
      to,
      subject: `✅ Delivery Confirmed — Order #${String(orderId).slice(-8).toUpperCase()}`,
      html:    deliveryConfirmedEmailHtml({ buyerName, orderId, productTitle, totalPrice }),
      text:    `Your order #${String(orderId).slice(-8).toUpperCase()} has been delivered and confirmed. Payment released to farmer. Thank you!`,
    });
    console.log(`📧 Delivery confirmed email → ${to}`);
  } catch (err) {
    console.error("📧 Delivery confirmed email failed:", err.message);
  }
}

async function sendPaymentReleasedEmail({ to, farmerName, orderId, productTitle, amount }) {
  if (!to || !process.env.SMTP_EMAIL) return;
  try {
    await transporter.sendMail({
      from:    `"Agri-Smart Connect" <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
      to,
      subject: `💰 Payment Released — ₹${Number(amount).toLocaleString("en-IN")} — Order #${String(orderId).slice(-8).toUpperCase()}`,
      html:    paymentReleasedEmailHtml({ farmerName, orderId, productTitle, amount }),
      text:    `Payment of ₹${amount} released for order #${String(orderId).slice(-8).toUpperCase()}. Buyer verified delivery via OTP. Thank you!`,
    });
    console.log(`📧 Payment released email → ${to}`);
  } catch (err) {
    console.error("📧 Payment released email failed:", err.message);
  }
}

function calendarReminderEmailHtml({ farmerName, cropName, stageName, dueDate, note }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Crop Calendar Reminder</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#047857 0%,#10b981 100%);padding:36px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:32px;">🌱</p>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
              Agri-Smart Connect
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
              Crop Calendar & Timely Reminders
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#1f2937;">
              Hello, ${farmerName || "Farmer"} 👋
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.6;">
              This is a timely reminder for your <strong>${cropName}</strong> crop calendar. A planned stage is now due.
            </p>
            <!-- Details Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #a7f3d0;border-radius:18px;padding:24px;margin-bottom:24px;">
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:13px;color:#065f46;line-height:1.8;">
                        <p style="margin:0 0 8px;"><strong>🌾 Crop:</strong> ${cropName}</p>
                        <p style="margin:0 0 8px;font-size:16px;"><strong>📌 Stage:</strong> <span style="background:#059669;color:#ffffff;padding:4px 10px;border-radius:12px;font-weight:bold;font-size:14px;">${stageName}</span></p>
                        <p style="margin:0 0 8px;"><strong>⏱ Due Date:</strong> ${new Date(dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- Note / Advice -->
            ${note ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:16px;padding:20px;margin-bottom:24px;">
              <tr>
                <td valign="top" style="font-size:18px;padding-right:10px;">💡</td>
                <td style="font-size:13px;color:#92400e;line-height:1.6;">
                  <strong>Agronomic Guidance:</strong><br/>
                  ${note}
                </td>
              </tr>
            </table>
            ` : ""}
            <p style="margin:0 0 8px;font-size:13px;color:#4b5563;line-height:1.6;">
              Please log in to your dashboard to mark this stage as complete and view upcoming milestones.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f1f5f9;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
              © ${new Date().getFullYear()} Agri-Smart Connect — Empowering Indian Agriculture
            </p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">
              This is an automated message. Please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendCalendarReminderEmail({ to, farmerName, cropName, stageName, dueDate, note }) {
  if (!to || !process.env.SMTP_EMAIL) return;
  try {
    await transporter.sendMail({
      from:    `"Agri-Smart Connect" <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
      to,
      subject: `🌱 Crop Calendar Alert: ${cropName} — Stage "${stageName}" is due!`,
      html:    calendarReminderEmailHtml({ farmerName, cropName, stageName, dueDate, note }),
      text:    `Crop Calendar Reminder:\nCrop: ${cropName}\nStage: ${stageName}\nDue Date: ${new Date(dueDate).toLocaleDateString("en-IN")}\n\nAgronomic Note: ${note || "None"}`,
    });
    console.log(`📧 Calendar reminder email sent → ${to}`);
  } catch (err) {
    console.error("📧 Calendar reminder email failed:", err.message);
  }
}

module.exports = {
  sendOtpEmail,
  sendDeliveryConfirmedEmail,
  sendPaymentReleasedEmail,
  sendCalendarReminderEmail,
};

