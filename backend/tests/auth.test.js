const request = require('supertest');
const app = require('../src/app');
const { run } = require('../src/utils/db-helper');

let adminToken;
let employeeToken;

beforeAll(async () => {
  // Register admin user and promote
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test Admin', email: 'testadmin@test.com', password: 'Admin@123', department: 'IT' });
  run('UPDATE users SET role = ? WHERE email = ?', ['admin', 'testadmin@test.com']);
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'testadmin@test.com', password: 'Admin@123' });
  adminToken = adminLogin.body.data.token;

  // Register employee user
  const empRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test Employee', email: 'testemp@test.com', password: 'Emp@12345', department: 'Engineering' });
  employeeToken = empRes.body.data.token;
});

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', email: 'newuser@test.com', password: 'Pass@123', department: 'Marketing' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('newuser@test.com');
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Duplicate', email: 'newuser@test.com', password: 'Pass@123' });
      expect(res.status).toBe(409);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'No Email', password: '123456' });
      expect(res.status).toBe(422);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Short', email: 'short@test.com', password: '123' });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testemp@test.com', password: 'Emp@12345' });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('employee');
    });

    it('should login as admin', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testadmin@test.com', password: 'Admin@123' });
      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('admin');
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testemp@test.com', password: 'WrongPass' });
      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'Pass@123' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('testemp@test.com');
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ current_password: 'Emp@12345', new_password: 'NewPass@123' });
      expect(res.status).toBe(200);
    });

    it('should reject wrong current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ current_password: 'WrongOld', new_password: 'NewPass@456' });
      expect(res.status).toBe(400);
    });
  });
});

describe('Authorization & Role-Based Access', () => {
  it('should allow admin to access admin routes', async () => {
    const res = await request(app)
      .get('/api/reports/assets')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('should deny employee access to admin routes', async () => {
    const res = await request(app)
      .get('/api/reports/assets')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
  });

  it('should deny employee access to user management', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
  });
});
