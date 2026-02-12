const jwt = require('jsonwebtoken');
const Student = require('../src/models/Student');
const Admin = require('../src/models/Admin');
const Hostel = require('../src/models/Hostel');
const Room = require('../src/models/Room');
const Application = require('../src/models/Application');

/**
 * Generate JWT token for testing
 */
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only-12345678';
  return jwt.sign(payload, secret, {
    expiresIn: '7d',
  });
};

/**
 * Create a test student
 */
const createTestStudent = async (overrides = {}) => {
  const studentData = {
    name: 'Test Student',
    email: 'student@test.com',
    pnr: 'PNR12345',
    password: 'password123',
    gender: 'Male',
    year: '2nd',
    phone: '1234567890',
    ...overrides,
  };

  const student = await Student.create(studentData);
  const token = generateToken({ 
    id: student._id, 
    role: student.role, 
    type: 'student' 
  });

  return { student, token };
};

/**
 * Create a test admin
 */
const createTestAdmin = async (overrides = {}) => {
  const adminData = {
    name: 'Test Admin',
    email: 'admin@test.com',
    adminId: 'ADMIN001',
    password: 'password123',
    phone: '9876543210',
    role: 'admin',
    hostelIds: [],
    ...overrides,
  };

  const admin = await Admin.create(adminData);
  const token = generateToken({ 
    id: admin._id, 
    role: admin.role, 
    type: 'admin' 
  });

  return { admin, token };
};

/**
 * Create a test superadmin
 */
const createTestSuperAdmin = async (overrides = {}) => {
  const superAdminData = {
    name: 'Test SuperAdmin',
    email: 'superadmin@test.com',
    adminId: 'SUPERADMIN001',
    password: 'password123',
    phone: '9876543210',
    role: 'superadmin',
    hostelIds: [],
    ...overrides,
  };

  const superadmin = await Admin.create(superAdminData);
  const token = generateToken({ 
    id: superadmin._id, 
    role: superadmin.role, 
    type: 'admin' 
  });

  return { admin: superadmin, token };
};

/**
 * Create a test hostel
 */
const createTestHostel = async (adminId, overrides = {}) => {
  const hostelData = {
    name: 'Test Hostel',
    location: 'Test Location',
    totalFloors: 3,
    capacity: 100,
    availableRooms: 25,
    occupiedBeds: 0,
    availableBeds: 100,
    amenities: ['WiFi', 'Mess'],
    contactNumber: '1234567890',
    gender: 'Male',
    adminId,
    ...overrides,
  };

  const hostel = await Hostel.create(hostelData);
  return hostel;
};

/**
 * Create a test room
 */
const createTestRoom = async (hostelId, overrides = {}) => {
  const roomData = {
    roomNumber: '101',
    floor: '1',
    capacity: 4,
    occupiedSpaces: 0,
    hostelId,
    status: 'empty',
    assignedStudents: [],
    ...overrides,
  };

  const room = await Room.create(roomData);
  return room;
};

/**
 * Create a test application
 */
const createTestApplication = async (studentId, hostelId, overrides = {}) => {
  const applicationData = {
    studentId,
    hostelId,
    studentName: 'Test Student',
    studentEmail: 'student@test.com',
    studentPnr: 'PNR12345',
    studentPNR: 'PNR12345',
    studentGender: 'Male',
    studentYear: '2nd',
    studentPhone: '1234567890',
    branch: 'Computer Science',
    caste: 'General',
    dateOfBirth: '2000-01-01',
    aadharCard: 'documents/aadhar.pdf',
    admissionReceipt: 'documents/receipt.pdf',
    status: 'PENDING',
    appliedOn: new Date(),
    ...overrides,
  };

  const application = await Application.create(applicationData);
  return application;
};

/**
 * Clear all collections
 */
const clearDatabase = async () => {
  const collections = ['students', 'admins', 'hostels', 'rooms', 'applications'];
  
  for (const collection of collections) {
    await mongoose.connection.collection(collection).deleteMany({});
  }
};

module.exports = {
  generateToken,
  createTestStudent,
  createTestAdmin,
  createTestSuperAdmin,
  createTestHostel,
  createTestRoom,
  createTestApplication,
  clearDatabase,
};
