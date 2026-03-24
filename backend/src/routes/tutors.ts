import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Get tutors endpoint - TODO: Implement' });
});

router.get('/:id', (req, res) => {
  res.json({ success: true, message: 'Get tutor details endpoint - TODO: Implement' });
});

router.get('/subject/:subjectId', (req, res) => {
  res.json({ success: true, message: 'Get tutors by subject endpoint - TODO: Implement' });
});

router.get('/location/:city', (req, res) => {
  res.json({ success: true, message: 'Get tutors by location endpoint - TODO: Implement' });
});

export default router;
