const supabase = require('../config/db');
const { sendEmail, sendPush } = require('../services/notification.services');

// Trigger membership expiry notifications manually
const sendMembershipExpiryNotifications = async (req, res) => {
  try {
    const now = new Date().toISOString();
    const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: expiringUsers, error } = await supabase
      .from('users')
      .select('id, email, full_name, membership_end')
      .gte('membership_end', now)
      .lte('membership_end', next7Days)
      .not('membership_end', 'is', null);

    if (error) throw error;

    let sentCount = 0;

    for (const user of expiringUsers || []) {
      const html = `
        <h2>Hi ${user.full_name},</h2>
        <p>Your KLF Gym membership will expire on <strong>${new Date(user.membership_end).toLocaleDateString()}</strong>.</p>
        <p>Renew now to continue enjoying full access and get <strong>10% off</strong> your next month!</p>
        <p>Thank you for being part of KLF Gym!</p>
      `;

      await sendEmail(user.email, 'Your KLF Gym Membership is Expiring Soon!', html);

      await sendPush(user.id, 'Membership Expiring', 'Renew today and save 10%');

      // Log the notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'membership_expiry',
        title: 'Membership Expiring Soon',
        message: 'Your membership will expire in less than 7 days.',
        channel: 'email'
      });

      sentCount++;
    }

    res.json({
      success: true,
      message: `Successfully sent ${sentCount} membership expiry notifications`,
      count: sentCount
    });

  } catch (err) {
    console.error('Expiry Notification Error:', err);
    res.status(500).json({ error: 'Failed to send expiry notifications' });
  }
};

// Trigger re-engagement notifications manually
const sendReEngagementNotifications = async (req, res) => {
  try {
    const { data: inactiveUsers, error } = await supabase
      .from('user_analytics')
      .select('user_id, users(email, full_name)')
      .gt('last_visit_gap_days', 14)
      .eq('risk_level', 'High');

    if (error) throw error;

    let sentCount = 0;

    for (const user of inactiveUsers || []) {
      await sendPush(
        user.user_id,
        "We Miss You at KLF Gym!",
        "It's been a while! Come back and train with us. First session is on us!"
      );

      await supabase.from('notifications').insert({
        user_id: user.user_id,
        type: 're_engagement',
        title: 'We Miss You!',
        message: 'Re-engagement notification sent',
        channel: 'push'
      });

      sentCount++;
    }

    res.json({
      success: true,
      message: `Successfully sent ${sentCount} re-engagement notifications`,
      count: sentCount
    });

  } catch (err) {
    console.error('Re-engagement Notification Error:', err);
    res.status(500).json({ error: 'Failed to send re-engagement notifications' });
  }
};

module.exports = {
  sendMembershipExpiryNotifications,
  sendReEngagementNotifications
};