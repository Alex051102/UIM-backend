const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(express.json());

let supabase;
try {
  const supabaseUrl = 'https://fxklbgmonojvmrwooyif.supabase.co';
  const supabaseKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4a2xiZ21vbm9qdm1yd29veWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTc2MzcsImV4cCI6MjA3NjEzMzYzN30.oCuhJIeqINchH447pNNuFryqfDceiy_fIhOPOMJn6d4';

  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase initialized');
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

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, surveyData } = req.body;

    console.log('📨 Получены данные регистрации:');
    console.log('- Email:', email);
    console.log('- Name:', name);
    console.log('- Весь surveyData:', JSON.stringify(surveyData, null, 2));

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

    // Регистрация в Supabase Auth
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

    // ✅ СОЗДАЕМ ПРОФИЛЬ С ДАННЫМИ ОПРОСНИКА
    if (data.user) {
      const survey = surveyData || {};
      const baseInfo = survey.base || [];
      const goals = survey.goals || [];
      const habits = survey.habits || [];
      const aiSupport = survey.ai_support || null; // ✅ Ищем ai_support

      console.log('🔍 Извлеченные данные:');
      console.log('- baseInfo:', baseInfo);
      console.log('- goals:', goals);
      console.log('- habits:', habits);
      console.log('- ai_support:', aiSupport);
      console.log('- activity:', survey.activity);

      // Обрабатываем гендер
      let gender = null;
      const genderValue = baseInfo[3];
      if (genderValue) {
        if (
          genderValue.toLowerCase().includes('муж') ||
          genderValue.toLowerCase().includes('male')
        ) {
          gender = 'male';
        } else if (
          genderValue.toLowerCase().includes('жен') ||
          genderValue.toLowerCase().includes('female')
        ) {
          gender = 'female';
        } else {
          gender = genderValue;
        }
      }

      // Подготавливаем данные для вставки
      const profileData = {
        user_id: data.user.id,
        email: email,
        name: name || '',
        password: password,

        // Базовые данные
        gender: gender,
        age: parseInt(baseInfo[0]) || null,
        height: parseInt(baseInfo[1]) || null,
        weight: parseInt(baseInfo[2]) || null,

        // Цели и активность
        activity_level: survey.activity || null,
        goals: goals,
        habits: habits,
        ai_support: aiSupport, // ✅ Используем извлеченное значение

        // Статус
        completed_survey: true,
      };

      console.log('📝 Финальные данные для БД:', profileData);

      const { error: profileError } = await supabase.from('user_profiles').insert([profileData]);

      if (profileError) {
        console.error('❌ Ошибка создания профиля:', profileError);
      } else {
        console.log('✅ Профиль успешно создан в БД');
      }
    }

    res.json({
      success: true,
      message: 'Пользователь зарегистрирован',
      user: data.user,
    });
  } catch (error) {
    console.error('💥 Ошибка сервера:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера: ' + error.message,
    });
  }
});
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

app.get('/api/survey/check/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!supabase) {
      return res.json({
        success: true,
        completed_survey: false,
      });
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('completed_survey')
      .eq('user_id', user_id)
      .single();

    if (error) {
      return res.json({
        success: true,
        completed_survey: false,
      });
    }

    res.json({
      success: true,
      completed_survey: profile.completed_survey,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка проверки опросника',
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
