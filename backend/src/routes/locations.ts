import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/update', (req, res) => {
  res.json({ success: true, message: 'Update location endpoint - TODO: Implement' });
});

router.get('/booking/:bookingId', (req, res) => {
  res.json({ success: true, message: 'Get location history endpoint - TODO: Implement' });
});

router.get('/nearby-tutors', (req, res) => {
  res.json({ success: true, message: 'Get nearby tutors endpoint - TODO: Implement' });
});

export default router;
