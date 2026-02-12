const request = require('supertest');
const express = require('express');
const hostelRoutes = require('../../src/routes/hostelRoutes');
const { createTestAdmin, createTestHostel, createTestStudent } = require('../helpers');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/hostels', hostelRoutes);

describe('Hostel Controller Tests', () => {
  describe('GET /api/hostels', () => {
    it('should get all active hostels', async () => {
      const { admin, token } = await createTestAdmin();
      await createTestHostel(admin._id, { name: 'Hostel A', isActive: true });
      await createTestHostel(admin._id, { name: 'Hostel B', isActive: true });

      const response = await request(app)
        .get('/api/hostels')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.hostels)).toBe(true);
      expect(response.body.hostels.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter hostels by gender', async () => {
      const { admin, token } = await createTestAdmin();
      await createTestHostel(admin._id, { name: 'Boys Hostel', gender: 'Male' });
      await createTestHostel(admin._id, { name: 'Girls Hostel', gender: 'Female' });

      const response = await request(app)
        .get('/api/hostels?gender=Male')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hostels.every(h => h.gender === 'Male')).toBe(true);
    });

    it('should not return inactive hostels', async () => {
      const { admin, token } = await createTestAdmin();
      await createTestHostel(admin._id, { name: 'Inactive Hostel', isActive: false });

      const response = await request(app)
        .get('/api/hostels')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const inactiveHostel = response.body.hostels.find(h => h.name === 'Inactive Hostel');
      expect(inactiveHostel).toBeUndefined();
    });
  });

  describe('GET /api/hostels/:id', () => {
    it('should get hostel by ID', async () => {
      const { admin, token } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id, { name: 'Test Hostel' });

      const response = await request(app)
        .get(`/api/hostels/${hostel._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hostel._id.toString()).toBe(hostel._id.toString());
      expect(response.body.hostel.name).toBe('Test Hostel');
    });

    it('should return 404 for non-existent hostel', async () => {
      const { admin, token } = await createTestAdmin();
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/hostels/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Hostel not found');
    });
  });

  describe('POST /api/hostels', () => {
    it('should create a new hostel', async () => {
      const { admin, token } = await createTestAdmin({ role: 'superadmin' });

      const hostelData = {
        name: 'New Hostel',
        location: 'Test Location',
        capacity: 100,
        availableRooms: 25,
        gender: 'Male',
        adminId: admin._id,
      };

      const response = await request(app)
        .post('/api/hostels')
        .set('Authorization', `Bearer ${token}`)
        .send(hostelData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Hostel created successfully');
      expect(response.body.hostel.name).toBe(hostelData.name);
    });

    it('should fail with missing required fields', async () => {
      const { admin, token } = await createTestAdmin({ role: 'superadmin' });

      const response = await request(app)
        .post('/api/hostels')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Incomplete Hostel',
          // missing location, capacity, etc.
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/hostels/:id', () => {
    it('should update hostel details', async () => {
      const { admin, token } = await createTestAdmin({ role: 'superadmin' });
      const hostel = await createTestHostel(admin._id);

      admin.hostelIds = [hostel._id];
      await admin.save();

      const response = await request(app)
        .put(`/api/hostels/${hostel._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Hostel Name',
          capacity: 150,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hostel.name).toBe('Updated Hostel Name');
      expect(response.body.hostel.capacity).toBe(150);
    });
  });

  describe('DELETE /api/hostels/:id', () => {
    it('should delete a hostel', async () => {
      const { admin, token } = await createTestAdmin({ role: 'superadmin' });
      const hostel = await createTestHostel(admin._id);

      admin.hostelIds = [hostel._id];
      await admin.save();

      const response = await request(app)
        .delete(`/api/hostels/${hostel._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Hostel deleted successfully');
    });
  });
});
