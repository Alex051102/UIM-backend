const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend работает отлично! 🚀',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/track', (req, res) => {
  const { activity, value } = req.body;
  res.json({ 
    success: true, 
    activity: activity,
    value: value,
    message: `Активность "${activity}" записана: ${value} часов`
  });
});

module.exports = app;