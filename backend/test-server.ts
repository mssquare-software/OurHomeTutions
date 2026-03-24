import express from 'express';

const app = express();
const PORT = 8080;

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
