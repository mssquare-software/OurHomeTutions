import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Get notifications endpoint - TODO: Implement' });
});

router.patch('/:id/read', (req, res) => {
  res.json({ success: true, message: 'Mark notification as read endpoint - TODO: Implement' });
});

router.patch('/read-all', (req, res) => {
  res.json({ success: true, message: 'Mark all notifications as read endpoint - TODO: Implement' });
});

export default router;
