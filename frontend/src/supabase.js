// Placeholder auth helpers for frontend compatibility.
// The server handles credential login at /api/auth, so these functions
// are kept only to satisfy the existing Login component import.

export async function signInWithGoogle() {
  return {
    error: new Error('Google sign-in is currently unavailable.'),
  };
}

export async function sendPasswordReset(email) {
  return {
    error: new Error('Password reset is currently unavailable.'),
  };
}

export async function getSession() {
  return {
    session: null,
    error: new Error('Session lookup is unavailable.'),
  };
}

export async function signOut() {
  return {
    error: new Error('Sign-out is unavailable.'),
  };
}
