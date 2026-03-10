const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/config/database');

describe('Task API', () => {
  let authToken = null;
  let testUserId = null;
  let testTaskId = null;

  const testUser = {
    email: 'taskuser@example.com',
    name: 'Task User',
    password: 'password123'
  };

  const testTask = {
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending',
    priority: 'high',
    dueDate: '2024-12-31'
  };

  beforeAll(async () => {
    await prisma.task.deleteMany({ where: {} });
    await prisma.user.deleteMany({ where: {} });

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    
    const user = await prisma.user.create({
      data: {
        ...testUser,
        password: hashedPassword
      }
    });
    testUserId = user.id;

    const loginRes = await request(app)
      .post('/users/login')
      .send({ email: testUser.email, password: testUser.password });
    
    if (loginRes.body?.data?.token) {
      authToken = loginRes.body.data.token;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /tasks', () => {
    it('should create a new task with auth', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTask);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(testTask.title);
      expect(res.body.data.userId).toBe(testUserId);
      testTaskId = res.body.data.id;
    });

    it('should not create task without auth', async () => {
      const res = await request(app)
        .post('/tasks')
        .send(testTask);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should not create task with invalid status', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...testTask, status: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should not create task with invalid dueDate', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...testTask, dueDate: 'not-a-date' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should not create task without title', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'No title' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /tasks', () => {
    it('should get all tasks without auth', async () => {
      const res = await request(app).get('/tasks');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter tasks by status', async () => {
      const res = await request(app).get('/tasks?status=pending');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const res = await request(app).get('/tasks?priority=high');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /tasks/my-tasks', () => {
    it('should get current user tasks with auth', async () => {
      const res = await request(app)
        .get('/tasks/my-tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should not get my tasks without auth', async () => {
      const res = await request(app).get('/tasks/my-tasks');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should get task by id', async () => {
      const res = await request(app).get(`/tasks/${testTaskId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(testTask.title);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app).get('/tasks/99999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update own task with auth', async () => {
      const res = await request(app)
        .put(`/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('completed');
    });

    it('should not update task without auth', async () => {
      const res = await request(app)
        .put(`/tasks/${testTaskId}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(401);
    });

    it('should not update another users task', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'othertask@example.com',
          name: 'Other Task User',
          password: 'password123'
        }
      });

      const otherTask = await prisma.task.create({
        data: {
          title: 'Other Task',
          userId: otherUser.id
        }
      });

      const res = await request(app)
        .put(`/tasks/${otherTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Hacked' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should not update task with invalid status', async () => {
      const res = await request(app)
        .put(`/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /tasks/:id', () => {
    let taskToDelete;

    beforeAll(async () => {
      taskToDelete = await prisma.task.create({
        data: {
          title: 'Delete Me',
          userId: testUserId
        }
      });
    });

    it('should delete own task with auth', async () => {
      const res = await request(app)
        .delete(`/tasks/${taskToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should not delete task without auth', async () => {
      const task = await prisma.task.create({
        data: {
          title: 'Test Delete',
          userId: testUserId
        }
      });

      const res = await request(app)
        .delete(`/tasks/${task.id}`);

      expect(res.status).toBe(401);
    });

    it('should not delete another users task', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'deleteother@example.com',
          name: 'Delete Other',
          password: 'password123'
        }
      });

      const otherTask = await prisma.task.create({
        data: {
          title: 'Other Delete',
          userId: otherUser.id
        }
      });

      const res = await request(app)
        .delete(`/tasks/${otherTask.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /users/:id/tasks', () => {
    it('should get tasks by user id', async () => {
      const res = await request(app).get(`/users/${testUserId}/tasks`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).get('/users/99999/tasks');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
