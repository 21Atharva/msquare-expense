const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const LeaveApplicationSchema = new mongoose.Schema({
  leaveId: {
    type: String,
    default: uuidv4,
    unique: true
  },
  employeeId: {
  type: String,
  required: true
},
  employeeName: {
    type: String,
    required: true
  },
  leaveType: {
    type: String,
    required: true
  },
  emailId: { type: String, required: true }, // ✅ Add this
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 200
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: {
    type: String
  },
  statusUpdatedOn: {
    type: Date
  },
 isStartHalfDay: {
    type: Boolean,
    default: false
  },
  startHalfDayType: {
    type: String,
    enum: ['Morning', 'Afternoon', ''],
    default: ''
  },
  isEndHalfDay: {
    type: Boolean,
    default: false
  },
  endHalfDayType: {
    type: String,
    enum: ['Morning', 'Afternoon', ''],
    default: ''
  },
  department: {
  type: String
},
totalDays: Number,
  session: {
    type: String,
    enum: ['AM', 'PM']
  }
}, { timestamps: true });

module.exports = mongoose.model('LeaveApplication', LeaveApplicationSchema);
