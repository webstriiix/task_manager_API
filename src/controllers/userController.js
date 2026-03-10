const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const userController = {
  register: async (req, res) => {
    try {
      const { email, name, password } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error registering user',
        error: error.message
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return res.status(500).json({
          success: false,
          message: 'JWT_SECRET is not configured'
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        secret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error logging in',
        error: error.message
      });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          _count: {
            select: { tasks: true }
          }
        }
      });

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error.message
      });
    }
  },

  getUserById: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          _count: {
            select: { tasks: true }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user',
        error: error.message
      });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { email, name, password } = req.body;

      if (req.user.id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this user'
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email }
        });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use'
          });
        }
      }

      const updateData = {};
      if (email) updateData.email = email;
      if (name) updateData.name = name;
      if (password) updateData.password = await bcrypt.hash(password, 10);

      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          updatedAt: true
        }
      });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating user',
        error: error.message
      });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      if (req.user.id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to delete this user'
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await prisma.user.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting user',
        error: error.message
      });
    }
  },

  getUserTasks: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
          tasks: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user.tasks
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user tasks',
        error: error.message
      });
    }
  }
};

module.exports = userController;
