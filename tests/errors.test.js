const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/config/database');

// Mock prisma
jest.mock('../src/config/database', () => ({
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  task: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $disconnect: jest.fn(),
}));

describe('Error Handling (500 Errors)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Controller Errors', () => {
    it('should return 500 when registration fails', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/users')
        .send({ email: 'error@test.com', name: 'Error', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Error registering user');
    });

    it('should return 500 when login fails', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/users/login')
        .send({ email: 'error@test.com', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error logging in');
    });

    it('should return 500 when fetching all users fails', async () => {
      prisma.user.findMany.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/users');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error fetching users');
    });

    it('should return 500 when fetching user tasks fails', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/users/1/tasks');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error fetching user tasks');
    });

    it('should return 500 when updating user fails', async () => {
      // Mock auth user
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@test.com' });
      prisma.user.update.mockRejectedValue(new Error('Database error'));

      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);

      const res = await request(app)
        .put('/users/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error updating user');
    });

    it('should return 500 when deleting user fails', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      prisma.user.delete.mockRejectedValue(new Error('Database error'));

      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);

      const res = await request(app)
        .delete('/users/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error deleting user');
    });
  });

  describe('Auth Middleware Errors', () => {
    it('should return 500 for generic authentication errors', async () => {
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const res = await request(app)
        .get('/tasks/my-tasks')
        .set('Authorization', 'Bearer valid.token.here');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Authentication error.');
      
      jwt.verify.mockRestore();
    });
  });

  describe('Task Controller Errors', () => {
    it('should return 500 when creating task fails', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      prisma.task.create.mockRejectedValue(new Error('Database error'));

      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);

      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error creating task');
    });

    it('should return 500 when fetching all tasks fails', async () => {
      prisma.task.findMany.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/tasks');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error fetching tasks');
    });

    it('should return 500 when fetching my tasks fails', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      prisma.task.findMany.mockRejectedValue(new Error('Database error'));

      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);

      const res = await request(app)
        .get('/tasks/my-tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error fetching your tasks');
    });

    it('should return 500 when fetching task by id fails', async () => {
      prisma.task.findUnique.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/tasks/1');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error fetching task');
    });

    it('should return 500 when updating task fails', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      prisma.task.findUnique.mockResolvedValue({ id: 1, userId: 1 });
      prisma.task.update.mockRejectedValue(new Error('Database error'));

      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);

      const res = await request(app)
        .put('/tasks/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New Title' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error updating task');
    });

    it('should return 500 when deleting task fails', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      prisma.task.findUnique.mockResolvedValue({ id: 1, userId: 1 });
      prisma.task.delete.mockRejectedValue(new Error('Database error'));

      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);

      const res = await request(app)
        .delete('/tasks/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error deleting task');
    });
  });
});
