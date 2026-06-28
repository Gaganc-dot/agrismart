const templates = {
  otp: (name, otp) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: #16a34a; width: 60px; height: 60px; border-radius: 15px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
          <span style="font-size: 30px;">🌱</span>
        </div>
        <h2 style="color: #166534; margin: 0;">Agri-SmartConnect</h2>
      </div>
      <h3 style="color: #111; font-size: 24px; margin-bottom: 10px;">Verify your email</h3>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">Hi ${name}, thank you for joining our community! Use the code below to complete your registration.</p>
      <div style="background: #f0fdf4; padding: 30px; border-radius: 15px; text-align: center; margin: 30px 0; border: 1px dashed #16a34a;">
        <p style="margin: 0 0 10px 0; color: #166534; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
        <h1 style="margin: 0; color: #15803d; font-size: 48px; letter-spacing: 10px; font-family: monospace;">${otp}</h1>
      </div>
      <p style="color: #94a3b8; font-size: 14px; text-align: center;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 40px 0;">
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2024 Agri-SmartConnect. Supporting India's Farmers.</p>
    </div>
  `,
  welcome: (name) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 50px;">🎉</span>
        <h2 style="color: #166534; margin: 10px 0;">Welcome Aboard!</h2>
      </div>
      <p style="font-size: 18px;">Hi ${name},</p>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">Your account is now verified! You can now explore all the features of Agri-SmartConnect, from listing your produce to getting real-time market prices.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="http://localhost:5173/signin" style="background: #16a34a; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; shadow: 0 4px 6px rgba(0,0,0,0.1);">Go to Dashboard</a>
      </div>
      <p style="color: #666; font-size: 16px;">We're excited to help you grow your farming business.</p>
      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 40px 0;">
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2024 Agri-SmartConnect.</p>
    </div>
  `,
  reset: (name, link) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 40px;">🔑</span>
        <h2 style="color: #0369a1; margin: 10px 0;">Password Reset</h2>
      </div>
      <p style="font-size: 16px;">Hi ${name},</p>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new one.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="${link}" style="background: #0369a1; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password</a>
      </div>
      <p style="color: #94a3b8; font-size: 14px; text-align: center;">This link will expire in 10 minutes. If you didn't request this, no further action is required.</p>
      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 40px 0;">
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2024 Agri-SmartConnect.</p>
    </div>
  `
};

module.exports = templates;
