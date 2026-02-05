require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./src/models/Student');
const Application = require('./src/models/Application');
const Hostel = require('./src/models/Hostel');
const Room = require('./src/models/Room');

/**
 * Normalize application status to standard format
 */
const normalizeStatus = (status) => {
  if (!status) return 'NOT_APPLIED';
  const normalized = status.toUpperCase().replace(/\s+/g, '_');
  if (normalized === 'APPROVED') return 'APPROVED';
  if (normalized === 'PENDING') return 'PENDING';
  if (normalized === 'REJECTED') return 'REJECTED';
  if (normalized === 'CANCELLED') return 'CANCELLED';
  return 'NOT_APPLIED';
};

/**
 * Script to update applicationStatus for ALL students
 * - Finds all students in database
 * - For each student, checks if they have an application
 * - Sets applicationStatus based on application status or "not applied"
 */
const updateStudentRoomData = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to database\n');

    // Find ALL students
    const allStudents = await Student.find({});

    console.log(`Found ${allStudents.length} students in database\n`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const student of allStudents) {
      try {
        // Check if student has an application
        const existingApplication = await Application.findOne({ studentId: student._id });

        if (existingApplication) {
          // Student has an application - normalize and set status
          const normalizedStatus = normalizeStatus(existingApplication.status);
          student.applicationStatus = normalizedStatus;
        } else {
          // No application - set to "NOT_APPLIED"
          student.applicationStatus = 'NOT_APPLIED';
        }
        
        await student.save();
        
        console.log(
          `✓ Updated student ${student.pnr} (${student.name}) - Application Status: [${student.applicationStatus}]`
        );
        updatedCount++;
      } catch (err) {
        console.error(`✗ Error processing student ${student.pnr}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('Application Status Update Summary:');
    console.log(`  Total students: ${allStudents.length}`);
    console.log(`  Successfully updated: ${updatedCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log('='.repeat(80));

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Script failed:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
updateStudentRoomData();
