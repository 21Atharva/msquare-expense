// routes/user.js

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");
const authMiddleware = require("../middleware/expenseMiddleWare");
const sendOtpEmail = require('../utils/sendOtp');
const otpStore = new Map(); // In-memory OTP store (use Redis or DB in production)
const router = express.Router();

router.get('/user/:id', async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.post("/SIGN_UP", async (req, res) => {
  try {
    if (!/^\d{4}$/.test(req.body.pin)) {
      return res.status(400).json({ message: 'PIN must be a 4-digit number' });
    }

    const existingUser = await UserModel.findOne({ gmail: req.body.gmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const hashedPin = await bcrypt.hash(req.body.pin, 10);

    const user = new UserModel({
      name: req.body.name,
      username: req.body.username,
      gmail: req.body.gmail,
      password: hashedPassword,
      pin: hashedPin,
      userFirstSignUp: req.body.userFirstSignUp || new Date(),
      category: req.body.category || [],
      role: req.body.role || 'employee',
      department: req.body.department || '',
      status: 'pending', // 👈 mark account as pending by default
    });

    const result = await user.save();

    const token = jwt.sign(
      { gmail: result.gmail, userId: result._id },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Account Created. Awaiting Admin Approval.",
      status: true,
      data: {
        UserSince: result.userFirstSignUp,
        username: result.username,
        name: result.name,
        gmail: result.gmail,
        token,
        expiredToken: 3600,
        userId: result._id,
        role: result.role,
        department: result.department,
        accountStatus: result.status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Failed to create user',
      error: err.message,
      status: false,
    });
  }
});



// router.post("/register", async(req,res)=>{

//   try{
//     const existing = await user.findOne({gmail: req.body.gmail});
//   if(existing){
//     return res.status(400).json({
//       message:"user Alerady Exoist",
//       err:err.message
//     })
//   }

//   const hashPass= await bcrypt.hash(req.body.pass,10);

//   const newUser = new UserModel({
//     name:req.body.name,
//     gmail:req.body.gmail,
//     pass:hashPass
//   })

//   const result = await newUser.save();

//   const token = jwt.sign({userId: result.userId,gmail:result.gmail}, process.env.JWT_KEY);

//   res.status(201).json({

//     gmail:result.gmail,
//     // pass:result.pass,
//     token
//   })

//   }
// catch(err){
//   return res.status(400).json({
//     message:'User is not created',
//     err:err.message
//   })
// }

// });



// router.post("/login", async(req,res) =>{
//   try{

//     const user = await UserModel.findOne({gmail:req.body.gmail});
//     const pass = await bcrypt.compare(req.body.pass, user.pass);

//     const token = jwt.sign({gmail:user.gmail}, process.env.JWT_KEY,{expiresIn:'1h'});

//     res.status(200).json({
//       message:"Success",
//       data:{
//         gmail:user.gmail,
//         token
//       }
//     })

//   }
//   catch(err){
//     return res.status(401).json({
//       message:"Invalid",
//       err:err.message
//     })

//   }
// })













router.post("/LOGIN", async (req, res) => {
  try {
    const user = await UserModel.findOne({ gmail: req.body.gmail });

    if (!user) {
      return res.status(401).json({
        message: "Invalid Email Address",
        status: false,
      });
    }

    // ✅ Restrict if account status is not 'approved'
    if (user.status === "pending") {
      return res.status(403).json({
        message: `Your account is pending. Please wait for admin approval...`,
        status: false,
      });
    }

    if (user.status === "rejected") {
      return res.status(403).json({
        message: `Your account is rejected. Contact admin for more details.`,
        status: false,
      });
    }


    // ✅ Validate password
    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid Email Address or Password",
        status: false,
      });
    }

    // ✅ Validate 4-digit PIN
    const isPinValid = await bcrypt.compare(req.body.pin, user.pin);
    if (!isPinValid) {
      return res.status(401).json({
        message: "Incorrect 4-digit PIN",
        status: false,
      });
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { gmail: user.gmail, userId: user._id },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: "Login Successfully!",
      data: {
        token,
        latestLoginDate: new Date(),
        gmail: user.gmail,
        userId: user._id,
        role: user.role,
        expiredToken: 3600,
        accountStatus: user.status, // ✅ status field from DB renamed to accountStatus in response
      },
      status: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong!",
      status: false,
      error: err.message,
    });
  }
});



