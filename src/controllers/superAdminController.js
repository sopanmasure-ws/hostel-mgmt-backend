const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Application = require('../models/Application');
const overview = async (req, res) => {
    try {
        const [admins, students, hostels, rooms, applications] = await Promise.all([
            Admin.countDocuments({}),
            Student.countDocuments({}),
            Hostel.countDocuments({}),
            Room.countDocuments({}),
            Application.countDocuments({}),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                counts: { admins, students, hostels, rooms, applications },
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const dashboardData = async (req, res) => {
    try {
        const [admins, students, hostels] = await Promise.all([
            Admin.find({}).sort({ createdAt: -1 }).populate('hostelIds'),
            Student.find({}).sort({ createdAt: -1 }),
            Hostel.find({}).sort({ createdAt: -1 }).populate('adminId', 'name email adminId phone role isActive'),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totals: {
                    admins: admins.length,
                    students: students.length,
                    hostels: hostels.length,
                },
                admins,
                students,
                hostels,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const createSuperAdmin = async (req, res) => {
    try {
        const { name, email, adminId, password, confirmPassword, phone, passKey } = req.body;

        if (!name || !email || !adminId || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }
        if (passKey.toUpperCase() !== "ONLYFORSUPERADMINCREATION") {
            return res.status(401).json({ success: false, message: 'Invalid Passkey' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        const existing = await Admin.findOne({ $or: [{ email }, { adminId }] });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email or Admin ID already exists' });
        }

        const admin = await Admin.create({
            name,
            email,
            adminId,
            password,
            phone: phone || '',
            hostelIds: [],
            role: 'superadmin',
        });

        return res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: { admin: admin.toJSON() },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const createAdmin = async (req, res) => {
    try {
        const { name, email, adminId, password, confirmPassword, phone } = req.body;

        if (!name || !email || !adminId || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        const existing = await Admin.findOne({ $or: [{ email }, { adminId }] });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email or Admin ID already exists' });
        }

        const admin = await Admin.create({
            name,
            email,
            adminId,
            password,
            phone: phone || '',
            hostelIds: [],
            role: 'admin',
        });

        return res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: { admin: admin.toJSON() },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const listAdmins = async (req, res) => {
    try {
        const { q } = req.query;

        const query = {};
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { adminId: { $regex: q, $options: 'i' } },
            ];
        }

        const admins = await Admin.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: {
                total: admins.length,
                admins,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAdminDetails = async (req, res) => {
    try {
        const { adminId } = req.params;

        const admin = await Admin.findOne({ adminId }).populate('hostelIds');
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const hostels = await Hostel.find({ adminId: admin._id }).sort({ createdAt: -1 });
        const applicationsCount = await Application.countDocuments({ hostelId: { $in: hostels.map((h) => h._id) } });

        return res.status(200).json({
            success: true,
            data: {
                admin,
                hostels,
                stats: {
                    hostels: hostels.length,
                    applications: applicationsCount,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const disableAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;

        const admin = await Admin.findOne({ adminId });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        if (admin.role === 'superadmin') {
            return res.status(400).json({ success: false, message: 'Cannot disable a superadmin' });
        }

        admin.isActive = false;
        await admin.save();

        return res.status(200).json({
            success: true,
            message: 'Admin disabled successfully',
            data: { admin: admin.toJSON() },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const enableAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;

        const admin = await Admin.findOne({ adminId });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        admin.isActive = true;
        await admin.save();

        return res.status(200).json({
            success: true,
            message: 'Admin enabled successfully',
            data: { admin: admin.toJSON() },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const listStudents = async (req, res) => {
    try {
        const { q } = req.query;

        const query = {};
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { pnr: { $regex: q, $options: 'i' } },
            ];
        }

        const students = await Student.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: { total: students.length, students },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getStudentDetails = async (req, res) => {
    try {
        const { pnr } = req.params;

        const student = await Student.findOne({ pnr });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const application = await Application.findOne({ studentId: student._id }).populate('hostelId');

        return res.status(200).json({
            success: true,
            data: {
                student,
                application: application || null,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;

        const admin = await Admin.findOne({ adminId });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        if (admin.role === 'superadmin') {
            return res.status(400).json({ success: false, message: 'Cannot delete a superadmin' });
        }

        // Check if admin has any hostels
        const hostelsCount = await Hostel.countDocuments({ adminId: admin._id });
        if (hostelsCount > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot delete admin with ${hostelsCount} assigned hostel(s). Please reassign hostels first.` 
            });
        }

        await Admin.deleteOne({ _id: admin._id });

        return res.status(200).json({
            success: true,
            message: 'Admin deleted successfully',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const assignRoomToStudent = async (req, res) => {
    try {
        const { pnr } = req.params;
        const { hostelId, roomId } = req.body;

        if (!hostelId || !roomId) {
            return res.status(400).json({ success: false, message: 'Please provide hostelId and roomId' });
        }

        const student = await Student.findOne({ pnr });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        if (student.isBlacklisted) {
            return res.status(400).json({ success: false, message: 'Cannot assign room to blacklisted student' });
        }

        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            return res.status(404).json({ success: false, message: 'Hostel not found' });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        if (room.hostelId.toString() !== hostelId) {
            return res.status(400).json({ success: false, message: 'Room does not belong to this hostel' });
        }

        if (room.occupiedSpaces >= room.capacity) {
            return res.status(400).json({ success: false, message: 'Room is full' });
        }

        // Update room
        room.assignedStudents.push(student._id);
        room.occupiedSpaces += 1;
        if (room.occupiedSpaces >= room.capacity) {
            room.status = 'filled';
        }
        await room.save();

        // Update student
        student.assignedRoom = room._id;
        await student.save();

        // Update application if exists
        const application = await Application.findOne({ studentId: student._id });
        if (application) {
            application.status = 'APPROVED';
            application.roomNumber = room.roomNumber;
            application.floor = room.floor;
            application.approvedOn = new Date();
            await application.save();
        }

        // Update hostel available rooms
        const filledRooms = await Room.countDocuments({ hostelId: hostel._id, status: 'filled' });
        const totalRooms = await Room.countDocuments({ hostelId: hostel._id });
        hostel.availableRooms = totalRooms - filledRooms;
        await hostel.save();

        return res.status(200).json({
            success: true,
            message: 'Room assigned successfully',
            data: { student, room },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const rejectStudentApplication = async (req, res) => {
    try {
        const { pnr } = req.params;
        const { reason } = req.body;

        const student = await Student.findOne({ pnr });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const application = await Application.findOne({ studentId: student._id });
        if (!application) {
            return res.status(404).json({ success: false, message: 'No application found for this student' });
        }

        if (application.status === 'APPROVED') {
            return res.status(400).json({ success: false, message: 'Cannot reject an approved application' });
        }

        application.status = 'REJECTED';
        application.rejectionReason = reason || 'Rejected by superadmin';
        await application.save();

        return res.status(200).json({
            success: true,
            message: 'Application rejected successfully',
            data: { application },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const blacklistStudent = async (req, res) => {
    try {
        const { pnr } = req.params;

        const student = await Student.findOne({ pnr });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        student.isBlacklisted = true;
        await student.save();

        return res.status(200).json({
            success: true,
            message: 'Student blacklisted successfully',
            data: { student },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const unblacklistStudent = async (req, res) => {
    try {
        const { pnr } = req.params;

        const student = await Student.findOne({ pnr });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        student.isBlacklisted = false;
        await student.save();

        return res.status(200).json({
            success: true,
            message: 'Student removed from blacklist successfully',
            data: { student },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const listHostels = async (req, res) => {
    try {
        const { q } = req.query;

        const query = {};
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { location: { $regex: q, $options: 'i' } },
                { warden: { $regex: q, $options: 'i' } },
            ];
        }

        const hostels = await Hostel.find(query)
            .sort({ createdAt: -1 })
            .populate('adminId', 'name email adminId phone');

        return res.status(200).json({
            success: true,
            data: {
                total: hostels.length,
                hostels,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getHostelDetails = async (req, res) => {
    try {
        const { hostelId } = req.params;

        const hostel = await Hostel.findById(hostelId).populate('adminId', 'name email adminId phone');
        if (!hostel) {
            return res.status(404).json({ success: false, message: 'Hostel not found' });
        }

        const rooms = await Room.find({ hostelId: hostel._id }).populate('assignedStudents', 'name pnr email');
        const applications = await Application.countDocuments({ hostelId: hostel._id });
        const occupiedStudents = await Room.aggregate([
            { $match: { hostelId: hostel._id } },
            { $group: { _id: null, total: { $sum: '$occupiedSpaces' } } },
        ]);

        return res.status(200).json({
            success: true,
            data: {
                hostel,
                rooms,
                stats: {
                    totalRooms: rooms.length,
                    occupiedStudents: occupiedStudents[0]?.total || 0,
                    applications,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const createHostel = async (req, res) => {
    try {
        const {
            name,
            description,
            location,
            warden,
            wardenPhone,
            capacity,
            gender,
            rentPerMonth,
            adminId,
            amenities,
            rules,
        } = req.body;

        if (!name || !location || !capacity || !gender || !adminId) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const admin = await Admin.findOne({ adminId });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const existingHostel = await Hostel.findOne({ name });
        if (existingHostel) {
            return res.status(400).json({ success: false, message: 'Hostel with this name already exists' });
        }

        const hostel = await Hostel.create({
            name,
            description: description || '',
            location,
            warden: warden || '',
            wardenPhone: wardenPhone || '',
            capacity,
            availableRooms: 0,
            gender,
            rentPerMonth: rentPerMonth || 0,
            adminId: admin._id,
            amenities: amenities || [],
            rules: rules || [],
        });

        // Add hostel to admin's hostelIds
        admin.hostelIds.push(hostel._id);
        await admin.save();

        return res.status(201).json({
            success: true,
            message: 'Hostel created successfully',
            data: { hostel },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateHostel = async (req, res) => {
    try {
        const { hostelId } = req.params;
        const updates = req.body;

        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            return res.status(404).json({ success: false, message: 'Hostel not found' });
        }

        // Prevent updating adminId through this route
        delete updates.adminId;

        Object.keys(updates).forEach((key) => {
            hostel[key] = updates[key];
        });

        await hostel.save();

        return res.status(200).json({
            success: true,
            message: 'Hostel updated successfully',
            data: { hostel },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteHostel = async (req, res) => {
    try {
        const { hostelId } = req.params;

        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            return res.status(404).json({ success: false, message: 'Hostel not found' });
        }

        // Check if hostel has any rooms with students
        const occupiedRooms = await Room.countDocuments({ 
            hostelId: hostel._id, 
            occupiedSpaces: { $gt: 0 } 
        });

        if (occupiedRooms > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete hostel with occupied rooms. Please reassign students first.' 
            });
        }

        // Delete all rooms
        await Room.deleteMany({ hostelId: hostel._id });

        // Delete all applications
        await Application.deleteMany({ hostelId: hostel._id });

        // Remove from admin's hostelIds
        await Admin.updateOne(
            { _id: hostel.adminId },
            { $pull: { hostelIds: hostel._id } }
        );

        await Hostel.deleteOne({ _id: hostel._id });

        return res.status(200).json({
            success: true,
            message: 'Hostel deleted successfully',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const disableHostel = async (req, res) => {
    try {
        const { hostelId } = req.params;

        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            return res.status(404).json({ success: false, message: 'Hostel not found' });
        }

        hostel.isActive = false;
        await hostel.save();

        return res.status(200).json({
            success: true,
            message: 'Hostel disabled successfully',
            data: { hostel },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const enableHostel = async (req, res) => {
    try {
        const { hostelId } = req.params;

        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            return res.status(404).json({ success: false, message: 'Hostel not found' });
        }

        hostel.isActive = true;
        await hostel.save();

        return res.status(200).json({
            success: true,
            message: 'Hostel enabled successfully',
            data: { hostel },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const changeHostelAdmin = async (req, res) => {
    try {
        const { hostelId } = req.params;
        const { adminId } = req.body;

        if (!adminId) {
            return res.status(400).json({ success: false, message: 'Please provide adminId' });
        }

        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            return res.status(404).json({ success: false, message: 'Hostel not found' });
        }

        const newAdmin = await Admin.findOne({ adminId: adminId });
        if (!newAdmin) {
            return res.status(404).json({ success: false, message: 'New admin not found' });
        }

        if (newAdmin.role !== 'admin') {
            return res.status(400).json({ success: false, message: 'Target must be an admin' });
        }

        const oldAdminId = hostel.adminId;

        // Remove from old admin's hostelIds
        await Admin.updateOne(
            { _id: oldAdminId },
            { $pull: { hostelIds: hostel._id } }
        );

        // Add to new admin's hostelIds
        if (!newAdmin.hostelIds.includes(hostel._id)) {
            newAdmin.hostelIds.push(hostel._id);
            await newAdmin.save();
        }

        // Update hostel
        hostel.adminId = newAdmin._id;
        await hostel.save();

        return res.status(200).json({
            success: true,
            message: 'Hostel admin changed successfully',
            data: { hostel },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const changeRoomStatus = async (req, res) => {
    try {
        const { hostelId, roomId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Please provide status' });
        }

        const validStatuses = ['empty', 'filled', 'damaged', 'maintenance'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
            });
        }

        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            return res.status(404).json({ success: false, message: 'Hostel not found' });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        if (room.hostelId.toString() !== hostelId) {
            return res.status(400).json({ success: false, message: 'Room does not belong to this hostel' });
        }

        // Validate status change
        if (status === 'filled' && room.occupiedSpaces < room.capacity) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot mark room as filled when not at capacity' 
            });
        }

        room.status = status;
        await room.save();

        // Update hostel available rooms count
        const filledRooms = await Room.countDocuments({ hostelId: hostel._id, status: 'filled' });
        const totalRooms = await Room.countDocuments({ hostelId: hostel._id });
        hostel.availableRooms = totalRooms - filledRooms;
        await hostel.save();

        return res.status(200).json({
            success: true,
            message: 'Room status updated successfully',
            data: { room },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = {
    overview,
    createAdmin,
    listAdmins,
    getAdminDetails,
    disableAdmin,
    enableAdmin,
    deleteAdmin,
    listStudents,
    getStudentDetails,
    assignRoomToStudent,
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
    dashboardData,
};