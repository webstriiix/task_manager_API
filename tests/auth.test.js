const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/index');
const prisma = require('../src/config/database');

describe('Auth Middleware', () => {
  let testUser = null;

  beforeAll(async () => {
    await prisma.task.deleteMany({ where: {} });
    await prisma.user.deleteMany({ where: {} });

    testUser = await prisma.user.create({
      data: {
        email: 'authuser@example.com',
        name: 'Auth User',
        password: 'password123'
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should reject request without token', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Test' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Access denied. No token provided.');
  });

  it('should reject request with invalid token', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Authorization', 'Bearer invalid-token')
      .send({ title: 'Test' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token.');
  });

  it('should reject request with malformed token', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Authorization', 'NotBearer token')
      .send({ title: 'Test' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Access denied. No token provided.');
  });

  it('should reject request with expired token', async () => {
    const expiredToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({ title: 'Test' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token expired.');
  });

  it('should reject request for non-existent user', async () => {
    const token = jwt.sign(
      { userId: 99999, email: 'nonexistent@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token. User not found.');
  });
});
