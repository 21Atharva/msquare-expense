const express = require('express');
const router = express.Router();
const LeaveApplication = require('../models/leaveApplication');
const Counter = require('../models/counter');
// const multer = require('multer');
// const upload = multer(); // memory storage
const mongoose = require('mongoose');


// POST: Create new leave application
const Employee = require('../models/userModel'); // import model if needed

const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // You can customize storage later

router.post('/leaves', upload.single('attachment'), async (req, res) => {
  try {
    const {
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
      isStartHalfDay = 'false',
      startHalfDayType = '',
      isEndHalfDay = 'false',
      endHalfDayType = '',
      totalDays
    } = req.body;

    console.log('📨 Received employeeId:', employeeId);
    console.log('📦 req.body:', req.body);
    console.log('📁 req.file:', req.file);

    // ✅ Validate required fields
    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // ✅ Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'Invalid employee ID format.' });
    }

    // 🔎 Fetch employee from UserSchema
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const leaveDays = parseFloat(totalDays);

    // Check if the employee is a manager
    const isManager = employee.role === 'manager';
    
    const newLeave = new LeaveApplication({
      employeeId,
      employeeName: employee.name,     // 🔁 from UserSchema
      emailId: employee.gmail,         // 🔁 from UserSchema
      managerId: employee.managerId,   // 🔁 Store employee's assigned manager
      leaveType,
      startDate,
      endDate,
      reason,
      isStartHalfDay: isStartHalfDay === 'true',
      startHalfDayType,
      isEndHalfDay: isEndHalfDay === 'true',
      endHalfDayType,
      totalDays: leaveDays,
      status: 'Pending',
      requiresAdminApproval: isManager, // Managers require admin approval
      adminApprovalStatus: isManager ? 'pending' : 'approved',
      attachment: req.file?.filename || null // Optional if you're storing file name
    });

    const saved = await newLeave.save();

    res.status(201).json({ message: 'Leave submitted successfully.', data: saved });

  } catch (error) {
    console.error('🔥 Error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// GET leaves for manager - returns leaves from employees assigned to this manager
// GET /api/leaves/manager/:managerId
router.get('/leaves/manager/:managerId', async (req, res) => {
  try {
    const leaves = await LeaveApplication.find({ managerId: req.params.managerId })
      .populate('managerId', 'name gmail');
    res.status(200).json(leaves);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching leaves for manager', error: err });
  }
});

// GET leaves for manager - returns leaves from employees assigned to this manager
router.get('/leaves/for-manager/:managerId', async (req, res) => {
  try {
    const manager = await Employee.findById(req.params.managerId);
    console.log("Fetched Manager:", manager);

    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    if (manager.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Not a manager.' });
    }

    // Filter leaves by managerId to show only leaves from employees assigned to this manager
    const leaves = await LeaveApplication.find({ managerId: req.params.managerId })
      .populate('managerId', 'name gmail');

    res.status(200).json({
      message: `Leave applications for manager ${manager.name}`,
      data: leaves,
      status: true
    });
  } catch (error) {
    console.error('Error fetching manager leaves:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.get('/leaves/by-department/:department', async (req, res) => {
  try {
    const leaves = await LeaveApplication.find({ department: req.params.department });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaves by department', error: error.message });
  }
});



function calculateTotalDays(start, end, isStartHalf, isEndHalf) {
  const s = new Date(start);
  const e = new Date(end);
  let diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (isStartHalf) diff -= 0.5;
  if (isEndHalf) diff -= 0.5;

  return diff;
}

router.patch('/leave/:leaveId', async (req, res) => {
  try {
    const { leaveId } = req.params;
    const updateFields = req.body;

    console.log("Update Request For Leave ID:", leaveId);
    console.log("Update Fields:", updateFields);

    const updatedLeave = await LeaveApplication.findOneAndUpdate(
      { leaveId: leaveId.trim() },
      updateFields,
      { new: true }
    );

    if (!updatedLeave) {
      console.warn("Leave not found for leaveId:", leaveId);
      return res.status(404).json({ message: 'Leave not found', status: false });
    }

    res.status(200).json({ message: 'Leave updated successfully', leave: updatedLeave, status: true });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: 'Server error', status: false });
  }
});

router.delete('/leave/:leaveId', async (req, res) => {
  try {
    const { leaveId } = req.params;

    const deleted = await LeaveApplication.findOneAndDelete({ leaveId });

    if (!deleted) {
      return res.status(404).json({ message: 'Leave not found', status: false });
    }

    res.status(200).json({ message: 'Leave deleted successfully', status: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', status: false });
  }
});




// GET: Get all leave applications
router.get('/leave', async (req, res) => {
  try {
    const leaves = await LeaveApplication.find().sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Get leave by ID
router.get('/:id', async (req, res) => {
  try {
    const leave = await LeaveApplication.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Get leave applications by employeeId
router.get('/leaves/by-email/:gmail', async (req, res) => {
  try {
    const gmail = req.params.gmail;
    const leaves = await LeaveApplication.find({ emailId: gmail });
    
    if (!leaves || leaves.length === 0) {
      return res.status(404).json({ message: 'No leave applications found for this email' });
    }

    res.status(200).json({ data: leaves, status: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// PATCH /v1/api/leave/status/:leaveId
router.patch('/leave/status/:leaveId', async (req, res) => {
  try {
    const { status } = req.body; // Expected: { status: 'Approved' } or 'Rejected'
    const leaveId = req.params.leaveId; // UUID string

    const updatedLeave = await LeaveApplication.findOneAndUpdate(
      { leaveId: leaveId },
      { status },
      { new: true }
    );

    if (!updatedLeave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    res.json(updatedLeave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Get all manager leaves pending admin approval
router.get('/manager-leaves/pending', async (req, res) => {
  try {
    const pendingManagerLeaves = await LeaveApplication.find({
      requiresAdminApproval: true,
      adminApprovalStatus: 'pending'
    }).populate('employeeId', 'name gmail role').sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Pending manager leaves retrieved',
      data: pendingManagerLeaves,
      status: true
    });
  } catch (error) {
    console.error('Error fetching pending manager leaves:', error);
    res.status(500).json({
      message: 'Server error',
      status: false,
      error: error.message
    });
  }
});

// PATCH: Admin approve/reject manager leave
router.patch('/manager-leave/admin-approval/:leaveId', async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approved' or 'rejected'
    
    const updateData = {
      adminApprovalStatus: action,
      statusUpdatedOn: new Date()
    };

    if (action === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
      updateData.status = 'Rejected'; // Also update main status
    } else if (action === 'approved') {
      updateData.status = 'Approved'; // Update main status to approved
    }

    const updatedLeave = await LeaveApplication.findOneAndUpdate(
      { leaveId: leaveId },
      updateData,
      { new: true }
    );

    if (!updatedLeave) {
      return res.status(404).json({
        message: 'Leave application not found',
        status: false
      });
    }

    const actionText = action === 'approved' ? 'approved' : 'rejected';
    res.status(200).json({
      message: `Manager leave ${actionText} successfully`,
      data: updatedLeave,
      status: true
    });
  } catch (error) {
    console.error('Error updating manager leave approval:', error);
    res.status(500).json({
      message: 'Server error',
      status: false,
      error: error.message
    });
  }
});

module.exports = router;
