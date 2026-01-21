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
  upload.fields([
    { name: 'aadharCard', maxCount: 1 },
    { name: 'admissionReceipt', maxCount: 1 },
  ]),
  createApplication
);
router.get('/my-applications', getMyApplications);

// Admin routes
router.get('/', getAllApplications);
router.get('/:id', getApplicationById);
router.put('/:id', updateApplicationStatus);
router.delete('/:id', deleteApplication);
router.get('/hostel/:hostelId', getApplicationsByHostel);
module.exports = router;
