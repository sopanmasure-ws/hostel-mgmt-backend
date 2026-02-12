const request = require('supertest');
const express = require('express');
const adminRoutes = require('../../src/routes/adminRoutes');
const { protect, authorize } = require('../../src/middleware/auth');
const { createTestAdmin, createTestHostel, createTestStudent, createTestApplication, createTestRoom } = require('../helpers');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin Controller Tests', () => {
  describe('POST /api/admin/register', () => {
    it('should register a new admin successfully', async () => {
      const { admin: superadmin, token } = await createTestAdmin({ role: 'superadmin' });
      
      const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        adminId: 'ADMIN123',
        password: 'password123',
        confirmPassword: 'password123',
        phone: '9876543210',
      };

      const response = await request(app)
        .post('/api/admin/register')
        .set('Authorization', `Bearer ${token}`)
        .send(adminData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin registered successfully');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.admin.email).toBe(adminData.email);
    });

    it('should fail if passwords do not match', async () => {
      const { admin: superadmin, token } = await createTestAdmin({ role: 'superadmin' });
      
      const response = await request(app)
        .post('/api/admin/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Admin User',
          email: 'admin@example.com',
          adminId: 'ADMIN123',
          password: 'password123',
          confirmPassword: 'different',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Passwords do not match');
    });

    it('should fail if admin ID already exists', async () => {
      const { admin: superadmin, token } = await createTestAdmin({ role: 'superadmin', email: 'superadmin@test.com' });
      const { admin } = await createTestAdmin({
        adminId: 'EXISTINGADMIN',
        email: 'existing@test.com',
      });

      const response = await request(app)
        .post('/api/admin/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Another Admin',
          email: 'another@example.com',
          adminId: 'EXISTINGADMIN',
          password: 'password123',
          confirmPassword: 'password123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email or Admin ID already exists');
    });
  });

  describe('POST /api/admin/login', () => {
    it('should login admin with valid credentials', async () => {
      const { admin } = await createTestAdmin({
        adminId: 'ADMIN001',
      });

      const response = await request(app)
        .post('/api/admin/login')
        .send({
          adminId: 'ADMIN001',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin logged in successfully');
      expect(response.body.data.token).toBeDefined();
    });

    it('should fail with invalid admin ID', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          adminId: 'NONEXISTENT',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with invalid password', async () => {
      const { admin } = await createTestAdmin({
        adminId: 'ADMIN002',
      });

      const response = await request(app)
        .post('/api/admin/login')
        .send({
          adminId: 'ADMIN002',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail if admin account is deactivated', async () => {
      const { admin } = await createTestAdmin({
        adminId: 'ADMIN003',
        isActive: false,
      });

      const response = await request(app)
        .post('/api/admin/login')
        .send({
          adminId: 'ADMIN003',
          password: 'password123',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Your account has been deactivated');
    });
  });

  describe('GET /api/admin/:adminId/hostels', () => {
    it('should get all hostels managed by admin', async () => {
      const { admin, token } = await createTestAdmin({
        adminId: 'ADMIN004',
      });

      const hostel1 = await createTestHostel(admin._id, {
        name: 'Hostel A',
      });
      const hostel2 = await createTestHostel(admin._id, {
        name: 'Hostel B',
      });

      // Update admin hostelIds
      admin.hostelIds = [hostel1._id, hostel2._id];
      await admin.save();

      const response = await request(app)
        .get(`/api/admin/${admin.adminId}/hostels`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hostels).toHaveLength(2);
    });
  });

  describe('GET /api/admin/hostels/:hostelId/applications', () => {
    it('should get all applications for a hostel', async () => {
      const { admin, token } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      admin.hostelIds = [hostel._id];
      await admin.save();

      const { student } = await createTestStudent();
      const application = await createTestApplication(student._id, hostel._id);

      const response = await request(app)
        .get(`/api/admin/hostels/${hostel._id}/applications`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applications).toBeDefined();
    });

    it('should filter applications by status', async () => {
      const { admin, token } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      admin.hostelIds = [hostel._id];
      await admin.save();

      const { student: student1 } = await createTestStudent({ pnr: 'PNR001' });
      const { student: student2 } = await createTestStudent({ pnr: 'PNR002', email: 'student2@test.com' });
      
      await createTestApplication(student1._id, hostel._id, { status: 'PENDING' });
      await createTestApplication(student2._id, hostel._id, { status: 'APPROVED' });

      const response = await request(app)
        .get(`/api/admin/hostels/${hostel._id}/applications?status=PENDING`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applications).toHaveLength(1);
      expect(response.body.data.applications[0].status).toBe('PENDING');
    });
  });

  describe('PUT /api/admin/applications/:applicationId/accept', () => {
    it('should accept an application and assign room', async () => {
      const { admin, token } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      admin.hostelIds = [hostel._id];
      await admin.save();

      const room = await createTestRoom(hostel._id, {
        roomNumber: '101',
        floor: '1',
        capacity: 4,
        occupiedSpaces: 0,
      });

      const { student } = await createTestStudent();
      const application = await createTestApplication(student._id, hostel._id);

      const response = await request(app)
        .put(`/api/admin/applications/${application._id}/APPROVED`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          roomNumber: '101',
          floor: '1',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Application accepted successfully');
    });

    it('should fail if room is full', async () => {
      const { admin, token } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      admin.hostelIds = [hostel._id];
      await admin.save();

      const room = await createTestRoom(hostel._id, {
        roomNumber: '102',
        floor: '1',
        capacity: 2,
        occupiedSpaces: 2, // Room is full
      });

      const { student } = await createTestStudent();
      const application = await createTestApplication(student._id, hostel._id);

      const response = await request(app)
        .put(`/api/admin/applications/${application._id}/APPROVED`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          roomNumber: '102',
          floor: '1',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Room is full');
    });
  });

  describe('GET /api/admin/hostels/:hostelId/inventory', () => {
    it('should get hostel inventory with stats', async () => {
      const { admin, token } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      admin.hostelIds = [hostel._id];
      await admin.save();

      const room1 = await createTestRoom(hostel._id, {
        roomNumber: '101',
        floor: '1',
        capacity: 2,
        occupiedSpaces: 1,
        status: 'filled',
      });

      const room2 = await createTestRoom(hostel._id, {
        roomNumber: '102',
        floor: '1',
        capacity: 2,
        occupiedSpaces: 0,
        status: 'empty',
      });

      const response = await request(app)
        .get(`/api/admin/hostels/${hostel._id}/inventory`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Inventory retrieved successfully');
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalRooms).toBe(2);
      expect(response.body.data.stats.filledRooms).toBe(1);
      expect(response.body.data.stats.emptyRooms).toBe(1);
      expect(response.body.data.rooms).toHaveLength(2);
    });

    it('should filter inventory by floor', async () => {
      const { admin, token } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      admin.hostelIds = [hostel._id];
      await admin.save();

      await createTestRoom(hostel._id, { roomNumber: '101', floor: '1' });
      await createTestRoom(hostel._id, { roomNumber: '201', floor: '2' });

      const response = await request(app)
        .get(`/api/admin/hostels/${hostel._id}/inventory?floor=1`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rooms).toHaveLength(1);
      expect(response.body.data.rooms[0].floor).toBe('1');
    });

    it('should fail if not authorized', async () => {
      const { admin: admin1 } = await createTestAdmin();
      const { admin: admin2, token } = await createTestAdmin({
        email: 'admin2@test.com',
        adminId: 'ADMIN002',
      });
      const hostel = await createTestHostel(admin1._id);

      const response = await request(app)
        .get(`/api/admin/hostels/${hostel._id}/inventory`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized to access this hostel');
    });

    it('should fail if hostel not found', async () => {
      const { admin: superAdmin, token } = await createTestAdmin({ role: 'superadmin' });
      const fakeHostelId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/admin/hostels/${fakeHostelId}/inventory`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Hostel not found');
    });
  });

  describe('GET /api/admin/hostels/:hostelId/rooms', () => {
    it('should get hostel rooms with pagination', async () => {
      const { admin, token } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      admin.hostelIds = [hostel._id];
      await admin.save();

      const room1 = await createTestRoom(hostel._id, { roomNumber: '101', floor: '1' });
      const room2 = await createTestRoom(hostel._id, { roomNumber: '102', floor: '1' });

      const response = await request(app)
        .get(`/api/admin/hostels/${hostel._id}/rooms`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Rooms retrieved successfully');
      expect(response.body.data.rooms).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter rooms by status', async () => {
      const { admin, token } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      admin.hostelIds = [hostel._id];
      await admin.save();

      await createTestRoom(hostel._id, { roomNumber: '101', status: 'empty' });
      await createTestRoom(hostel._id, { roomNumber: '102', status: 'maintenance' });

      const response = await request(app)
        .get(`/api/admin/hostels/${hostel._id}/rooms?status=empty`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.rooms).toHaveLength(1);
      expect(response.body.data.rooms[0].status).toBe('empty');
    });

    it('should fail if not authorized', async () => {
      const { admin: admin1 } = await createTestAdmin();
      const { admin: admin2, token } = await createTestAdmin({
        email: 'admin2@test.com',
        adminId: 'ADMIN003',
      });
      const hostel = await createTestHostel(admin1._id);

      const response = await request(app)
        .get(`/api/admin/hostels/${hostel._id}/rooms`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/rooms/:roomId/update-status', () => {
    it('should update room status successfully', async () => {
      const { admin, token } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      admin.hostelIds = [hostel._id];
      await admin.save();

      const room = await createTestRoom(hostel._id);

      const response = await request(app)
        .put(`/api/admin/rooms/${room._id}/update-status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'maintenance',
          notes: 'Under maintenance',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Room status updated successfully');
      expect(response.body.data.room.status).toBe('maintenance');
      expect(response.body.data.room.notes).toBe('Under maintenance');
    });

    it('should fail if status is invalid', async () => {
      const { admin, token } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      admin.hostelIds = [hostel._id];
      await admin.save();

      const room = await createTestRoom(hostel._id);

      const response = await request(app)
        .put(`/api/admin/rooms/${room._id}/update-status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'invalid_status',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid status');
    });

    it('should fail if status is not provided', async () => {
      const { admin, token } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      admin.hostelIds = [hostel._id];
      await admin.save();

      const room = await createTestRoom(hostel._id);

      const response = await request(app)
        .put(`/api/admin/rooms/${room._id}/update-status`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide room status');
    });

    it('should fail if room not found', async () => {
      const { admin, token } = await createTestAdmin();
      const fakeRoomId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/admin/rooms/${fakeRoomId}/update-status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'maintenance',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Room not found');
    });

    it('should mark room as damaged', async () => {
      const { admin, token } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      admin.hostelIds = [hostel._id];
      await admin.save();

      const room = await createTestRoom(hostel._id);

      const response = await request(app)
        .put(`/api/admin/rooms/${room._id}/update-status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'damaged',
          notes: 'Door lock broken',
        })
        .expect(200);

      expect(response.body.data.room.status).toBe('damaged');
    });
  });
});
