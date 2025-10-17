const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Supabase клиент
const supabaseUrl = 'https://fxklbgmonojvmrwooyif.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4a2xiZ21vbm9qdm1yd29veWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTc2MzcsImV4cCI6MjA3NjEzMzYzN30.oCuhJIeqINchH447pNNuFryqfDceiy_fIhOPOMJn6d4';
const supabase = createClient(supabaseUrl, supabaseKey);

// Тестовый маршрут
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend работает! 🚀',
    timestamp: new Date().toISOString(),
  });
});

// Регистрация
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email и пароль обязательны',
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
          created_at: new Date().toISOString(),
        },
      },
    });

    if (error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Пользователь зарегистрирован',
      user: data.user,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка сервера: ' + error.message,
    });
  }
});

// Логин
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Успешный вход',
      user: data.user,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка сервера: ' + error.message,
    });
  }
});

module.exports = app;
