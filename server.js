const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// =====================
// ENV LOGGING (SAFE)
// =====================
console.log("ENV CHECK:");
console.log({
  HOST: process.env.SMTP_HOST,
  PORT: process.env.SMTP_PORT,
  USER: process.env.SMTP_USER,
  FROM: process.env.SMTP_FROM,
  PASS: process.env.SMTP_PASS ? "OK" : "MISSING"
});

// =====================
// TRANSPORTER (DEBUG READY)
// =====================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  requireTLS: true,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },

  // HARD TIMEOUTS (prevents hanging on Render)
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// =====================
// SMTP VERIFY (VERY IMPORTANT)
// =====================
transporter.verify((error, success) => {
  if (error) {
    console.log("SMTP VERIFY FAILED ❌");
    console.log(error);
  } else {
    console.log("SMTP READY ✅");
  }
});

// =====================
// ROUTE
// =====================
app.post("/send", async (req, res) => {
  console.log("====================================");
  console.log("NEW REQUEST RECEIVED");
  console.log("BODY:", req.body);

  try {
    const { to, subject, html } = req.body;

    // VALIDATION
    if (!to || !subject || !html) {
      console.log("MISSING FIELDS ❌");
      return res.status(400).json({
        success: false,
        error: "Missing fields: to, subject, html"
      });
    }

    console.log("SENDING EMAIL...");

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    });

    console.log("EMAIL SENT ✅");
    console.log("MESSAGE ID:", info.messageId);

    return res.json({
      success: true,
      messageId: info.messageId
    });

  } catch (err) {
    console.log("❌ SMTP ERROR CAUGHT");
    console.log("NAME:", err.name);
    console.log("MESSAGE:", err.message);
    console.log("CODE:", err.code);
    console.log("STACK:", err.stack);

    return res.status(500).json({
      success: false,
      error: err.message,
      code: err.code || null
    });
  }
});

// =====================
// HEALTH CHECK
// =====================
app.get("/", (req, res) => {
  res.send("SMTP API Running OK");
});

// =====================
// START SERVER
// =====================
app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log("SERVER STARTED 🚀");
});
