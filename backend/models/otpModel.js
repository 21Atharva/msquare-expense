const mongoose = require('mongoose');

const otpSchema = mongoose.Schema({
  gmail: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  expiry: { type: Date, required: true },
});

module.exports = mongoose.model('OTP', otpSchema);
