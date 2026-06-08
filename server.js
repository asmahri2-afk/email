const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// FAIL FAST: check env before creating transporter
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.log("Missing SMTP env variables");
}

// TRANSPORTER (FIXED)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // 587 = STARTTLS
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },

  // IMPORTANT: prevents infinite hanging on Render
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// VERIFY SMTP ON START (critical debug)
transporter.verify((err, success) => {
  if (err) {
    console.log("SMTP VERIFY FAILED:", err.message);
  } else {
    console.log("SMTP READY");
  }
});

// ROUTE FIXED
app.post("/send", async (req, res) => {
  try {
    console.log("REQUEST:", req.body);

    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: "Missing fields (to, subject, html)"
      });
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    });

    return res.json({
      success: true,
      messageId: info.messageId
    });

  } catch (err) {
    console.log("SEND ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("SMTP API Running");
});

app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log("Server started");
});
