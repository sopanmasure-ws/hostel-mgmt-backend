const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  overview,
  createAdmin,
  listAdmins,
  getAdminDetails,
  disableAdmin,
  enableAdmin,
  listStudents,
  getStudentDetails,
} = require('../controllers/superAdminController');

const router = express.Router();

// All superadmin routes require a valid token + superadmin role
router.use(protect, authorize('superadmin'));

// Dashboard/overview
router.get('/dashboard/overview', overview);

// Admin management + admin dashboard
router.post('/admins', createAdmin);
router.get('/admins', listAdmins);
router.get('/admins/:adminId', getAdminDetails);
router.patch('/admins/:adminId/disable', disableAdmin);
router.patch('/admins/:adminId/enable', enableAdmin);

// Student dashboard
router.get('/students', listStudents);
router.get('/students/:pnr', getStudentDetails);

module.exports = router;

