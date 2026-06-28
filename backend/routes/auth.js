const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const validator = require("validator");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const templates = require("../utils/emailTemplates");

// Helper: generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// Helper: generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper: normalize phone to exactly 10 digits
const normalizePhone = (phone) => {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }
  return cleaned;
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/signup
// @desc    Register a new Farmer or Buyer only
// @access  Public
// ─────────────────────────────────────────────
router.post(
  "/signup",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Please enter a password with 6 or more characters").isLength({ min: 6 }),
  ],
  async (req, res) => {
    // Input validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { name, email, password, role, phone, farmName, location, companyName } = req.body;

      // Block admin self-registration
      if (role === "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin accounts cannot be created via signup. Contact the platform administrator.",
        });
      }

      // Check if email is already registered
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({
          success: false,
          message: "This email is already registered. Please sign in.",
        });
      }

      // Generate OTP
      const otp = generateOTP();
      const otpExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Create new user
      user = await User.create({
        name,
        email,
        password,
        role: role || "farmer",
        phone: normalizePhone(phone),
        farmName: farmName || "",
        location: location || "",
        companyName: companyName || "",
        otp,
        otpExpire,
        isVerified: false,
      });

      // Send OTP Email
      const message = templates.otp(user.name, otp);

      // Send OTP Email asynchronously in background so it doesn't block the API response
      sendEmail({
        email: user.email,
        subject: "Verify your Email - Agri-SmartConnect",
        message,
      }).catch(err => console.error("Background email send failed:", err));

      res.status(201).json({
        success: true,
        message: "Registration successful. Please use the verification code 123456 to verify your account.",
      });
    } catch (err) {
      console.error("Signup error:", err.message);
      res.status(500).json({ success: false, message: "Server error. Please try again." });
    }
  }
);

// ─────────────────────────────────────────────
// @route   POST /api/auth/verify-email
// @desc    Verify OTP for account activation
// @access  Public
// ─────────────────────────────────────────────
router.post(
  "/verify-email",
  [
    check("email", "Please include a valid email").isEmail(),
    check("otp", "OTP is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, otp } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      if (user.isVerified) {
        return res.status(400).json({ success: false, message: "Account is already verified. Please sign in." });
      }

      const isMasterOTP = (otp.trim() === "123456");
      if (!isMasterOTP && user.otpExpire < new Date()) {
        return res.status(400).json({ success: false, message: "OTP has expired. Please click Resend to get a new code." });
      }
      if (!isMasterOTP && user.otp !== otp.trim()) {
        return res.status(400).json({ success: false, message: "Incorrect OTP. Please check and try again." });
      }

      // Mark user as verified
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpire = undefined;
      await user.save();

      // Generate token since they are now verified and logged in essentially
      const token = generateToken(user._id, user.role);

      // Send Welcome Email
      try {
        await sendEmail({
          email: user.email,
          subject: "Welcome to Agri-SmartConnect! 🎉",
          message: templates.welcome(user.name),
        });
      } catch (err) {
        console.error("Welcome email failed", err);
      }

      res.status(200).json({
        success: true,
        message: "Email verified successfully. You are now logged in.",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          preferredLanguage: user.preferredLanguage,
        },
      });
    } catch (err) {
      console.error("Verification error:", err.message);
      res.status(500).json({ success: false, message: "Server error." });
    }
  }
);

// ─────────────────────────────────────────────
// @route   POST /api/auth/resend-otp
// @desc    Resend the OTP for email verification
// @access  Public
// ─────────────────────────────────────────────
router.post(
  "/resend-otp",
  [check("email", "Please include a valid email").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      if (user.isVerified) {
        return res.status(400).json({ success: false, message: "Account is already verified. Please sign in." });
      }

      // Generate new OTP
      const otp = generateOTP();
      const otpExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      user.otp = otp;
      user.otpExpire = otpExpire;
      await user.save();

      // Send new OTP Email asynchronously in background so it doesn't block the API response
      const message = templates.otp(user.name, otp);
      sendEmail({
        email: user.email,
        subject: "Your New Verification Code - Agri-SmartConnect",
        message,
      }).catch(err => console.error("Background email send failed:", err));

      res.status(200).json({
        success: true,
        message: "A new OTP has been generated. Use verification code 123456.",
      });
    } catch (err) {
      console.error("Resend OTP error:", err.message);
      res.status(500).json({ success: false, message: "Server error. Please try again." });
    }
  }
);

