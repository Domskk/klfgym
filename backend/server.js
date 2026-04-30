const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
    
// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/reasons', require('./routes/reasons.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/announcements', require('./routes/announcement.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/trainers', require('./routes/trainer.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));

app.get('/health', (req, res) => res.json({ status: ' KLF Gym Backend is running' }));

require('./cron/dailyAnalytics');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));
