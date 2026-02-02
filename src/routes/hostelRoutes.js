const express = require('express');
const {
  getAllHostels,
  getHostelById,
  createHostel,
  updateHostel,
  deleteHostel,
} = require('../controllers/hostelController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All hostel APIs require auth
router.get('/', protect, authorize('student', 'admin', 'superadmin'), getAllHostels);
router.get('/:id', protect, authorize('student', 'admin', 'superadmin'), getHostelById);

// Super admin hostel management
router.post('/', protect, authorize('superadmin'), createHostel);
router.put('/:id', protect, authorize('superadmin'), updateHostel);
router.delete('/:id', protect, authorize('superadmin'), deleteHostel);

module.exports = router;
