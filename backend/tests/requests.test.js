const request = require('supertest');
const app = require('../src/app');
const { run } = require('../src/utils/db-helper');

let adminToken;
let employeeToken;
let requestId;

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
});

describe('Service Request CRUD API', () => {
  it('should create a service request (employee)', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: 'asset_request',
        title: 'Need a new monitor',
        description: 'My current monitor is flickering and needs replacement.',
        priority: 'high',
      });
    expect(res.status).toBe(201);
    requestId = res.body.data.id;
  });

  it('should create a maintenance request', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: 'maintenance',
        title: 'Laptop keyboard not working',
        description: 'The space bar and enter key are stuck.',
        priority: 'medium',
      });
    expect(res.status).toBe(201);
  });

  it('should reject request with missing fields', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ type: 'other' });
    expect(res.status).toBe(422);
  });

  it('should list requests (employee sees own)', async () => {
    const res = await request(app)
      .get('/api/requests')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.rows.length).toBeGreaterThan(0);
  });

  it('should get request by id', async () => {
    const res = await request(app)
      .get(`/api/requests/${requestId}`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(requestId);
  });

  it('should not allow employee to view another employee request', async () => {
    const otherReg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other Emp', email: 'otheremp@test.com', password: 'Other@123', department: 'HR' });
    const otherToken = otherReg.body.data?.token;

    const otherReq = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ type: 'service', title: 'VPN password', description: 'I forgot my VPN password.', priority: 'low' });

    const res = await request(app)
      .get(`/api/requests/${otherReq.body.data.id}`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Request Status Transitions', () => {
  it('should approve a pending request (admin)', async () => {
    const res = await request(app)
      .put(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(200);
  });

  it('should not allow same-status transition', async () => {
    const res = await request(app)
      .put(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(400);
  });

  it('should move to in_progress', async () => {
    const res = await request(app)
      .put(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);
  });

  it('should complete a request', async () => {
    const res = await request(app)
      .put(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
  });

  it('should reject invalid transition (status not in allowed list)', async () => {
    const res = await request(app)
      .put(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'pending' });
    expect(res.status).toBe(422);
  });

  it('should not allow employee to update status', async () => {
    const newReq = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ type: 'service', title: 'Test ban', description: 'Testing status change ban.', priority: 'low' });

    const res = await request(app)
      .put(`/api/requests/${newReq.body.data.id}/status`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(403);
  });
});

describe('Request Comments', () => {
  let commentReqId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ type: 'other', title: 'Comment test', description: 'Testing comments.', priority: 'low' });
    commentReqId = res.body.data.id;
  });

  it('should add a comment', async () => {
    const res = await request(app)
      .post(`/api/requests/${commentReqId}/comments`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ comment: 'This is my first comment.' });
    expect(res.status).toBe(201);
  });

  it('should add admin comment', async () => {
    const res = await request(app)
      .post(`/api/requests/${commentReqId}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ comment: 'Admin note: We will look into this.' });
    expect(res.status).toBe(201);
  });

  it('should list comments', async () => {
    const res = await request(app)
      .get(`/api/requests/${commentReqId}/comments`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it('should reject empty comment', async () => {
    const res = await request(app)
      .post(`/api/requests/${commentReqId}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ comment: '' });
    expect(res.status).toBe(422);
  });
});
