const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (origin.startsWith('chrome-extension://')) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Email'],
  credentials: false,
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 500),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

app.disable('x-powered-by');
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize());
app.use(hpp());
app.use('/api', apiLimiter);

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Habit Stability Tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', require('../routes/auth'));
app.use('/api/logs', require('../routes/logs'));
app.use('/api/analytics', require('../routes/analytics'));
app.use('/api/reports', require('../routes/reports'));
app.use('/api/habits', require('../routes/habits'));
app.use('/api/users', require('../routes/users'));

app.get('/', (req, res) => {
  res.json({ message: 'Habit Stability Tracker API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

