const { body, validationResult } = require("express-validator");

const EMAIL_MAX_LENGTH = 254;
const NAME_MAX_LENGTH = 100;
const OPTIONAL_TEXT_MAX_LENGTH = 120;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

const cleanString = (value) =>
  typeof value === "string" ? value.trim() : value;

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: errors.array({ onlyFirstError: true })[0].msg,
  });
};

const emailRule = body("email")
  .customSanitizer((value) =>
    String(value || "").trim().toLowerCase()
  )
  .notEmpty()
  .withMessage("Email is required.")
  .bail()
  .isLength({ max: EMAIL_MAX_LENGTH })
  .withMessage("Email address is too long.")
  .bail()
  .isEmail()
  .withMessage("Enter a valid email address.");

const passwordRule = (field, label = "Password") =>
  body(field)
    .isString()
    .withMessage(`${label} is required.`)
    .bail()
    .isLength({
      min: PASSWORD_MIN_LENGTH,
      max: PASSWORD_MAX_LENGTH,
    })
    .withMessage(
      `${label} must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`
    );

const registerValidation = [
  body("name")
    .customSanitizer(cleanString)
    .notEmpty()
    .withMessage("Name is required.")
    .bail()
    .isLength({ min: 2, max: NAME_MAX_LENGTH })
    .withMessage(
      `Name must be between 2 and ${NAME_MAX_LENGTH} characters.`
    ),
  emailRule,
  passwordRule("password"),
  body("hostel")
    .optional({ values: "falsy" })
    .customSanitizer(cleanString)
    .isLength({ max: OPTIONAL_TEXT_MAX_LENGTH })
    .withMessage(
      `Hostel must be ${OPTIONAL_TEXT_MAX_LENGTH} characters or fewer.`
    ),
  body("roomNumber")
    .optional({ values: "falsy" })
    .customSanitizer(cleanString)
    .isLength({ max: 30 })
    .withMessage("Room number must be 30 characters or fewer."),
  handleValidationErrors,
];

const loginValidation = [
  emailRule,
  body("password")
    .isString()
    .withMessage("Password is required.")
    .bail()
    .isLength({ min: 1, max: PASSWORD_MAX_LENGTH })
    .withMessage("Invalid email or password."),
  handleValidationErrors,
];

const forgotPasswordValidation = [
  emailRule,
  handleValidationErrors,
];

const verifyResetOtpValidation = [
  emailRule,
  body("otp")
    .customSanitizer((value) => String(value || "").trim())
    .matches(/^\d{6}$/)
    .withMessage("Enter a valid 6-digit OTP."),
  handleValidationErrors,
];

const resetPasswordValidation = [
  body("resetToken")
    .isString()
    .withMessage("Reset token is required.")
    .bail()
    .isLength({ min: 20, max: 4096 })
    .withMessage("Invalid password reset session."),
  passwordRule("newPassword", "New password"),
  passwordRule("confirmPassword", "Confirm password"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Passwords do not match.");
    }
    return true;
  }),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyResetOtpValidation,
  resetPasswordValidation,
};
