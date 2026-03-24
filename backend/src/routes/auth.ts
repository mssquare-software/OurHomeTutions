import { Router } from 'express';
import { body } from 'express-validator';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';
import {
  register,
  login,
  refreshToken,
  getProfile
} from '../controllers/authController';

const router = Router();

// Validation middleware
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9\s._-]+$/)
    .withMessage('Username can only contain letters, numbers, spaces, dots, hyphens, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required')
    .custom((value) => {
      if (!value.endsWith('@gmail.com')) {
        throw new Error('Email must be a Gmail address (must end with @gmail.com)');
      }
      return true;
    }),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  }),
  body('first_name').optional().isString().withMessage('First name must be a string'),
  body('last_name').optional().isString().withMessage('Last name must be a string'),
  body('role').isIn(['parent', 'tutor']).withMessage('Role must be parent or tutor'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Routes
router.post('/register', authRateLimiter, registerValidation, register);
router.post('/login', authRateLimiter, loginValidation, login);
router.post('/refresh-token', refreshToken);
router.get('/profile', authenticate, getProfile);

export default router;
