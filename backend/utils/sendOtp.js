// utils/sendOtp.js

const nodemailer = require("nodemailer");

const sendOtpEmail = async ({ toEmail, otp, senderEmail, senderPassword }) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: senderEmail,
      pass: senderPassword,
    },
  });

  const mailOptions = {
    from: `"Msquare Engineers" <${senderEmail}>`,
    to: toEmail,
    subject: "Your OTP for Msquare Engineers",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 10px;">
        <h2 style="color: #dc3545;">Msquare OTP Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes. Do not share it.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendOtpEmail;
