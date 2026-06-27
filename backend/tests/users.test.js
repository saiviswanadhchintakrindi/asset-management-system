const request = require('supertest');
const app = require('../src/app');
const { run } = require('../src/utils/db-helper');

let adminToken;
let employeeToken;
let testUserId;

beforeAll(async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test Admin', email: 'testadmin@test.com', password: 'Admin@123', department: 'IT' });
  run('UPDATE users SET role = ? WHERE email = ?', ['admin', 'testadmin@test.com']);
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'testadmin@test.com', password: 'Admin@123' });
  adminToken = adminLogin.body.data.token;

  const empRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test Employee', email: 'testemp@test.com', password: 'Emp@12345', department: 'Engineering' });
  employeeToken = empRes.body.data.token;

  // Create assets & requests for dashboard/reports data
  const catRes = await request(app)
    .post('/api/assets/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test Category' });
  const catId = catRes.body.data.id;

  await request(app)
    .post('/api/assets')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test Asset', category_id: catId, serial_number: 'DBG-001', manufacturer: 'TestCo' });

  await request(app)
    .post('/api/requests')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({ type: 'service', title: 'Test Request', description: 'Test description for dashboard.', priority: 'low' });
});

describe('User Management API (Admin)', () => {
  it('should list all users (admin)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.rows.length).toBeGreaterThan(0);
  });

  it('should filter users by role', async () => {
    const res = await request(app)
      .get('/api/users?role=admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    res.body.data.rows.forEach(user => {
      expect(user.role).toBe('admin');
    });
  });

  it('should filter users by search', async () => {
    const res = await request(app)
      .get('/api/users?search=Test')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.rows.length).toBeGreaterThan(0);
  });

  it('should create a user (admin)', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Created User', email: 'created@test.com', password: 'Created@123', department: 'Finance', role: 'employee' });
    expect(res.status).toBe(201);
    testUserId = res.body.data.id;
  });

  it('should get user by id', async () => {
    const res = await request(app)
      .get(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('created@test.com');
  });

  it('should update a user', async () => {
    const res = await request(app)
      .put(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated User', department: 'Updated Dept' });
    expect(res.status).toBe(200);
  });

  it('should deactivate a user', async () => {
    const res = await request(app)
      .delete(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('should get user assigned assets', async () => {
    const res = await request(app)
      .get(`/api/users/${testUserId}/assets`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Dashboard API', () => {
  it('should return admin dashboard stats', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.assets).toBeDefined();
    expect(res.body.data.requests).toBeDefined();
    expect(res.body.data.users).toBeDefined();
  });

  it('should return employee dashboard stats', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('myAssets');
    expect(res.body.data).toHaveProperty('myOpenRequests');
  });
});

describe('Notification API', () => {
  it('should list user notifications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('rows');
    expect(res.body.data).toHaveProperty('unread');
  });

  it('should mark all notifications as read', async () => {
    const res = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Reports & Audit API', () => {
  it('should generate asset report', async () => {
    const res = await request(app)
      .get('/api/reports/assets')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.assets).toBeDefined();
    expect(res.body.data.summary).toBeDefined();
  });

  it('should generate filtered asset report', async () => {
    const res = await request(app)
      .get('/api/reports/assets?status=available')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('should generate request report', async () => {
    const res = await request(app)
      .get('/api/reports/requests')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.byStatus).toBeDefined();
    expect(res.body.data.byType).toBeDefined();
  });

  it('should list audit logs', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('rows');
  });

  it('should filter audit logs by entity', async () => {
    const res = await request(app)
      .get('/api/audit-logs?entity_type=user')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
