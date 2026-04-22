import { useState } from 'react';
import './LandingPage.css';
import Header from './Header';
import Signup from './Signup';
import Login from './Login';
import AdminLogin from './AdminLogin';

export default function LandingPage({ onLoginSuccess, onAdminLoginSuccess }) {
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showTrainers, setShowTrainers] = useState(false);

  const trainers = [
    { name: 'Marco Cruz', specialty: 'Strength Training Coach' },
    { name: 'Ana Mendoza', specialty: 'Yoga and Flexibility Instructor' },
    { name: 'Jake Lim', specialty: 'Cardio and Fitness Coach' },
    { name: 'Ben Torres', specialty: 'Powerlifting Coach' },
  ];


  return (
    <>
      <main className="landing">
        <Header onAdminClick={() => setShowAdminLogin(true)} />

        <section className="landing__hero" id="home">
          <div className="landing__hero-left">
            <h1 className="landing__hero-title">Transform Your Fitness Journey with KLF</h1>
            <p className="landing__hero-subtitle">
              Affordable gym memberships, professional trainers, and a motivating environment to help you reach your fitness goals.
            </p>

            <div className="landing__hero-actions">
              <button className="landing__btn landing__btn--primary" type="button" onClick={() => setShowSignup(true)}>
                Sign up
              </button>
              <button className="landing__btn landing__btn--secondary" type="button" onClick={() => setShowLogin(true)}>
                Login
              </button>
            </div>

          </div>

          <div className="landing__hero-image" aria-hidden="true">
            <div className="landing__hero-placeholder">Image</div>
          </div>
        </section>

      <section className="landing__how-it-works">
        <h2 className="landing__section-title">How it works</h2>
        <div className="landing__steps">
          <div className="landing__step-card">
            <h3>1. Register your account</h3>
            <p>Start off with creating your account with KL Fitness.</p>
          </div>
          <div className="landing__step-card">
            <h3>2. Talk to the staff</h3>
            <p>Our staff will help you with your membership plan. After talking to the staff, you will proceed to payment.</p>
          </div>
          <div className="landing__step-card">
            <h3>3. Get started!</h3>
            <p>Access gym equipment and begin your fitness journey.</p>
          </div>
        </div>
      </section>

      <section className="landing__join-fee">
        <div className="landing__join-fee-inner">
          <h3>Joining Fee of 100 PHP</h3>
          <p>(ONE TIME PAYMENT ONLY)</p>
        </div>
      </section>

      <section className="landing__plans" id="plans">
        <h2 className="landing__section-title">Membership Plans</h2>
        <div className="landing__plan-grid">
          <div className="landing__plan-card">
            <div>
              <h3>1 Month Membership Plan</h3>
              <p className="landing__plan-price">800 PHP</p>
            </div>
            <ul className="landing__plan-features">
              <li>Unlimited Gym Access</li>
            </ul>
            <button className="landing__btn landing__btn--primary">Join Now</button>
          </div>

          <div className="landing__plan-card">
            <div>
              <h3>3 Month Membership Plan</h3>
              <p className="landing__plan-price">2,300 PHP</p>
            </div>
            <ul className="landing__plan-features">
              <li>Unlimited Gym Access</li>
            </ul>
            <button className="landing__btn landing__btn--primary">Join Now</button>
          </div>

          <div className="landing__plan-card">
            <div>
              <h3>6 Month Membership Plan</h3>
              <p className="landing__plan-price">4,300 PHP</p>
            </div>
            <ul className="landing__plan-features">
              <li>Unlimited Gym Access</li>
            </ul>
            <button className="landing__btn landing__btn--primary">Join Now</button>
          </div>

          <div className="landing__plan-card">
            <div>
              <h3>1 Year Membership Plan</h3>
              <p className="landing__plan-price">8,300 PHP</p>
            </div>
            <ul className="landing__plan-features">
              <li>Unlimited Gym Access</li>
            </ul>
            <button className="landing__btn landing__btn--primary">Join Now</button>
          </div>
        </div>

        <div className="landing__trainer-fee">
          <h3>Personal Trainer Fee</h3>
          <p>1 Session – 300 PHP</p>
          <p>10 Sessions – 2,500 PHP</p>
          <button className="landing__btn landing__btn--secondary" type="button" onClick={() => setShowTrainers(true)}>
            Meet Our Trainers
          </button>
        </div>
      </section>

      <footer className="landing__footer" id="contact">
        <div className="landing__footer-inner">
          <div>
            <div className="landing__footer-title">Opening Hours</div>
            <div className="landing__footer-item">Monday – Friday: 6:00 AM – 9:00 PM</div>
            <div className="landing__footer-item">Saturday – Sunday: 8:00 AM – 5:00 PM</div>
          </div>

          <div className="landing__footer-copy">© 2026 KL Fitness. All rights reserved.</div>
        </div>
      </footer>
      </main>

      {showSignup && (
        <Signup 
          onClose={() => setShowSignup(false)} 
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      )}

      {showLogin && (
        <Login 
          onClose={() => setShowLogin(false)} 
          onLoginSuccess={() => {
            setShowLogin(false);
            onLoginSuccess();
          }}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      )}

      {showAdminLogin && (
        <AdminLogin 
          onClose={() => setShowAdminLogin(false)}
          onAdminSuccess={() => {
            setShowAdminLogin(false);
            onAdminLoginSuccess?.();
          }}
        />
      )}

      {showTrainers && (
        <div className="modal-overlay" onClick={() => setShowTrainers(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Meet Our Trainers</h2>
            <div className="trainers-list">
              {trainers.map((trainer, index) => (
                <div key={index} className="trainer-card">
                  <h3>{trainer.name}</h3>
                  <p>Specialty: {trainer.specialty}</p>
                </div>
              ))}
            </div>
            <button className="modal-close" onClick={() => setShowTrainers(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