// GET /all-users
router.get('/all-users', async (req, res) => {
  try {
    const users = await UserModel.find({
  role: { $in: ['employee', 'manager'] }
}).select('-password -pin');

    res.status(200).json({
      status: true,
      message: 'All users fetched successfully',
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Error fetching users',
      error: err.message,
    });
  }
});

router.get('/managers', async (req, res) => {
  try {
    const managers = await UserModel.find({ role: 'manager' })
      .select('name username gmail department role'); // ✅ include department here

    res.status(200).json({ data: managers });
  } catch (err) {
    console.error('Error fetching managers:', err);
    res.status(500).json({ message: 'Failed to fetch managers' });
  }
});

// Route: GET /employees/by-department?department=Design
router.get('/employees/by-department', async (req, res) => {
  try {
    const { department } = req.query;
    if (!department) return res.status(400).json({ message: 'Department is required' });

    const employees = await UserModel.find({ role: 'employee', department });
    res.status(200).json({ data: employees });
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// GET all pending employees
router.get('/pending', async (req, res) => {
  try {
    const pendingUsers = await UserModel.find({ role: 'employee', status: 'pending || rejected || approved' }).select('-password -pin');
    res.status(200).json({
      status: true,
      message: 'Pending employees fetched successfully',
      data: pendingUsers,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Error fetching pending employees',
      error: err.message,
    });
  }
});

router.patch('/approve/:gmail', async (req, res) => {
  try {
    const updatedUser = await UserModel.findOneAndUpdate(
      { gmail: req.params.gmail },
      { status: 'approved' },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json({ message: 'Employee approved', data: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Error approving employee', error: err.message });
  }
});


router.patch('/reject/:gmail', async (req, res) => {
  try {
    const updatedUser = await UserModel.findOneAndUpdate(
      { gmail: req.params.gmail },
      { status: 'rejected' },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json({ message: 'Employee rejected', data: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting employee', error: err.message });
  }
});




const userSources = [];

router.post("/USER_SOURCE", (req, res) => {
  const { email, source, action, createdAt } = req.body;

  if (!email || !source || !action || !createdAt) {
    return res.status(400).json({ message: "Missing required fields", status: false });
  }

  userSources.push({ email, source, action, createdAt });

  return res.status(200).json({ message: "User source saved successfully", status: true });
});

router.delete("/DELETE_ACCOUNT/:id", async (req, res) => {
  try {
    const result = await UserModel.findOneAndDelete({ _id: req.params.id });

    if (!result) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    res.status(200).json({ message: "Successfully deleted account", status: true });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", status: false });
  }
});

router.get("/APP_VERSION", (req, res) => {
  res.status(200).json({
    message: "App Version successfully fetched",
    version: "v1.1.0",
    status: true,
  });
});



const nodemailer = require('nodemailer');


router.post('/SEND_OTP', async (req, res) => {
  const { gmail, otpSender } = req.body;

  if (!gmail || !otpSender?.email || !otpSender?.password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmail)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiry = Date.now() + 5 * 60 * 1000; // 5 min

  try {
    await sendOtpEmail({
      toEmail: gmail,
      otp,
      senderEmail: otpSender.email,
      senderPassword: otpSender.password,
    });

    otpStore.set(gmail, { otp, expiry });
    console.log(`OTP sent to ${gmail} using ${otpSender.email}`);

    res.status(200).json({ message: 'OTP sent successfully', status: true });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
});




router.post('/VERIFY_OTP', (req, res) => {
  const { gmail, otp } = req.body;

  if (!gmail || !otp) {
    return res.status(400).json({ message: "Email and OTP are required", status: false });
  }

  const data = otpStore.get(gmail);

  if (!data) {
    return res.status(400).json({ message: "No OTP found for this email", status: false });
  }

  if (Date.now() > data.expiry) {
    otpStore.delete(gmail);
    return res.status(400).json({ message: "OTP expired", status: false });
  }

  if (String(data.otp) !== String(otp)) {
    return res.status(400).json({ message: "Invalid OTP", status: false });
  }

  otpStore.delete(gmail);
  res.status(200).json({ message: "OTP verified successfully", status: true });
});


module.exports = router;
