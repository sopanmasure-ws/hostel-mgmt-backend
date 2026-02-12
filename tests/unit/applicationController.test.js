const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const applicationRoutes = require('../../src/routes/applicationRoutes');
const { createTestStudent, createTestHostel, createTestAdmin, createTestApplication } = require('../helpers');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/applications', applicationRoutes);

describe('Application Controller Tests', () => {
  describe('POST /api/applications', () => {
    it('should create a new application', async () => {
      const { student, token } = await createTestStudent();
      const { admin } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);

      const applicationData = {
        hostelId: hostel._id,
        studentName: student.name,
        studentPNR: student.pnr,
        studentYear: student.year,
        branch: 'Computer Science',
        caste: 'General',
        dateOfBirth: '2000-01-01',
        aadharCard: 'documents/aadhar.pdf',
        admissionReceipt: 'documents/receipt.pdf',
      };

      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${token}`)
        .send(applicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Application submitted successfully');
      expect(response.body.application).toBeDefined();
    });

    it('should fail if student already has an application', async () => {
      const { student, token } = await createTestStudent();
      const { admin } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);

      // Create first application
      await createTestApplication(student._id, hostel._id);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          hostelId: hostel._id,
          studentName: student.name,
          studentPNR: student.pnr,
          studentYear: student.year,
          branch: 'CS',
          caste: 'General',
          dateOfBirth: '2000-01-01',
          aadharCard: 'doc.pdf',
          admissionReceipt: 'doc.pdf',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const { student, token } = await createTestStudent();

      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          // Missing required fields
          studentName: student.name,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/applications', () => {
    it('should get all applications for authenticated student', async () => {
      const { student, token } = await createTestStudent();
      const { admin } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      
      await createTestApplication(student._id, hostel._id);

      const response = await request(app)
        .get('/api/applications/my-applications')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/applications')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/applications/:id', () => {
    it('should get application by ID', async () => {
      const { student, token } = await createTestStudent();
      const { admin } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      const application = await createTestApplication(student._id, hostel._id);

      const response = await request(app)
        .get(`/api/applications/${application.studentPNR}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.application._id.toString()).toBe(application._id.toString());
    });

    it('should return 404 for non-existent application', async () => {
      const { token } = await createTestStudent();
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/applications/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/applications/:id', () => {
    it('should update application status', async () => {
      const { student } = await createTestStudent();
      const { admin, token } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      const application = await createTestApplication(student._id, hostel._id);

      const response = await request(app)
        .put(`/api/applications/${application._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'CANCELLED',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.application.status).toBe('CANCELLED');
    });
  });

  describe('DELETE /api/applications/:id', () => {
    it('should delete an application', async () => {
      const { student, token } = await createTestStudent();
      const { admin } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      const application = await createTestApplication(student._id, hostel._id);

      const response = await request(app)
        .delete(`/api/applications/${application._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Application deleted successfully');
    });

    it('should not allow deleting approved applications', async () => {
      const { student, token } = await createTestStudent();
      const { admin } = await createTestAdmin();
      const hostel = await createTestHostel(admin._id);
      const application = await createTestApplication(student._id, hostel._id, {
        status: 'APPROVED',
      });

      const response = await request(app)
        .delete(`/api/applications/${application._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Application Workflow Integration', () => {
    it('should complete full application lifecycle', async () => {
      // 1. Student registers
      const { student, token: studentToken } = await createTestStudent({
        email: 'workflow@test.com',
        pnr: 'WORKFLOW001',
      });

      // 2. Admin creates hostel
      const { admin, token: adminToken } = await createTestAdmin({
        adminId: 'WORKFLOW_ADMIN',
        email: 'workflowadmin@test.com',
      });
      
      const hostel = await createTestHostel(admin._id, {
        name: 'Workflow Hostel',
      });

      admin.hostelIds = [hostel._id];
      await admin.save();

      // 3. Student submits application
      const applicationData = {
        hostelId: hostel._id,
        studentName: student.name,
        studentPNR: student.pnr,
        studentYear: student.year,
        branch: 'CS',
        caste: 'General',
        dateOfBirth: '2000-01-01',
        aadharCard: 'doc.pdf',
        admissionReceipt: 'doc.pdf',
      };

      const createResponse = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(applicationData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const applicationPNR = createResponse.body.application.studentPNR;
      const applicationId = createResponse.body.application._id;

      // 4. Student views their application using PNR
      const viewResponse = await request(app)
        .get(`/api/applications/${applicationPNR}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(viewResponse.body.success).toBe(true);
      expect(viewResponse.body.application.status).toBe('PENDING');

      // 5. Admin updates application status
      const updateResponse = await request(app)
        .put(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'APPROVED',
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);

      // Workflow complete
      console.log('✓ Full application workflow test passed');
    });
  });
});
