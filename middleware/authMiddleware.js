const jwt = require("jsonwebtoken");

const TOKEN_ISSUER = "campusresolve";
const TOKEN_AUDIENCE = "campusresolve-web";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    !/^Bearer\s+\S+$/i.test(authHeader)
  ) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  try {
    const decoded = jwt.verify(
      token,
      getJwtSecret(),
      {
        algorithms: ["HS256"],
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
      }
    );

    if (
      !decoded ||
      !decoded.id ||
      !decoded.role ||
      !["student", "admin"].includes(decoded.role)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (
      !req.user ||
      !allowedRoles.includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to perform this action.",
      });
    }

    return next();
  };
};

module.exports = {
  authenticate,
  authorize,
  TOKEN_ISSUER,
  TOKEN_AUDIENCE,
};
