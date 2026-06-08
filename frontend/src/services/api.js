export const API_URL = "http://localhost:5000/api";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginUser = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const registerUser = async (full_name, email, password) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, email, password }),
  });
  return res.json();
};
// ── Password Reset ────────────────────────────────────────────────────────────
export const forgotPassword = async (email) => {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

export const resetPassword = async (token, newPassword) => {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  return res.json();
};

// Admin creates a member with membership dates
export const adminCreateMember = async (data, token) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return res.json();
};

// Cancel membership (sets is_active=false, membership_end=today)
export const cancelMembership = async (userId, token, reason = 'admin_cancelled') => {
  const res = await fetch(`${API_URL}/auth/cancel-membership/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { error: `Server error (${res.status})` }; }
  }
  return res.json();
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const getProfile = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/users/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const updateProfile = async (data, token) => {
  const res = await fetch(`${API_URL}/users/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updatePassword = async (currentPassword, newPassword, token) => {
  const res = await fetch(`${API_URL}/users/profile/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return res.json();
};

// Assign or renew membership for an existing user
export const updateMembership = async (userId, data, token) => {
  const res = await fetch(`${API_URL}/users/${userId}/membership`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return res.json();
};

// ── Trainers ──────────────────────────────────────────────────────────────────
export const getTrainers = async (token) => {
  const res = await fetch(`${API_URL}/trainers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const addTrainer = async (trainerData, token) => {
  const res = await fetch(`${API_URL}/trainers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(trainerData),
  });
  if (!res.ok) {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { error: `Server error (${res.status})` }; }
  }
  return res.json();
};

export const deleteTrainer = async (id, token) => {
  const res = await fetch(`${API_URL}/trainers/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// ── Announcements ─────────────────────────────────────────────────────────────
export const getAnnouncements = async () => {
  const res = await fetch(`${API_URL}/announcements`);
  return res.json();
};

export const createAnnouncement = async (data, token) => {
  const res = await fetch(`${API_URL}/announcements`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateAnnouncement = async (id, data, token) => {
  const res = await fetch(`${API_URL}/announcements/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteAnnouncement = async (id, token) => {
  const res = await fetch(`${API_URL}/announcements/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const getAtRiskMembers = async (token) => {
  const res = await fetch(`${API_URL}/analytics/at-risk`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const getDropoutRisk = async (userId, token) => {
  const res = await fetch(`${API_URL}/analytics/dropout-risk/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const getAnalyticsStats = async (token) => {
  const res = await fetch(`${API_URL}/analytics/stats`, {
    headers: { Authorization: `Bearer ${token}`},
  });
  return res.json();
}

// ── Attendance ────────────────────────────────────────────────────────────────
export const scanAttendance = async (qrToken, token) => {
  const res = await fetch(`${API_URL}/attendance/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ qrToken }),
  });
  if (!res.ok) {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { error: `Server error (${res.status})` }; }
  }
  return res.json();
};

export const getTodayAttendance = async (token) => {
  const res = await fetch(`${API_URL}/attendance/today`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const getMyAttendance = async (token, limit = 10) => {
  const res = await fetch(`${API_URL}/attendance/my?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const createBooking = async (bookingData, token) => {
  const res = await fetch(`${API_URL}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(bookingData),
  });
  if (!res.ok) {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { error: `Server error (${res.status})` }; }
  }
  return res.json();
};

export const getMyBookings = async (token) => {
  const res = await fetch(`${API_URL}/bookings/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const getTrainerBookings = async (trainerId, token) => {
  const res = await fetch(`${API_URL}/bookings/trainer/${trainerId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const updateBookingStatus = async (bookingId, status, token, cancelReason = null) => {
  const res = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ 
      status,
      ...(cancelReason && { cancel_reason: cancelReason })
    }),
  });
  return res.json();
};
