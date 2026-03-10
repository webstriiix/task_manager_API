const express = require('express');
const { body } = require('express-validator');
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('status').optional().isIn(['pending', 'in_progress', 'completed']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('dueDate must be a valid ISO 8601 date')
  ],
  validate,
  taskController.createTask
);

router.get('/', taskController.getAllTasks);

router.get('/my-tasks', auth, taskController.getMyTasks);

router.get('/:id', taskController.getTaskById);

router.put(
  '/:id',
  auth,
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('status').optional().isIn(['pending', 'in_progress', 'completed']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('dueDate must be a valid ISO 8601 date')
  ],
  validate,
  taskController.updateTask
);

router.delete('/:id', auth, taskController.deleteTask);

module.exports = router;
