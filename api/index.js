const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(express.json());

// Безопасная инициализация Supabase
let supabase;
try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase initialized');
  } else {
    console.log('⚠️ Supabase credentials not set, using test mode');
  }
} catch (error) {
  console.log('❌ Supabase init error:', error.message);
}

// Тестовый маршрут
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend работает! 🚀',
    timestamp: new Date().toISOString(),
    supabase: supabase ? 'Connected' : 'Test mode',
  });
});

// Регистрация
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email и пароль обязательны',
      });
    }

    // Если Supabase не настроен - тестовый режим
    if (!supabase) {
      return res.json({
        success: true,
        message: 'Регистрация (тестовый режим)',
        user: {
          id: 'test-' + Date.now(),
          email: email,
          name: name,
        },
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
      return res.status(400).json({
        success: false,
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
      success: false,
      error: 'Ошибка сервера: ' + error.message,
    });
  }
});

// Логин
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email и пароль обязательны',
      });
    }

    // Если Supabase не настроен - тестовый режим
    if (!supabase) {
      return res.json({
        success: true,
        message: 'Вход (тестовый режим)',
        user: {
          id: 'test-user-123',
          email: email,
        },
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({
        success: false,
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
      success: false,
      error: 'Ошибка сервера: ' + error.message,
    });
  }
});

// Трекер активности
app.post('/api/track', async (req, res) => {
  try {
    const { activity, value, user_id } = req.body;

    if (!supabase) {
      return res.json({
        success: true,
        message: 'Активность записана (тестовый режим)',
        activity: activity,
        value: value,
      });
    }

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

    if (error) throw error;

    res.json({
      success: true,
      message: `Активность "${activity}" записана`,
      record: data[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка сохранения: ' + error.message,
    });
  }
});

// Добавляем запуск сервера
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
