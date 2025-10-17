const express = require('express');

const app = express();

// Простой CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.json());

// Простой тест
app.get('/api/test', (req, res) => {
  console.log('✅ Test endpoint called');
  res.json({
    message: 'Backend работает! 🚀',
    timestamp: new Date().toISOString(),
  });
});

// Простая регистрация (без Supabase пока)
app.post('/api/register', (req, res) => {
  console.log('📝 Register called:', req.body);
  res.json({
    success: true,
    message: 'Регистрация успешна (тестовый режим)',
    user: { id: 'test-' + Date.now(), email: req.body.email },
  });
});

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({
    message: 'Life Tracker API is running!',
    status: 'OK',
  });
});

// Экспортируем app для Vercel
module.exports = app;
