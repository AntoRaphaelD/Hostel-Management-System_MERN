// controllers/wardenController.js
const bcrypt = require('bcryptjs');
const { 
  User, Enrollment, RoomAllotment, HostelRoom, RoomType, Session,
  Attendance, Leave, Complaint, Suspension, Holiday, Fee, 
  AdditionalCollection, AdditionalCollectionType, Rebate,
  HostelFacilityRegister, HostelFacility, MessCharge, Transaction
} = require('../models');
const { Op } = require('sequelize');

// STUDENT ENROLLMENT
const enrollStudent = async (req, res) => {
  try {
    const { username, password, session_id, email } = req.body;
    const hostel_id = req.user.hostel_id;

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    // Create student user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = await User.create({
      username,
      email: email || `${username}@hostel.com`,
      password: hashedPassword,
      role: 'student',
      hostel_id
    });

    // Create enrollment
    const enrollment = await Enrollment.create({
      student_id: student.id,
      hostel_id,
      session_id
    });

    res.status(201).json({ 
      success: true,
      data: {
        student: { ...student.toJSON(), password: undefined }, 
        enrollment 
      },
      message: 'Student enrolled successfully'
    });
  } catch (error) {
    console.error('Student enrollment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getStudents = async (req, res) => {
  try {
    console.log('Getting students, req.user:', req.user); // Debug
    
    // Simplify the query first
    const students = await User.findAll({
      where: { 
        role: 'student',
        is_active: true 
      },
      attributes: { exclude: ['password'] },
      order: [['username', 'ASC']]
    });

    console.log('Students found:', students.length); // Debug
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// ROOM MANAGEMENT
const getAvailableRooms = async (req, res) => {
  try {
    console.log('Getting available rooms, req.user:', req.user); // Debug
    
    // Simplify room query
    const rooms = await HostelRoom.findAll({
      where: { 
        is_occupied: false, 
        is_active: true 
      },
      include: [{ 
        model: RoomType,
        attributes: ['id', 'name', 'capacity']
      }],
      order: [['room_number', 'ASC']]
    });

    console.log('Available rooms found:', rooms.length); // Debug
    res.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Available rooms error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

const allotRoom = async (req, res) => {
  try {
    const { student_id, room_id } = req.body;
    const hostel_id = req.user.hostel_id;

    // Validate student belongs to this hostel
    const student = await User.findOne({
      where: { 
        id: student_id, 
        role: 'student', 
        hostel_id: hostel_id,
        is_active: true 
      }
    });

    if (!student) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student not found in this hostel' 
      });
    }

    // Check if student already has an active room allotment
    const existingAllotment = await RoomAllotment.findOne({
      where: { 
        student_id: student_id, 
        is_active: true 
      }
    });

    if (existingAllotment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student already has a room assigned' 
      });
    }

    // Check if room is available and belongs to this hostel
    const room = await HostelRoom.findOne({
      where: { 
        id: room_id, 
        hostel_id: hostel_id,
        is_occupied: false, 
        is_active: true 
      }
    });

    if (!room) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room not available or not found' 
      });
    }

    // Create room allotment
    const allotment = await RoomAllotment.create({
      student_id,
      room_id,
      allotment_date: new Date(),
      is_active: true
    });

    // Update room status
    await room.update({ is_occupied: true });

    // Return allotment with related data
    const allotmentWithDetails = await RoomAllotment.findByPk(allotment.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username']
        },
        {
          model: HostelRoom,
          include: [
            {
              model: RoomType,
              attributes: ['id', 'name', 'capacity']
            }
          ]
        }
      ]
    });

    res.status(201).json({ 
      success: true, 
      data: allotmentWithDetails,
      message: 'Room allotted successfully'
    });
  } catch (error) {
    console.error('Error in room allotment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// DASHBOARD STATISTICS
const getDashboardStats = async (req, res) => {
  try {
    const hostel_id = req.user.hostel_id;

    const totalStudents = await User.count({
      where: { role: 'student', hostel_id, is_active: true }
    });

    const totalRooms = await HostelRoom.count({
      where: { hostel_id, is_active: true }
    });

    const occupiedRooms = await HostelRoom.count({
      where: { hostel_id, is_occupied: true, is_active: true }
    });

    const availableRooms = totalRooms - occupiedRooms;

    // Pending requests
    const pendingLeaves = await Leave.count({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'Student',
          where: { hostel_id },
          attributes: []
        }
      ]
    });

    const pendingComplaints = await Complaint.count({
      where: { status: ['submitted', 'in_progress'] },
      include: [
        {
          model: User,
          as: 'Student',
          where: { hostel_id },
          attributes: []
        }
      ]
    });

    // Recent activities
    const recentLeaves = await Leave.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: [
        {
          model: User,
          as: 'Student',
          where: { hostel_id },
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const recentComplaints = await Complaint.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: [
        {
          model: User,
          as: 'Student',
          where: { hostel_id },
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        totalRooms,
        occupiedRooms,
        availableRooms,
        pendingLeaves,
        pendingComplaints,
        recentLeaves,
        recentComplaints
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSessions = async (req, res) => {
  try {
    const sessions = await Session.findAll({
      where: { is_active: true },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ATTENDANCE MANAGEMENT
const markAttendance = async (req, res) => {
  try {
    const { student_id, date, status, check_in_time, check_out_time, remarks } = req.body;
    const hostel_id = req.user.hostel_id;

    // Verify student belongs to this hostel
    const student = await User.findOne({
      where: { id: student_id, role: 'student', hostel_id, is_active: true }
    });

    if (!student) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student not found in this hostel' 
      });
    }

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      where: { student_id, date }
    });

    let attendance;
    if (existingAttendance) {
      // Update existing attendance
      await existingAttendance.update({
        status,
        check_in_time,
        check_out_time,
        remarks,
        marked_by: req.user.id
      });
      attendance = existingAttendance;
    } else {
      // Create new attendance record
      attendance = await Attendance.create({
        student_id,
        date,
        status,
        check_in_time,
        check_out_time,
        marked_by: req.user.id,
        remarks
      });
    }

    res.json({ 
      success: true, 
      data: attendance,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    console.error('Attendance marking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { date, student_id, from_date, to_date } = req.query;
    const hostel_id = req.user.hostel_id;

    let whereClause = {};
    
    if (date) whereClause.date = date;
    if (student_id) whereClause.student_id = student_id;
    if (from_date && to_date) {
      whereClause.date = {
        [Op.between]: [from_date, to_date]
      };
    }

    const attendance = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Student',
          where: { hostel_id },
          attributes: ['id', 'username']
        },
        {
          model: User,
          as: 'MarkedBy',
          attributes: ['id', 'username']
        }
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Attendance fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// LEAVE MANAGEMENT - UPDATED WITH PROPER FILTERS
const getLeaveRequests = async (req, res) => {
  try {
    const { status, from_date, to_date } = req.query;
    const hostel_id = req.user.hostel_id;

    let whereClause = {};
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    if (from_date && to_date) {
      whereClause.createdAt = {
        [Op.between]: [from_date, to_date]
      };
    }

    const leaveRequests = await Leave.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Student',
          where: { hostel_id },
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'ApprovedBy',
          attributes: ['id', 'username'],
          required: false
        }
      ],
      order: [
        ['status', 'ASC'], // pending first
        ['createdAt', 'DESC']
      ]
    });

    res.json({ success: true, data: leaveRequests });
  } catch (error) {
    console.error('Leave requests fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPendingLeaves = async (req, res) => {
  try {
    const hostel_id = req.user.hostel_id;

    const leaves = await Leave.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'Student',
          attributes: ['id', 'username', 'email', 'hostel_id'],
          where: { hostel_id }
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({ success: true, data: leaves });
  } catch (error) {
    console.error('Pending leaves fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const hostel_id = req.user.hostel_id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be approved or rejected' 
      });
    }

    const leave = await Leave.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'Student',
          where: { hostel_id }
        }
      ]
    });

    if (!leave) {
      return res.status(404).json({ 
        success: false, 
        message: 'Leave request not found' 
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Leave request has already been processed' 
      });
    }

    await leave.update({
      status,
      approved_by: req.user.id,
      approved_date: new Date(),
      remarks
    });

    const updatedLeave = await Leave.findByPk(id, {
      include: [
        {
          model: User,
          as: 'Student',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'ApprovedBy',
          attributes: ['id', 'username']
        }
      ]
    });

    res.json({ 
      success: true, 
      data: updatedLeave,
      message: `Leave request ${status} successfully` 
    });
  } catch (error) {
    console.error('Leave approval error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// COMPLAINT MANAGEMENT - UPDATED WITH PROPER FILTERS
const getComplaints = async (req, res) => {
  try {
    const { status, category, priority, from_date, to_date } = req.query;
    const hostel_id = req.user.hostel_id;

    let whereClause = {};
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }
    if (from_date && to_date) {
      whereClause.createdAt = {
        [Op.between]: [from_date, to_date]
      };
    }

    const complaints = await Complaint.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Student',
          where: { hostel_id },
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'AssignedTo',
          attributes: ['id', 'username'],
          required: false
        }
      ],
      order: [
        ['priority', 'DESC'], // urgent first
        ['createdAt', 'DESC']
      ]
    });

    res.json({ success: true, data: complaints });
  } catch (error) {
    console.error('Complaints fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPendingComplaints = async (req, res) => {
  try {
    const hostel_id = req.user.hostel_id;

    const complaints = await Complaint.findAll({
      where: { 
        status: ['submitted', 'in_progress']
      },
      include: [
        {
          model: User,
          as: 'Student',
          attributes: ['id', 'username', 'email', 'hostel_id'],
          where: { hostel_id }
        },
        {
          model: User,
          as: 'AssignedTo',
          attributes: ['id', 'username'],
          required: false
        }
      ],
      order: [
        ['priority', 'DESC'], // urgent first
        ['createdAt', 'ASC']
      ]
    });

    res.json({ success: true, data: complaints });
  } catch (error) {
    console.error('Pending complaints fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, assigned_to } = req.body;
    const hostel_id = req.user.hostel_id;

    const complaint = await Complaint.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'Student',
          where: { hostel_id }
        }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Complaint not found' 
      });
    }

    const updateData = { status };
    
    if (assigned_to) {
      updateData.assigned_to = assigned_to;
    }
    
    if (status === 'resolved' && resolution) {
      updateData.resolution = resolution;
      updateData.resolved_date = new Date();
    }

    await complaint.update(updateData);

    const updatedComplaint = await Complaint.findByPk(id, {
      include: [
        {
          model: User,
          as: 'Student',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'AssignedTo',
          attributes: ['id', 'username'],
          required: false
        }
      ]
    });

    res.json({ 
      success: true, 
      data: updatedComplaint,
      message: 'Complaint updated successfully' 
    });
  } catch (error) {
    console.error('Complaint update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// SUSPENSION MANAGEMENT
const createSuspension = async (req, res) => {
  try {
    const { student_id, reason, start_date, end_date, remarks } = req.body;
    const hostel_id = req.user.hostel_id;

    // Verify student belongs to this hostel
    const student = await User.findOne({
      where: { id: student_id, role: 'student', hostel_id, is_active: true }
    });

    if (!student) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student not found in this hostel' 
      });
    }

    const suspension = await Suspension.create({
      student_id,
      reason,
      start_date,
      end_date,
      issued_by: req.user.id,
      remarks
    });

    res.status(201).json({ 
      success: true, 
      data: suspension,
      message: 'Suspension created successfully'
    });
  } catch (error) {
    console.error('Suspension creation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSuspensions = async (req, res) => {
  try {
    const hostel_id = req.user.hostel_id;

    const suspensions = await Suspension.findAll({
      include: [
        {
          model: User,
          as: 'Student',
          where: { hostel_id },
          attributes: ['id', 'username']
        },
        {
          model: User,
          as: 'IssuedBy',
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: suspensions });
  } catch (error) {
    console.error('Suspensions fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateSuspension = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const hostel_id = req.user.hostel_id;

    const suspension = await Suspension.findOne({
      where: { id },
      include: [{
        model: User,
        as: 'Student',
        where: { hostel_id }
      }]
    });

    if (!suspension) {
      return res.status(404).json({ 
        success: false, 
        message: 'Suspension not found' 
      });
    }

    await suspension.update({
      status,
      remarks
    });

    res.json({ 
      success: true, 
      data: suspension,
      message: 'Suspension updated successfully'
    });
  } catch (error) {
    console.error('Suspension update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// HOLIDAY MANAGEMENT
const createHoliday = async (req, res) => {
  try {
    const { name, date, type, description } = req.body;
    const hostel_id = req.user.hostel_id;

    const holiday = await Holiday.create({
      hostel_id,
      name,
      date,
      type,
      description
    });

    res.status(201).json({ 
      success: true, 
      data: holiday,
      message: 'Holiday created successfully'
    });
  } catch (error) {
    console.error('Holiday creation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getHolidays = async (req, res) => {
  try {
    const hostel_id = req.user.hostel_id;

    const holidays = await Holiday.findAll({
      where: { hostel_id },
      order: [['date', 'ASC']]
    });

    res.json({ success: true, data: holidays });
  } catch (error) {
    console.error('Holidays fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, type, description } = req.body;
    const hostel_id = req.user.hostel_id;

    const holiday = await Holiday.findOne({
      where: { id, hostel_id }
    });

    if (!holiday) {
      return res.status(404).json({ 
        success: false, 
        message: 'Holiday not found' 
      });
    }

    await holiday.update({
      name,
      date,
      type,
      description
    });

    res.json({ 
      success: true, 
      data: holiday,
      message: 'Holiday updated successfully'
    });
  } catch (error) {
    console.error('Holiday update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const hostel_id = req.user.hostel_id;

    const holiday = await Holiday.findOne({
      where: { id, hostel_id }
    });

    if (!holiday) {
      return res.status(404).json({ 
        success: false, 
        message: 'Holiday not found' 
      });
    }

    await holiday.destroy();
    res.json({ 
      success: true, 
      message: 'Holiday deleted successfully' 
    });
  } catch (error) {
    console.error('Holiday deletion error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ADDITIONAL COLLECTIONS
const createAdditionalCollection = async (req, res) => {
  try {
    const { student_id, collection_type_id, amount, reason } = req.body;
    const hostel_id = req.user.hostel_id;

    // Verify student belongs to this hostel
    const student = await User.findOne({
      where: { id: student_id, role: 'student', hostel_id, is_active: true }
    });

    if (!student) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student not found in this hostel' 
      });
    }

    const collection = await AdditionalCollection.create({
      student_id,
      collection_type_id,
      amount,
      reason,
      collected_by: req.user.id
    });

    res.status(201).json({ 
      success: true, 
      data: collection,
      message: 'Additional collection created successfully'
    });
  } catch (error) {
    console.error('Additional collection creation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAdditionalCollections = async (req, res) => {
  try {
    const hostel_id = req.user.hostel_id;

    const collections = await AdditionalCollection.findAll({
      include: [
        {
          model: User,
          as: 'Student',
          where: { hostel_id },
          attributes: ['id', 'username']
        },
        {
          model: AdditionalCollectionType,
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'CollectedBy',
          attributes: ['id', 'username']
        }
      ],
      order: [['collection_date', 'DESC']]
    });

    res.json({ success: true, data: collections });
  } catch (error) {
    console.error('Additional collections fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  // Student Enrollment
  enrollStudent,
  getStudents,
  // Room Management
  getAvailableRooms,
  allotRoom,
  // Dashboard
  getDashboardStats,
  getSessions,
  // Attendance Management
  markAttendance,
  getAttendance,
  // Leave Management - Updated
  getLeaveRequests,
  getPendingLeaves,
  approveLeave,
  // Complaint Management - Updated
  getComplaints,
  getPendingComplaints,
  updateComplaint,
  // Suspension Management
  createSuspension,
  getSuspensions,
  updateSuspension,
  // Holiday Management
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
  // Additional Collections
  createAdditionalCollection,
  getAdditionalCollections
};
