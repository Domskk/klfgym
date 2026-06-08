const nodemailer = require('nodemailer');
const webpush = require('web-push');
const supabase = require('../config/db');

// BREVO SMTP TRANSPORTER
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, 
  auth: {
    user: process.env.BREVO_SMTP_USER,   // Your Brevo login email
    pass: process.env.BREVO_SMTP_KEY,    // Brevo SMTP key (NOT your password)
  },
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error(' Brevo SMTP connection failed:', error.message);
  } else {
    console.log('Brevo SMTP ready');
  }
});

// VAPID SETUP FOR PUSH
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// EMAIL SERVICE (BREVO)
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log(' Email sent:', info.messageId);
    return info;

  } catch (err) {
    console.error('Email error:', err.message);
    throw err;
  }
};

// PUSH SERVICE
const sendPush = async (userId, title, body) => {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId);

  if (error) {
    console.error(' Push DB error:', error);
    return;
  }

  if (!data || data.length === 0) return;

  for (const sub of data) {
    try {
      await webpush.sendNotification(
        sub.subscription,
        JSON.stringify({ title, body })
      );
    } catch (err) {
      console.error('Push send error:', err.message);
    }
  }
};

module.exports = { sendEmail, sendPush };