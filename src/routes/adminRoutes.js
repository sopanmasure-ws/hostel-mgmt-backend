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
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Admin Auth Routes
router.post('/login', login);
// Only superadmin can create admins via this endpoint (preferred: POST /api/superadmin/admins)
router.post('/register', protect, authorize('superadmin'), register);

// All routes below require admin/superadmin token
router.use(protect, authorize('admin', 'superadmin'));

// Hostel Routes
router.get('/:adminId/hostels', getAdminHostels);

// Application Routes
router.get('/hostels/:hostelId/applications', getHostelApplications);
router.put('/applications/:applicationId/APPROVED', acceptApplication);
router.put('/applications/:applicationId/REJECTED', rejectApplication);

// Inventory Routes
router.get('/hostels/:hostelId/inventory', getHostelInventory);
router.get('/hostels/:hostelId/rooms', getHostelRooms);
router.put('/rooms/:roomId/update-status', updateRoomStatus);

module.exports = router;
