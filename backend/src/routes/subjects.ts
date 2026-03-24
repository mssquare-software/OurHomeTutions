import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Get subjects endpoint - TODO: Implement' });
});

router.get('/board/:board', (req, res) => {
  res.json({ success: true, message: 'Get subjects by board endpoint - TODO: Implement' });
});

router.get('/class/:classLevel/board/:board', (req, res) => {
  res.json({ success: true, message: 'Get subjects by class and board endpoint - TODO: Implement' });
});

export default router;
