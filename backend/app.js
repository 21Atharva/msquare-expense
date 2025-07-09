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

mongoose
  .connect("mongodb://127.0.0.1:27017/Atharvaa")
  .then(() => {
    console.log("Connected to database");
  })
  .catch(() => {
    console.log("Not able to connect to database");
  });



app.use(cors({
  origin: ['http://localhost:4200'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

app.use("/v1/api", expenseRoutes);
app.use("/v1/api/USER", userRoutes);
app.use("/v1/api", leaveRoutes);

module.exports = app;
