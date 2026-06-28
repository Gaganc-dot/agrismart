const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Create a transporter. 
  // If no credentials are provided in .env, we'll log to console (useful for development without valid SMTP).
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailtrap.io",
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_EMAIL || "test",
      pass: process.env.SMTP_PASSWORD || "test",
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || "Agri-SmartConnect"} <${process.env.FROM_EMAIL || "noreply@agrismart.com"}>`,
    to: options.email,
    subject: options.subject,
    html: options.message, // Accept HTML content
  };

  try {
    // If we are in development and no real SMTP credentials exist, just log it.
    if (!process.env.SMTP_EMAIL || process.env.SMTP_EMAIL === "test") {
      console.log("-------------------------------------------------");
      console.log(`📧 MOCK EMAIL SENT TO: ${options.email}`);
      console.log(`SUBJECT: ${options.subject}`);
      console.log(`MESSAGE HTML: \n${options.message}`);
      console.log("-------------------------------------------------");
      return;
    }

    const info = await transporter.sendMail(message);
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
