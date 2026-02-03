const express = require('express');
const upload = require('../middleware/upload');
const {
  createApplication,
  getMyApplications,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  getApplicationsByHostel,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Student routes
router.post(
  '/',
  protect,
  authorize('student'),
  upload.fields([
    { name: 'aadharCard', maxCount: 1 },
    { name: 'admissionReceipt', maxCount: 1 },
  ]),
  createApplication
);
router.get('/my-applications', protect, authorize('student'), getMyApplications);

// Admin routes
router.get('/hostel/:hostelId', protect, authorize('admin', 'superadmin'), getApplicationsByHostel);
router.get('/', protect, authorize('admin', 'superadmin'), getAllApplications);
router.get('/:id', protect, authorize('student', 'admin', 'superadmin'), getApplicationById);
router.put('/:id', protect, authorize('admin', 'superadmin'), updateApplicationStatus);
// Allow students to cancel their own application; allow admin/superadmin as well
router.delete('/:id', protect, authorize('student', 'admin', 'superadmin'), deleteApplication);
module.exports = router;