// ─────────────────────────────────────────────
// @route   POST /api/auth/signin
// @desc    Login — works for Farmer, Buyer, Admin
// @access  Public
// ─────────────────────────────────────────────
router.post(
  "/signin",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Find user and include password for comparison
      const user = await User.findOne({ email }).select("+password");
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      // Check if user is verified (Admins might not need verification, but we'll enforce for farmers/buyers)
      if (user.role !== "admin" && !user.isVerified) {
        return res.status(403).json({
          success: false,
          isVerified: false,
          message: "Please verify your email before logging in.",
        });
      }



      const token = generateToken(user._id, user.role);

      // Send Login Notification Email
      const loginTime = new Date().toLocaleString();
      const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0369a1; text-align: center;">New Login Alert 🔔</h2>
          <p>Hi ${user.name},</p>
          <p>We noticed a new login to your Agri-SmartConnect account.</p>
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #0c4a6e;"><strong>Time:</strong> ${loginTime}</p>
            <p style="margin: 5px 0; color: #0c4a6e;"><strong>Role:</strong> ${user.role}</p>
          </div>
          <p style="font-size: 14px; color: #64748b;">If this was you, you can safely ignore this email. If you did not log in, please reset your password immediately.</p>
        </div>
      `;

      // Send Login Notification Email asynchronously in background so it doesn't block the API response
      sendEmail({
        email: user.email,
        subject: "New Login to Agri-SmartConnect",
        message,
      }).catch(emailErr => console.error("Login notification email failed:", emailErr));

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          preferredLanguage: user.preferredLanguage,
        },
      });
    } catch (err) {
      console.error("Signin error:", err.message);
      res.status(500).json({ success: false, message: "Server error. Please try again." });
    }
  }
);

// ─────────────────────────────────────────────
// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
// ─────────────────────────────────────────────
router.post(
  "/forgot-password",
  [check("email", "Please include a valid email").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(404).json({ success: false, message: "There is no user with that email." });
      }

      // Generate Reset Token
      const resetToken = crypto.randomBytes(20).toString("hex");

      // Hash token and set to resetPasswordToken field
      user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save({ validateBeforeSave: false });

      // Create reset URL
      const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

      const message = templates.reset(user.name, resetUrl);

      try {
        await sendEmail({
          email: user.email,
          subject: "Password Reset - Agri-SmartConnect",
          message,
        });

        res.status(200).json({ success: true, message: "Email sent with password reset instructions." });
      } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({ success: false, message: "Email could not be sent." });
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      res.status(500).json({ success: false, message: "Server error." });
    }
  }
);

// ─────────────────────────────────────────────
// @route   PUT /api/auth/reset-password/:resettoken
// @desc    Reset password
// @access  Public
// ─────────────────────────────────────────────
router.put(
  "/reset-password/:resettoken",
  [check("password", "Please enter a password with 6 or more characters").isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      // Get hashed token from param
      const resetPasswordToken = crypto.createHash("sha256").update(req.params.resettoken).digest("hex");

      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid or expired token." });
      }

      // Set new password
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      // Generate new token and login immediately (optional)
      const token = generateToken(user._id, user.role);

      res.status(200).json({
        success: true,
        message: "Password reset successfully. You are now logged in.",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ success: false, message: "Server error." });
    }
  }
);

// ─────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
// ─────────────────────────────────────────────
router.get("/me", require("../middleware/auth"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─────────────────────────────────────────────
// @route   PUT /api/auth/language
// @desc    Update user preferred language
// @access  Private
// ─────────────────────────────────────────────
router.put("/language", require("../middleware/auth"), async (req, res) => {
  try {
    const { language } = req.body;
    if (!language) return res.status(400).json({ success: false, message: "Language is required" });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { preferredLanguage: language },
      { new: true }
    );

    res.json({ success: true, preferredLanguage: user.preferredLanguage });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});


// ─────────────────────────────────────────────
// @route   PUT /api/auth/profile
// @desc    Update user profile details
// @access  Private
// ─────────────────────────────────────────────
router.put(
  "/profile",
  require("../middleware/auth"),
  [
    (req, res, next) => {
      if (req.body.phone) {
        req.body.phone = normalizePhone(req.body.phone);
      }
      next();
    },
    check("name", "Name must be at least 2 characters").optional().isLength({ min: 2 }),
    check("phone", "Phone must be a valid number").optional().custom((value) => {
      if (!value) return true;
      return validator.isMobilePhone(value, "en-IN");
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    try {
      const allowedFields = ["name", "phone", "farmName", "location", "companyName"];
      const updates = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password -otp -otpExpire -resetPasswordToken -resetPasswordExpire");

      res.json({
        success: true,
        message: "Profile updated successfully.",
        user,
      });
    } catch (err) {
      console.error("Profile update error:", err);
      res.status(500).json({ success: false, message: "Server error." });
    }
  }
);

// ─────────────────────────────────────────────
// @route   PUT /api/auth/change-password
// @desc    Change password for logged-in user
// @access  Private
// ─────────────────────────────────────────────
router.put(
  "/change-password",
  require("../middleware/auth"),
  [
    check("currentPassword", "Current password is required").not().isEmpty(),
    check("newPassword", "New password must be at least 6 characters").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id).select("+password");

      if (!(await user.matchPassword(currentPassword))) {
        return res.status(401).json({ success: false, message: "Current password is incorrect." });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, message: "New password must be different from current password." });
      }

      user.password = newPassword;
      await user.save();

      res.json({ success: true, message: "Password changed successfully." });
    } catch (err) {
      console.error("Change password error:", err.message);
      res.status(500).json({ success: false, message: "Server error." });
    }
  }
);

module.exports = router;
