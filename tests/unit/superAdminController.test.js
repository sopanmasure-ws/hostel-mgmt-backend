const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const superAdminRoutes = require('../../src/routes/superAdminRoutes');
const { createTestSuperAdmin, createTestAdmin, createTestStudent, createTestHostel, createTestRoom } = require('../helpers');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/superadmin', superAdminRoutes);

describe('SuperAdmin Controller Tests', () => {
  describe('GET /api/superadmin/overview', () => {
    it('should get system overview statistics', async () => {
      const { admin, token } = await createTestSuperAdmin();

      // Create some test data
      await createTestAdmin({ adminId: 'ADMIN001', email: 'admin1@test.com' });
      await createTestStudent({ pnr: 'PNR001', email: 'student1@test.com' });

      const response = await request(app)
        .get('/api/superadmin/overview')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.counts).toBeDefined();
      expect(response.body.data.counts.admins).toBeGreaterThanOrEqual(1);
      expect(response.body.data.counts.students).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/superadmin/dashboard', () => {
    it('should get comprehensive dashboard data', async () => {
      const { admin, token } = await createTestSuperAdmin();

      const response = await request(app)
        .get('/api/superadmin/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totals).toBeDefined();
      expect(response.body.data.admins).toBeDefined();
      expect(response.body.data.students).toBeDefined();
      expect(response.body.data.hostels).toBeDefined();
    });

    it('should cache dashboard data', async () => {
      const { admin, token } = await createTestSuperAdmin();

      // First request
      const response1 = await request(app)
        .get('/api/superadmin/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Second request should be cached
      const response2 = await request(app)
        .get('/api/superadmin/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Both should succeed
      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
    });
  });

  describe('POST /api/superadmin/admins', () => {
    it('should create a new admin', async () => {
      const { admin, token } = await createTestSuperAdmin();

      const newAdminData = {
        name: 'New Admin',
        email: 'newadmin@test.com',
        adminId: 'NEWADMIN001',
        password: 'password123',
        confirmPassword: 'password123',
        phone: '1234567890',
      };

      const response = await request(app)
        .post('/api/superadmin/admins')
        .set('Authorization', `Bearer ${token}`)
        .send(newAdminData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin created successfully');
      expect(response.body.data.admin.email).toBe(newAdminData.email);
    });

    it('should fail with invalid passkey for superadmin creation', async () => {
      const response = await request(app)
        .post('/api/superadmin/superadmins')
        .send({
          name: 'Test SuperAdmin',
          email: 'testsuperadmin@test.com',
          adminId: 'TESTSUPERADMIN',
          password: 'password123',
          confirmPassword: 'password123',
          passKey: 'wrongkey',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid Passkey');
    });
  });

  describe('GET /api/superadmin/admins', () => {
    it('should get all admins', async () => {
      const { admin, token } = await createTestSuperAdmin();
      await createTestAdmin({ adminId: 'ADMIN002', email: 'admin2@test.com' });
      await createTestAdmin({ adminId: 'ADMIN003', email: 'admin3@test.com' });

      const response = await request(app)
        .get('/api/superadmin/admins')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.admins)).toBe(true);
      expect(response.body.data.admins.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/superadmin/students', () => {
    it('should get all students', async () => {
      const { admin, token } = await createTestSuperAdmin();
      await createTestStudent({ pnr: 'PNR101', email: 'student101@test.com' });
      await createTestStudent({ pnr: 'PNR102', email: 'student102@test.com' });

      const response = await request(app)
        .get('/api/superadmin/students')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.students)).toBe(true);
      expect(response.body.data.students.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PUT /api/superadmin/students/:id/blacklist', () => {
    it('should blacklist a student', async () => {
      const { admin, token } = await createTestSuperAdmin();
      const { student } = await createTestStudent();

      const response = await request(app)
        .put(`/api/superadmin/students/${student.pnr}/blacklist`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          isBlacklisted: true,
          remarks: 'Test blacklist',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('blacklist');
    });
  });

  describe('DELETE /api/superadmin/admins/:id', () => {
    it('should delete an admin', async () => {
      const { admin: superAdmin, token } = await createTestSuperAdmin();
      const { admin } = await createTestAdmin({ adminId: 'DELETEME', email: 'delete@test.com' });

      const response = await request(app)
        .delete(`/api/superadmin/admins/${admin.adminId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin deleted successfully');
    });
  });

  describe('GET /api/superadmin/dashboard/detailed', () => {
    it('should get detailed dashboard data with caching', async () => {
      const { admin, token } = await createTestSuperAdmin();
      await createTestAdmin({ adminId: 'ADMIN001', email: 'admin1@test.com' });
      await createTestStudent({ pnr: 'PNR001', email: 'student1@test.com' });

      const response = await request(app)
        .get('/api/superadmin/dashboard/detailed')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalStudentsCount).toBeGreaterThanOrEqual(1);
      expect(response.body.data.totalAdminsCount).toBeGreaterThanOrEqual(1);
      expect(response.body.data.totalHostelsCount).toBeDefined();
    });

    it('should return cached data if available', async () => {
      const { admin, token } = await createTestSuperAdmin();

      // First request - should cache
      const response1 = await request(app)
        .get('/api/superadmin/dashboard/detailed')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Second request - should hit cache
      const response2 = await request(app)
        .get('/api/superadmin/dashboard/detailed')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response2.body.cached).toBe(true);
      expect(response2.body.cacheAge).toBeDefined();
    });
  });

  describe('GET /api/superadmin/admins/:adminId', () => {
    it('should get admin details', async () => {
      const { admin: superAdmin, token } = await createTestSuperAdmin();
      const { admin } = await createTestAdmin({ adminId: 'ADMIN001', email: 'admin1@test.com' });

      const response = await request(app)
        .get(`/api/superadmin/admins/${admin.adminId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.admin).toBeDefined();
      expect(response.body.data.admin.adminId).toBe('ADMIN001');
    });

    it('should fail if admin not found', async () => {
      const { admin, token } = await createTestSuperAdmin();

      const response = await request(app)
        .get(`/api/superadmin/admins/NONEXISTENT`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin not found');
    });
  });

  describe('PATCH /api/superadmin/admins/:adminId/disable', () => {
    it('should disable an admin', async () => {
      const { admin: superAdmin, token } = await createTestSuperAdmin();
      const { admin } = await createTestAdmin({ adminId: 'ADMIN001', email: 'admin1@test.com' });

      const response = await request(app)
        .patch(`/api/superadmin/admins/${admin.adminId}/disable`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.admin.isActive).toBe(false);
    });

    it('should fail if admin not found', async () => {
      const { admin, token } = await createTestSuperAdmin();

      const response = await request(app)
        .patch(`/api/superadmin/admins/NONEXISTENT/disable`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/superadmin/admins/:adminId/enable', () => {
    it('should enable a disabled admin', async () => {
      const { admin: superAdmin, token } = await createTestSuperAdmin();
      const { admin } = await createTestAdmin({
        adminId: 'ADMIN001',
        email: 'admin1@test.com',
        isActive: false,
      });

      const response = await request(app)
        .patch(`/api/superadmin/admins/${admin.adminId}/enable`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.admin.isActive).toBe(true);
    });
  });

  describe('GET /api/superadmin/students/:pnr', () => {
    it('should get student details by PNR', async () => {
      const { admin, token } = await createTestSuperAdmin();
      const { student } = await createTestStudent({ pnr: 'PNR001', email: 'student1@test.com' });

      const response = await request(app)
        .get(`/api/superadmin/students/${student.pnr}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.student).toBeDefined();
      expect(response.body.data.student.pnr).toBe('PNR001');
    });

    it('should fail if student not found', async () => {
      const { admin, token } = await createTestSuperAdmin();

      const response = await request(app)
        .get(`/api/superadmin/students/NONEXISTENT`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Student not found');
    });
  });

  describe('PUT /api/superadmin/students/:pnr/assign-room', () => {
    it('should assign room to student', async () => {
      const { admin: superAdmin, token } = await createTestSuperAdmin();
      const { student } = await createTestStudent();
      const hostel = await createTestHostel(superAdmin._id);
      const room = await createTestRoom(hostel._id);

      const response = await request(app)
        .put(`/api/superadmin/students/${student.pnr}/assign-room`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          roomId: room._id.toString(),
          hostelId: hostel._id.toString(),
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('assigned');
    });
  });

  describe('PUT /api/superadmin/students/:pnr/change-room', () => {
    it('should change student room', async () => {
      const { admin: superAdmin, token } = await createTestSuperAdmin();
      const { student } = await createTestStudent();
      const hostel = await createTestHostel(superAdmin._id);
      const room1 = await createTestRoom(hostel._id, { roomNumber: '101' });
      const room2 = await createTestRoom(hostel._id, { roomNumber: '102' });

      // First assign to room1 and create application
      student.assignedRoom = room1._id;
      student.roomNumber = '101';
      await student.save();

      // Create an approved application for the student
      const { createTestApplication } = require('../helpers');
      const application = await createTestApplication(student._id, hostel._id);
      application.status = 'APPROVED';
      application.roomNumber = '101';
      application.floor = '1';
      await application.save();

      const response = await request(app)
        .put(`/api/superadmin/students/${student.pnr}/change-room`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          roomId: room2._id.toString(),
          hostelId: hostel._id.toString(),
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/superadmin/students/:pnr/removeStudentFromRoom', () => {
    it('should remove student from room', async () => {
      const { admin: superAdmin, token } = await createTestSuperAdmin();
      const { student } = await createTestStudent();
      const hostel = await createTestHostel(superAdmin._id);
      const room = await createTestRoom(hostel._id);

      // Assign student to room first
      student.assignedRoom = room._id;
      student.roomNumber = '101';
      await student.save();

      const response = await request(app)
        .put(`/api/superadmin/students/${student.pnr}/removeStudentFromRoom`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          hostelId: hostel._id.toString(),
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/superadmin/students/:pnr/reassign-room', () => {
    it('should reassign student to new room', async () => {
      const { admin: superAdmin, token } = await createTestSuperAdmin();
      const { student } = await createTestStudent();
      const hostel = await createTestHostel(superAdmin._id);
      const room1 = await createTestRoom(hostel._id, { roomNumber: '101' });
      const room2 = await createTestRoom(hostel._id, { roomNumber: '102' });

      // Initial assignment
      student.assignedRoom = room1._id;
      await student.save();

      const response = await request(app)
        .put(`/api/superadmin/students/${student.pnr}/reassign-room`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          roomId: room2._id.toString(),
          hostelId: hostel._id.toString(),
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/superadmin/students/:pnr/reject-application', () => {
    it('should reject student application', async () => {
      const { admin: superAdmin, token } = await createTestSuperAdmin();
      const { student } = await createTestStudent();
      const hostel = await createTestHostel(superAdmin._id);
      
      // Create an application for the student
      const { createTestApplication } = require('../helpers');
      const application = await createTestApplication(student._id, hostel._id);

      const response = await request(app)
        .put(`/api/superadmin/students/${student.pnr}/reject-application`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Not eligible',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/superadmin/students/:pnr/unblacklist', () => {
    it('should unblacklist a student', async () => {
      const { admin, token } = await createTestSuperAdmin();
      const { student } = await createTestStudent({
        isBlacklisted: true,
        blacklistRemarks: 'Test',
      });

      const response = await request(app)
        .put(`/api/superadmin/students/${student.pnr}/unblacklist`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Student removed from blacklist successfully');
    });
  });

  describe('GET /api/superadmin/hostels', () => {
    it('should get all hostels', async () => {
      const { admin, token } = await createTestSuperAdmin();
      await createTestHostel(admin._id);

      const response = await request(app)
        .get('/api/superadmin/hostels')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.hostels)).toBe(true);
    });
  });

  describe('GET /api/superadmin/hostels/:hostelId', () => {
    it('should get hostel details', async () => {
      const { admin, token } = await createTestSuperAdmin();
      const hostel = await createTestHostel(admin._id);

      const response = await request(app)
        .get(`/api/superadmin/hostels/${hostel._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hostel).toBeDefined();
      expect(response.body.data.hostel._id).toBe(hostel._id.toString());
    });

    it('should fail if hostel not found', async () => {
      const { admin, token } = await createTestSuperAdmin();
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/superadmin/hostels/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/superadmin/hostels', () => {
    it('should fail if required fields are missing', async () => {
      const { admin, token } = await createTestSuperAdmin();

      const response = await request(app)
        .post('/api/superadmin/hostels')
        .set('Authorization', `Bearer ${token}`)
        .send({
          location: 'Campus A',
          capacity: 100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide all required fields');
    });
  });

  describe('PUT /api/superadmin/hostels/:hostelId', () => {
    it('should update hostel details', async () => {
      const { admin, token } = await createTestSuperAdmin();
      const hostel = await createTestHostel(admin._id);

      const response = await request(app)
        .put(`/api/superadmin/hostels/${hostel._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Hostel',
          location: 'New Location',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hostel.name).toBe('Updated Hostel');
    });
  });

  describe('DELETE /api/superadmin/hostels/:hostelId', () => {
    it('should delete hostel', async () => {
      const { admin, token } = await createTestSuperAdmin();
      const hostel = await createTestHostel(admin._id);

      const response = await request(app)
        .delete(`/api/superadmin/hostels/${hostel._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/superadmin/hostels/:hostelId/disable', () => {
    it('should disable hostel', async () => {
      const { admin, token } = await createTestSuperAdmin();
      const hostel = await createTestHostel(admin._id);

      const response = await request(app)
        .patch(`/api/superadmin/hostels/${hostel._id}/disable`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hostel.isActive).toBe(false);
    });
  });

  describe('PATCH /api/superadmin/hostels/:hostelId/enable', () => {
    it('should enable hostel', async () => {
      const { admin, token } = await createTestSuperAdmin();
      const hostel = await createTestHostel(admin._id, { isActive: false });

      const response = await request(app)
        .patch(`/api/superadmin/hostels/${hostel._id}/enable`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hostel.isActive).toBe(true);
    });
  });

  describe('PUT /api/superadmin/hostels/:hostelId/change-admin', () => {
    it('should change hostel admin', async () => {
      const { admin: superAdmin, token } = await createTestSuperAdmin();
      const { admin: admin1 } = await createTestAdmin({ adminId: 'ADMIN001', email: 'admin1@test.com' });
      const { admin: admin2 } = await createTestAdmin({ adminId: 'ADMIN002', email: 'admin2@test.com' });
      const hostel = await createTestHostel(admin1._id);

      const response = await request(app)
        .put(`/api/superadmin/hostels/${hostel._id}/change-admin`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          adminId: admin2.adminId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/superadmin/hostels/:hostelId/rooms/:roomId/change-status', () => {
    it('should change room status in hostel', async () => {
      const { admin, token } = await createTestSuperAdmin();
      const hostel = await createTestHostel(admin._id);
      const room = await createTestRoom(hostel._id);

      const response = await request(app)
        .put(`/api/superadmin/hostels/${hostel._id}/rooms/${room._id}/change-status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'maintenance',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
