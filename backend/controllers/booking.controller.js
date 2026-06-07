const supabase = require('../config/db');
const { sendEmail, sendPush } = require('../services/notification.services');

// POST /bookings — member creates a booking
const createBooking = async (req, res) => {
  try {
    const { trainer_id, date, time, notes } = req.body;

    if (!trainer_id || !date || !time) {
      return res.status(400).json({ error: 'trainer_id, date, and time are required' });
    }

    // Check if slot already taken
    const { data: existing, error: checkError } = await supabase
      .from('trainer_bookings')
      .select('id')
      .eq('trainer_id', trainer_id)
      .eq('booking_date', date)
      .eq('booking_time', time)
      .neq('status', 'cancelled');

    if (checkError) throw checkError;
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Trainer already booked for this slot' });
    }

    const { data, error } = await supabase
      .from('trainer_bookings')
      .insert({
        user_id:      req.user.id,
        trainer_id,
        booking_date: date,
        booking_time: time,
        notes:        notes || null,
        status:       'pending',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Booking created successfully', booking: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Booking failed', details: err.message });
  }
};

// GET /bookings/my — logged-in member sees their own bookings
const getMyBookings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('trainer_bookings')
      .select(`
        id, booking_date, booking_time, status, notes, created_at,
        users!trainer_bookings_trainer_fkey (
          id, full_name, email, phone
        )
      `)
      .eq('user_id', req.user.id)
      .order('booking_date', { ascending: true });

    if (error) throw error;

    const bookings = (data ?? []).map(b => ({
      id:           b.id,
      booking_date: b.booking_date,
      booking_time: b.booking_time,
      status:       b.status,
      notes:        b.notes,
      created_at:   b.created_at,
      trainer:      b.users ?? null,
    }));

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /bookings/trainer/:trainerId — admin sees all bookings for a trainer
const getTrainerBookings = async (req, res) => {
  try {
    const { trainerId } = req.params;

    const { data, error } = await supabase
      .from('trainer_bookings')
      .select(`
        id, booking_date, booking_time, status, notes, created_at,
        users!trainer_bookings_user_fkey (
          id, full_name, email, phone, membership_end, membership_plan
        )
      `)
      .eq('trainer_id', trainerId)
      .order('booking_date', { ascending: true });

    if (error) throw error;

    const bookings = (data ?? []).map(b => ({
      id:           b.id,
      booking_date: b.booking_date,
      booking_time: b.booking_time,
      status:       b.status,
      notes:        b.notes,
      created_at:   b.created_at,
      member:       b.users ?? null,
    }));

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /bookings/:id/status — admin updates booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancel_reason } = req.body;

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const updateData = { status };

    if (status === 'cancelled') {
      updateData.cancel_reason = cancel_reason?.trim() || 'No reason provided';
    }

    // Get booking details first (to know the member)
    const { data: booking, error: fetchError } = await supabase
      .from('trainer_bookings')
      .select(`
        id, status, booking_date, booking_time,
        users!trainer_bookings_user_fkey (id, full_name, email)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const { data, error } = await supabase
      .from('trainer_bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // === Send Notification to Member if Cancelled ===
    if (status === 'cancelled' && booking.users) {
      const member = booking.users;
      const dateStr = new Date(booking.booking_date).toLocaleDateString('en-US', { 
        weekday: 'long', month: 'short', day: 'numeric' 
      });

      const message = `Your booking with the trainer on ${dateStr} at ${booking.booking_time} has been cancelled.`;

      // Send Push Notification
      await sendPush(member.id, 'Booking Cancelled', message).catch(console.error);

      // Send Email
      const html = `
        <h2>Booking Cancelled</h2>
        <p>Hi ${member.full_name},</p>
        <p>Your training session scheduled for <strong>${dateStr} at ${booking.booking_time}</strong> has been cancelled.</p>
        <p><strong>Reason:</strong> ${updateData.cancel_reason}</p>
        <p>You can book another session at any time.</p>
        <p>Thank you for choosing KLF Fitness.</p>
      `;

      await sendEmail(member.email, 'Your Booking Has Been Cancelled', html).catch(console.error);

      // Log notification
      await supabase.from('notifications').insert({
        user_id: member.id,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: message,
        channel: 'both',
      });
    }

    res.json({ message: 'Status updated successfully', booking: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createBooking, getMyBookings, getTrainerBookings, updateBookingStatus };