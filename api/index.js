const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Очень простой CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

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

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
  try {
    console.log('Register request:', req.body);

    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email и пароль обязательны',
      });
    }

    // Регистрация в Supabase
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
      console.log('Supabase error:', error);
      return res.status(400).json({
        error: error.message,
      });
    }

    console.log('Registration success:', data.user?.email);

    res.json({
      success: true,
      message: 'Пользователь зарегистрирован',
      user: data.user,
    });
  } catch (error) {
    console.log('Server error:', error);
    res.status(500).json({
      error: 'Ошибка сервера: ' + error.message,
    });
  }
});

// Логин пользователя
app.post('/api/login', async (req, res) => {
  try {
    console.log('Login request:', req.body);

    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('Login error:', error);
      return res.status(400).json({
        error: error.message,
      });
    }

    console.log('Login success:', data.user?.email);

    res.json({
      success: true,
      message: 'Успешный вход',
      user: data.user,
    });
  } catch (error) {
    console.log('Server error:', error);
    res.status(500).json({
      error: 'Ошибка сервера: ' + error.message,
    });
  }
});

// Трекер активности
app.post('/api/track', async (req, res) => {
  try {
    const { activity, value, user_id } = req.body;

    const { data, error } = await supabase
      .from('activities')
      .insert([
        {
          user_id: user_id,
          activity: activity,
          value: value,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      activity: activity,
      value: value,
      record: data[0],
      message: `Активность "${activity}" записана`,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка сохранения: ' + error.message,
    });
  }
});

// Получение статистики
app.get('/api/stats/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      user_id: user_id,
      activities: data,
      total_entries: data.length,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Ошибка загрузки: ' + error.message,
    });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Life Tracker API is running!' });
});

module.exports = app;
