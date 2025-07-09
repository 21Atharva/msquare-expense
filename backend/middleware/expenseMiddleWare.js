// middleware/expenseMiddleWare.js

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Auth Failed: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);

    req.userData = { userId: decoded.userId, gmail: decoded.gmail };
    next();
  } catch (error) {
    res.status(401).json({
      message: 'Auth Failed',
      error: error.message,
    });
  }
};
