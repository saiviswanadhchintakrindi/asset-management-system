const request = require('supertest');
const app = require('../src/app');
const { queryAll, run } = require('../src/utils/db-helper');

let adminToken;
let employeeToken;
let categoryId;
let assetId;
let userId;

beforeAll(async () => {
  // Register and create admin user
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test Admin', email: 'testadmin@test.com', password: 'Admin@123', department: 'IT' });
  const user = (await request(app).get('/api/users').set('Authorization', `Bearer dummy`)).body;
  run('UPDATE users SET role = ? WHERE email = ?', ['admin', 'testadmin@test.com']);
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'testadmin@test.com', password: 'Admin@123' });
  adminToken = adminLogin.body.data.token;

  // Register employee
  const empRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test Employee', email: 'testemp@test.com', password: 'Emp@12345', department: 'Engineering' });
  employeeToken = empRes.body.data.token;
});

describe('Asset Category API', () => {
  it('should create a category (admin)', async () => {
    const res = await request(app)
      .post('/api/assets/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Laptops', description: 'All laptop computers' });
    expect(res.status).toBe(201);
    categoryId = res.body.data.id;
  });

  it('should list all categories', async () => {
    const res = await request(app)
      .get('/api/assets/categories')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should update a category', async () => {
    const res = await request(app)
      .put(`/api/assets/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Notebooks', description: 'Updated description' });
    expect(res.status).toBe(200);
  });

  it('should allow employee to view categories', async () => {
    const res = await request(app)
      .get('/api/assets/categories')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Asset CRUD API', () => {
  it('should create an asset (admin)', async () => {
    const res = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'MacBook Pro 14',
        category_id: categoryId,
        serial_number: 'SN-TEST-001',
        manufacturer: 'Apple',
        model: 'M3 Pro',
        purchase_cost: 1999.99,
        status: 'available',
        location: 'Building A, Floor 2',
      });
    expect(res.status).toBe(201);
    assetId = res.body.data.id;
  });

  it('should reject duplicate serial number', async () => {
    const res = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Another MacBook', category_id: categoryId, serial_number: 'SN-TEST-001', manufacturer: 'Apple', model: 'M3' });
    expect(res.status).toBe(409);
  });

  it('should list all assets', async () => {
    const res = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.rows.length).toBeGreaterThan(0);
  });

  it('should get asset by id', async () => {
    const res = await request(app)
      .get(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.serial_number).toBe('SN-TEST-001');
  });

  it('should update an asset', async () => {
    const res = await request(app)
      .put(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'MacBook Pro 14 Updated', notes: 'Updated notes' });
    expect(res.status).toBe(200);
  });

  it('should get asset stats', async () => {
    const res = await request(app)
      .get('/api/assets/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('should deny employee from creating assets', async () => {
    const res = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ name: 'Unauthorized Asset', category_id: categoryId });
    expect(res.status).toBe(403);
  });
});

describe('Asset Assignment & Return', () => {
  beforeAll(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Assignable Emp', email: 'assignable@test.com', password: 'Assign@123', department: 'Engineering' });
    userId = regRes.body.data?.user?.id;
  });

  it('should assign an asset to user', async () => {
    const res = await request(app)
      .post(`/api/assets/${assetId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ user_id: userId, notes: 'Assigned for testing' });
    expect(res.status).toBe(200);
  });

  it('should not assign an already assigned asset', async () => {
    const res = await request(app)
      .post(`/api/assets/${assetId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ user_id: userId });
    expect(res.status).toBe(400);
  });

  it('should get assignment history', async () => {
    const res = await request(app)
      .get(`/api/assets/${assetId}/history`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return an asset', async () => {
    const res = await request(app)
      .post(`/api/assets/${assetId}/return`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('should not return an unassigned asset', async () => {
    const res = await request(app)
      .post(`/api/assets/${assetId}/return`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });
});
