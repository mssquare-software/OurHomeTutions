import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get user profile (already in auth routes, but keeping for consistency)
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'User profile endpoint - TODO: Implement full user management'
  });
});

// Update user profile
router.put('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Update profile endpoint - TODO: Implement profile updates'
  });
});

// Get all users (admin only)
router.get('/', authorize('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Get all users endpoint - TODO: Implement user listing for admins'
  });
});

export default router;
