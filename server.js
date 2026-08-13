require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);


app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");

    res.status(200).json({
      success: true,
      message: "Server and database are connected successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed.",
    });
  }
});

app.get("/", (req, res) => {
  res.send("Campus Complaint Management System API is running.");
});

app.listen(PORT, async () => {
  try {
    await db.query("SELECT 1");
    console.log("Database connected successfully.");
    console.log(`Server running at http://localhost:${PORT}`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
});