const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // MUST be false for 587
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
    from: process.env.SMTP_FROM
  }
});

app.post("/send", async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    });

    res.json({
      success: true,
      messageId: info.messageId
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

console.log({
  HOST: process.env.SMTP_HOST,
  PORT: process.env.SMTP_PORT,
  USER: process.env.SMTP_USER,
  FROM: process.env.SMTP_FROM,
  PASS: process.env.SMTP_PASS ? "OK" : "MISSING"
});
app.get("/", (req, res) => {
  res.send("SMTP API Running");
});

app.listen(process.env.PORT || 3000);
