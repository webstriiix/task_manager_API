const prisma = require('../config/database');

const taskController = {
  createTask: async (req, res) => {
    try {
      const { title, description, status, priority, dueDate } = req.body;
      const userId = req.user.id;

      const task = await prisma.task.create({
        data: {
          title,
          description,
          status: status || 'pending',
          priority: priority || 'medium',
          dueDate: dueDate ? new Date(dueDate) : null,
          userId
        }
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating task',
        error: error.message
      });
    }
  },

  getAllTasks: async (req, res) => {
    try {
      const { status, priority, page = 1, limit = 10 } = req.query;
      
      const where = {};
      if (status) where.status = status;
      if (priority) where.priority = priority;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.task.count({ where })
      ]);

      res.json({
        success: true,
        data: tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching tasks',
        error: error.message
      });
    }
  },

  getMyTasks: async (req, res) => {
    try {
      const { status, priority, page = 1, limit = 10 } = req.query;
      const userId = req.user.id;

      const where = { userId };
      if (status) where.status = status;
      if (priority) where.priority = priority;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.task.count({ where })
      ]);

      res.json({
        success: true,
        data: tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching your tasks',
        error: error.message
      });
    }
  },

  getTaskById: async (req, res) => {
    try {
      const { id } = req.params;

      const task = await prisma.task.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching task',
        error: error.message
      });
    }
  },

  updateTask: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, status, priority, dueDate } = req.body;
      const userId = req.user.id;

      const existingTask = await prisma.task.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingTask) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      if (existingTask.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this task'
        });
      }

      const updateData = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

      const task = await prisma.task.update({
        where: { id: parseInt(id) },
        data: updateData
      });

      res.json({
        success: true,
        message: 'Task updated successfully',
        data: task
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating task',
        error: error.message
      });
    }
  },

  deleteTask: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const existingTask = await prisma.task.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingTask) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      if (existingTask.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to delete this task'
        });
      }

      await prisma.task.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting task',
        error: error.message
      });
    }
  }
};

module.exports = taskController;
