const Application = require("../models/Application");
const Student = require("../models/Student");
const Hostel = require("../models/Hostel");

// @route   POST /api/applications
// @desc    Submit hostel application
// @access  Private
const createApplication = async (req, res) => {
  try {
    const {
      hostelId,
      branch,
      caste,
      dateOfBirth,
      aadharCard,
      admissionReceipt,
      studentPNR,
    } = req.body;

    if (
      !hostelId ||
      !branch ||
      !caste ||
      !dateOfBirth ||
      !aadharCard ||
      !admissionReceipt
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields- branch, caste, dateOfBirth, hostelId, aadharCard, admissionReceipt",
      });
    }

    const studentDetails = await Student.findOne({ pnr: studentPNR }).lean();
    if (!studentDetails) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check if student already has an application
    const existingApp = await Application.findOne({ studentPNR: studentPNR });
    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: "You can only apply for one hostel",
      });
    }

    // Check if hostel exists
    const hostel = await Hostel.findById({ _id: hostelId });
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found",
      });
    }

    const application = await Application.create({
      studentId: studentDetails._id,
      hostelId,
      studentName: studentDetails.name,
      studentPNR: studentPNR,
      studentYear: studentDetails.year,
      branch,
      caste,
      dateOfBirth,
      aadharCard: aadharCard,
      admissionReceipt: admissionReceipt,
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/applications/my-applications
// @desc    Get applications for current student
// @access  Private
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.findOne({ studentId: req.user._id })
      .populate("hostelId")
      .populate("studentId");

    if (!applications) {
      return res.status(200).json({
        success: true,
        message: "No applications found",
        application: null,
      });
    }

    return res.status(200).json({
      success: true,
      application: applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/applications
// @desc    Get all applications (Admin only)
// @access  Private
const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("hostelId")
      .populate("studentId")
      .sort({ appliedOn: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/applications/:id
// @desc    Get application by ID
// @access  Private
const getApplicationById = async (req, res) => {
  try {
    const application = await Application.find({ studentPNR: req.params.id })
      .populate("hostelId")
      .populate("studentId");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   PUT /api/applications/:id
// @desc    Update application status (Admin only)
// @access  Private
const updateApplicationStatus = async (req, res) => {
  try {
    const { status, roomNumber, floor, rejectionReason } = req.body;

    if (
      !status ||
      !["Pending", "Approved", "Rejected", "Cancelled"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    let application = await Application.findByIdAndUpdate(
      req.params.id,
      {
        status,
        roomNumber: roomNumber || "",
        floor: floor || "",
        rejectionReason: rejectionReason || "",
        approvedOn: status === "Approved" ? new Date() : null,
      },
      { new: true, runValidators: true },
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   DELETE /api/applications/:id
// @desc    Delete/Cancel application
// @access  Private
const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if student owns this application
    if (
      application.studentId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this application",
      });
    }

    await Application.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/applications/hostel/:hostelId
// @desc    Get applications for a specific hostel (Admin only)
// @access  Private
const getApplicationsByHostel = async (req, res) => {
  try {
    const applications = await Application.find({
      hostelId: req.params.hostelId,
    })
      .populate("studentId")
      .sort({ appliedOn: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  getApplicationsByHostel,
};
