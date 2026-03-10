const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('name').notEmpty().withMessage('Name is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validate,
  userController.register
);

router.get('/', userController.getAllUsers);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  userController.login
);

router.get('/:id', userController.getUserById);

router.put(
  '/:id',
  auth,
  [
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validate,
  userController.updateUser
);

router.delete('/:id', auth, userController.deleteUser);

router.get('/:id/tasks', userController.getUserTasks);

module.exports = router;
