require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../config/db");

const createAdmin = async () => {
  try {
    const {
      ADMIN_NAME,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Admin details are missing in the .env file.");
    }

    if (ADMIN_PASSWORD.length < 8) {
      throw new Error(
        "Admin password must contain at least 8 characters."
      );
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await db.query(
      `INSERT INTO users
       (name, email, password_hash, role)
       VALUES (?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password_hash = VALUES(password_hash),
         role = 'admin'`,
      [
        ADMIN_NAME.trim(),
        ADMIN_EMAIL.trim().toLowerCase(),
        passwordHash,
      ]
    );

    console.log("Admin account created successfully.");
  } catch (error) {
    console.error("Unable to create admin:", error.message);
  } finally {
    await db.end();
  }
};

createAdmin();