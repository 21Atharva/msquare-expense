// app.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const userRoutes = require("./routes/user");
const expenseRoutes = require("./routes/expense");
const leaveRoutes = require("./routes/leave");

const app = express();

// Use environment variable for database connection or fallback to local
const mongoUrl = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/Atharvaa";

mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log("Connected to database:", mongoUrl.includes('127.0.0.1') ? 'Local MongoDB' : 'Cloud MongoDB');
  })
  .catch((error) => {
    console.log("Not able to connect to database:", error.message);
  });



app.use(cors({
  origin: function (origin, callback) {
    // Allow requests from localhost, capacitor apps (mobile), and deployed frontends
    const allowedOrigins = [
      /^http:\/\/localhost:\d+$/,           // localhost with any port
      /^https:\/\/localhost:\d+$/,          // https localhost with any port
      'capacitor://localhost',              // Capacitor mobile apps
      'ionic://localhost',                  // Ionic mobile apps  
      'http://localhost',                   // Simple localhost
      'https://expense-tracker-t3cs.onrender.com',  // Old deployed frontend
      'https://YOUR-GODADDY-DOMAIN.com',     // Your GoDaddy frontend domain
      /^https:\/\/.*\.godaddy\.com$/         // Any GoDaddy subdomain
    ];
    
    // Allow requests with no origin (mobile apps, testing tools)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else {
        return allowedOrigin.test(origin);
      }
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins for now (remove in production)
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// Add a basic root route for API health check
app.get('/v1/api/', (req, res) => {
  res.json({
    message: 'Msquare Expense API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      users: '/v1/api/USER/',
      expenses: '/v1/api/',
      leaves: '/v1/api/'
    }
  });
});

app.use("/v1/api", expenseRoutes);
app.use("/v1/api/USER", userRoutes);
app.use("/v1/api", leaveRoutes);

module.exports = app;
