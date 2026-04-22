import React, { useState } from "react";
import { registerUser } from "../services/api";
import "./Signup.css";

function Signup({ onClose, onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  // FIX: separate show/hide state from the value state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agree) {
      setError("Please agree to the terms & conditions.");
      return;
    }

    setLoading(true);

    try {
      const res = await registerUser(username, email, password);

      if (res.user || res.token) {
        alert("Account created successfully! Please log in.");
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        onClose();
        onSwitchToLogin(); // Go straight to login after signup
      } else {
        setError(res.error || res.message || "Signup failed. Try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-overlay">
      <div className="signup-modal">
        <button className="signup-close" type="button" onClick={onClose}>
          ×
        </button>

        <div className="signup-card">
          <div className="signup-left">
            <h1>Welcome to KL FITNESS!</h1>
            <p>Sign up to start your fitness journey with KLF.</p>
          </div>

          <div className="signup-right">
            <div className="signup-inner">
              <div className="signup-header">
                <div className="signup-brand">KL FITNESS</div>
                <div className="signup-title">Create your account</div>
                <div className="signup-subtitle">
                  Enter your correct information below.
                </div>
              </div>

              <form className="signup-form" onSubmit={handleSubmit}>
                {error && <div className="signup-error">{error}</div>}

                <div className="signup-form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose your username"
                    className="signup-input"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="signup-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    className="signup-input"
                    required
                    disabled={loading}
                  />
                </div>

                {/* FIX: use showPassword state, not password value */}
                <div className="signup-form-group">
                  <label>Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="signup-input"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                <div className="signup-form-group">
                  <label>Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="signup-input"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "" : ""}
                    </button>
                  </div>
                </div>

                <div className="signup-actions">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={() => setAgree(!agree)}
                    id="agree-checkbox"
                  />
                  <label htmlFor="agree-checkbox">
                    I agree to the{" "}
                    <span className="signup-link">terms &amp; conditions</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="signup-cta"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <div className="signup-footer">
                Already have an account?{" "}
                <button
                  type="button"
                  className="signup-link-btn"
                  onClick={onSwitchToLogin}
                >
                  Log In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;