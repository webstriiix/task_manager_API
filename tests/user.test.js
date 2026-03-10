const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/config/database');

describe('User API', () => {
  let authToken = null;
  let testUserId = null;

  const testUser = {
    email: 'testuser@example.com',
    name: 'Test User',
    password: 'password123'
  };

  beforeAll(async () => {
    await prisma.task.deleteMany({ where: {} });
    await prisma.user.deleteMany({ where: {} });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/users')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.name).toBe(testUser.name);
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should not create user with existing email', async () => {
      const res = await request(app)
        .post('/users')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already registered');
    });

    it('should not create user with invalid email', async () => {
      const res = await request(app)
        .post('/users')
        .send({
          email: 'invalid-email',
          name: 'Test',
          password: '123456'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should not create user with short password', async () => {
      const res = await request(app)
        .post('/users')
        .send({
          email: 'test2@example.com',
          name: 'Test',
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /users/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      authToken = res.body.data.token;
      testUserId = res.body.data.user.id;
    });

    it('should not login with invalid email', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /users', () => {
    it('should get all users', async () => {
      const res = await request(app).get('/users');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by id', async () => {
      const res = await request(app).get(`/users/${testUserId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).get('/users/99999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /users/:id', () => {
    it('should update own user with auth', async () => {
      const res = await request(app)
        .put(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('should not update user without auth', async () => {
      const res = await request(app)
        .put(`/users/${testUserId}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(401);
    });

    it('should not update another user', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          name: 'Other User',
          password: 'password123'
        }
      });

      const res = await request(app)
        .put(`/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should not update email to an already existing one', async () => {
      await prisma.user.create({
        data: {
          email: 'existing@example.com',
          name: 'Existing User',
          password: 'password123'
        }
      });

      const res = await request(app)
        .put(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'existing@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email already in use');
    });
  });

  describe('DELETE /users/:id', () => {
    let userToDelete;

    beforeAll(async () => {
      userToDelete = await prisma.user.create({
        data: {
          email: 'delete@example.com',
          name: 'Delete Me',
          password: 'password123'
        }
      });
    });

    it('should delete own user with auth', async () => {
      const res = await request(app)
        .delete(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should not delete user without auth', async () => {
      const res = await request(app)
        .delete(`/users/${userToDelete.id}`);

      expect(res.status).toBe(401);
    });
  });
});
