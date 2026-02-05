const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
    overview,
    dashboardData,
    detailedDashboard,
    createAdmin,
    listAdmins,
    getAdminDetails,
    disableAdmin,
    enableAdmin,
    deleteAdmin,
    listStudents,
    getStudentDetails,
    assignRoomToStudent,
    changeStudentRoom,
    removeStudentFromRoom,
    reassignStudentRoom,
    rejectStudentApplication,
    blacklistStudent,
    unblacklistStudent,
    listHostels,
    getHostelDetails,
    createHostel,
    updateHostel,
    deleteHostel,
    disableHostel,
    enableHostel,
    changeHostelAdmin,
    changeRoomStatus,
    createSuperAdmin,
} = require('../controllers/superAdminController');

const router = express.Router();
router.post('/superadmins', createSuperAdmin);

// All superadmin routes require a valid token + superadmin role
router.use(protect, authorize('superadmin'));

// Dashboard/overview
router.get('/dashboard/overview', overview);
router.get('/dashboard/data', dashboardData);
router.get('/dashboard/detailed', detailedDashboard);

// Admin management
router.post('/admins', createAdmin);
router.get('/admins', listAdmins);
router.get('/admins/:adminId', getAdminDetails);
router.delete('/admins/:adminId', deleteAdmin);
router.patch('/admins/:adminId/disable', disableAdmin);
router.patch('/admins/:adminId/enable', enableAdmin);

// Student management
router.get('/students', listStudents);
router.get('/students/:pnr', getStudentDetails);
router.put('/students/:pnr/assign-room', assignRoomToStudent);
router.put('/students/:pnr/change-room', changeStudentRoom);
router.put('/students/:pnr/removeStudentFromRoom', removeStudentFromRoom);
router.put('/students/:pnr/reassign-room', reassignStudentRoom);
router.put('/students/:pnr/reject-application', rejectStudentApplication);
router.put('/students/:pnr/blacklist', blacklistStudent);
router.put('/students/:pnr/unblacklist', unblacklistStudent);

// Hostel management
router.get('/hostels', listHostels);
router.get('/hostels/:hostelId', getHostelDetails);
router.post('/hostels', createHostel);
router.put('/hostels/:hostelId', updateHostel);
router.delete('/hostels/:hostelId', deleteHostel);
router.patch('/hostels/:hostelId/disable', disableHostel);
router.patch('/hostels/:hostelId/enable', enableHostel);
router.put('/hostels/:hostelId/change-admin', changeHostelAdmin);
router.put('/hostels/:hostelId/rooms/:roomId/change-status', changeRoomStatus);

module.exports = router;