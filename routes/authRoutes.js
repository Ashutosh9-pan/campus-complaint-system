const express = require("express");

const {
  register,
  login,
  forgotPassword,
  resendResetOtp,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/authController");

const {
  loginLimiter,
  registerLimiter,
  passwordRecoveryLimiter,
} = require("../middleware/securityMiddleware");

const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyResetOtpValidation,
  resetPasswordValidation,
} = require("../middleware/authValidationMiddleware");

const router = express.Router();

router.post("/register", registerLimiter, registerValidation, register);
router.post("/login", loginLimiter, loginValidation, login);

router.post(
  "/forgot-password",
  passwordRecoveryLimiter,
  forgotPasswordValidation,
  forgotPassword
);

router.post(
  "/resend-reset-otp",
  passwordRecoveryLimiter,
  forgotPasswordValidation,
  resendResetOtp
);

router.post(
  "/verify-reset-otp",
  passwordRecoveryLimiter,
  verifyResetOtpValidation,
  verifyResetOtp
);

router.post(
  "/reset-password",
  passwordRecoveryLimiter,
  resetPasswordValidation,
  resetPassword
);

module.exports = router;
