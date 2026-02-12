const request = require('supertest');
const express = require('express');
const authRoutes = require('../../src/routes/authRoutes');
const Student = require('../../src/models/Student');
const { createTestStudent } = require('../helpers');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new student successfully', async () => {
      const studentData = {
        name: 'John Doe',
        email: 'john@example.com',
        pnr: 'PNR001',
        password: 'password123',
        gender: 'Male',
        year: '1st',
        phone: '1234567890',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(studentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Student registered successfully');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(studentData.email);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should fail if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          // missing pnr, password, gender, year
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide all required fields');
    });

    it('should fail if email already exists', async () => {
      const { student } = await createTestStudent({
        email: 'existing@example.com',
        pnr: 'PNR999',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another Student',
          email: 'existing@example.com',
          pnr: 'PNR888',
          password: 'password123',
          gender: 'Male',
          year: '1st',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email or PNR already exists');
    });

    it('should fail if PNR already exists', async () => {
      const { student } = await createTestStudent({
        email: 'unique@example.com',
        pnr: 'EXISTINGPNR',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another Student',
          email: 'different@example.com',
          pnr: 'EXISTINGPNR',
          password: 'password123',
          gender: 'Female',
          year: '2nd',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email or PNR already exists');
    });

    it('should hash password before storing', async () => {
      const plainPassword = 'mySecretPassword123';
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          pnr: 'PNR002',
          password: plainPassword,
          gender: 'Female',
          year: '3rd',
        })
        .expect(201);

      const student = await Student.findOne({ email: 'jane@example.com' }).select('+password');
      expect(student.password).not.toBe(plainPassword);
      expect(student.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash pattern
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const { student } = await createTestStudent({
        email: 'login@example.com',
        pnr: 'LOGINPNR',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('should login with PNR instead of email', async () => {
      const { student } = await createTestStudent({
        email: 'pnr@example.com',
        pnr: 'PNRLOGIN',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'PNRLOGIN',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with invalid password', async () => {
      const { student } = await createTestStudent({
        email: 'wrongpass@example.com',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail if email or password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide email and password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const { student, token } = await createTestStudent({
        email: 'me@example.com',
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('me@example.com');
      expect(response.body.user.password).toBeUndefined();
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
