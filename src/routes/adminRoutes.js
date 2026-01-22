const express = require('express');
const {
  register,
  login,
  getAdminHostels,
  getHostelApplications,
  acceptApplication,
  rejectApplication,
  getHostelInventory,
  getHostelRooms,
  updateRoomStatus,
} = require('../controllers/adminController');

const router = express.Router();

// Admin Auth Routes
router.post('/register', register);
router.post('/login', login);

// Hostel Routes
router.get('/:adminId/hostels', getAdminHostels);

// Application Routes
router.get('/hostels/:hostelId/applications', getHostelApplications);
router.put('/applications/:applicationId/accept', acceptApplication);
router.put('/applications/:applicationId/reject', rejectApplication);

// Inventory Routes
router.get('/hostels/:hostelId/inventory', getHostelInventory);
router.get('/hostels/:hostelId/rooms', getHostelRooms);
router.put('/rooms/:roomId/update-status', updateRoomStatus);

module.exports = router;
