const supabase = require('../config/db');
const bcrypt = require('bcryptjs');

const getAllTrainers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone, is_active, created_at')
      .eq('role', 'trainer')
      .order('full_name', { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trainers' });
  }
};

const addTrainer = async (req, res) => {
  const { full_name, email, phone } = req.body;

  try {
    if (!full_name || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(2, 10) + 
                        Math.random().toString(36).slice(2, 6).toUpperCase();

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(tempPassword, salt);

    const { data: newTrainer, error } = await supabase
      .from('users')
      .insert({
        full_name: full_name.trim(),
        email: cleanEmail,
        password_hash,
        role: 'trainer',
        phone: phone ? phone.trim() : null,
        is_active: true,
        qr_token: `KLF-TRAINER-${Date.now().toString(36)}`
      })
      .select('id, full_name, email, phone, is_active')
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      trainer: newTrainer,
      tempPassword,
      message: `Trainer added successfully! Temporary Password: ${tempPassword}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add trainer' });
  }
};

const deleteTrainer = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .eq('role', 'trainer');

    if (error) throw error;

    res.json({ success: true, message: 'Trainer deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete trainer' });
  }
};



module.exports = { getAllTrainers, addTrainer, deleteTrainer };