import { useState } from 'react';
import './LandingPage.css';
import Header from './Header';
import Signup from './Signup';
import Login from './Login';
import AdminLogin from './AdminLogin';
import heroBg from '../assets/GYM4.jpg';
import gym1 from '../assets/GYM1.jpg';
import gym2 from '../assets/GYM2.jpg';
import gym3 from '../assets/GYM3.jpg';
import gym4 from '../assets/GYM4.jpg';
import gym5 from '../assets/GYM5.jpg';
import gym6 from '../assets/GYM6.jpg';

const TRAINERS = [
  { name: 'Marco Cruz',  specialty: 'Strength Training Coach',        initials: 'MC' },
  { name: 'Ana Mendoza', specialty: 'Yoga and Flexibility Instructor', initials: 'AM' },
  { name: 'Jake Lim',    specialty: 'Cardio and Fitness Coach',        initials: 'JL' },
  { name: 'Ben Torres',  specialty: 'Powerlifting Coach',              initials: 'BT' },
];

const PLANS = [
  { label: '1 Month',   price: '₱800',   period: '/month',  highlight: true  },
  { label: '3 Months',  price: '₱2,300', period: '/quarter', highlight: false },
  { label: '6 Months',  price: '₱4,300', period: '/6 months', highlight: false },
  { label: '1 Year',    price: '₱8,300', period: '/year',    highlight: false },
];

const STATS = [
  { value: '100+', label: 'Active Members'   },
  { value: '10+',  label: 'Certified Coaches' },
  { value: '5+',   label: 'Years in Service'  },
  
];

const FEATURES = [
  { icon: '🏋️', title: 'Premium Equipment',    desc: 'State-of-the-art machines and free weights maintained daily for your safety and performance.' },
  { icon: '📱', title: 'Smart Attendance',      desc: 'QR-based check-in system with real-time attendance tracking and membership status alerts.' },
  { icon: '📊', title: 'Progress Analytics',    desc: 'AI-driven insights into your workout frequency, personal records, and dropout risk alerts.' },
  { icon: '🧑‍🏫', title: 'Expert Trainers',    desc: 'Book one-on-one sessions with certified coaches who match your specific fitness goals.' },
];

// ─── Hero section ─────────────────────────────────────────────────────────────
function Hero({ onSignup, onLogin }) {
  return (
    <section className="lp-hero">
      {/* Background image with dark overlay */}
      <div className="lp-hero__bg" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="lp-hero__overlay" />

      <div className="lp-hero__content">
        <div className="lp-hero__badge">🏆 The most friendly and affordable gym in Olongapo City</div>
        <h1 className="lp-hero__title">
          Forge Your<br />
          <span className="lp-hero__title--gold">Strongest Self</span>
        </h1>
        <p className="lp-hero__sub">
          Professional coaches, smart attendance tracking, and real-time notifications — all in one platform.
        </p>
        <div className="lp-hero__actions">
          <button className="lp-btn lp-btn--primary" onClick={onSignup}>
            Start Your Journey
          </button>
          <button className="lp-btn lp-btn--ghost" onClick={onLogin}>
            Member Login
          </button>
        </div>
        {/* Trust badges */}
        <div className="lp-hero__badges">
          <span className="lp-badge">✅ No Hidden Fees</span>
          <span className="lp-badge">✅ Expert Trainers</span>
          <span className="lp-badge">✅ Smart QR Check-in</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="lp-hero__scroll">
        <div className="lp-hero__scroll-dot" />
      </div>
    </section>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  return (
    <section className="lp-stats">
      {STATS.map((s, i) => (
        <div key={i} className="lp-stats__item">
          <div className="lp-stats__value">{s.value}</div>
          <div className="lp-stats__label">{s.label}</div>
        </div>
      ))}
    </section>
  );
}

// ─── Features section ─────────────────────────────────────────────────────────
function Features() {
  return (
    <section className="lp-section lp-features" id="features">
      <div className="lp-section__tag">WHY CHOOSE KLF</div>
      <h2 className="lp-section__title">Everything You Need to Succeed</h2>
      <div className="lp-features__grid">
        {FEATURES.map((f, i) => (
          <div key={i} className="lp-feature-card">
            <div className="lp-feature-card__icon">{f.icon}</div>
            <h3 className="lp-feature-card__title">{f.title}</h3>
            <p className="lp-feature-card__desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Gallery / gym photos ─────────────────────────────────────────────────────
  function GymGallery() {
    const photos = [
      { url: gym1, alt: 'Gym floor with equipment' },
      { url: gym2, alt: 'Member lifting weights' },
      { url: gym3, alt: 'Gym members training' },
      { url: gym4, alt: 'Gym interior' },
      { url: gym5, alt: 'Personal training session' },
      { url: gym6, alt: 'Cardio area' },
    ];

  return (
    <section className="lp-section lp-gallery" id="gallery">
      <div className="lp-section__tag">OUR GYM</div>
      <h2 className="lp-section__title">World-Class Facilities</h2>
      <div className="lp-gallery__grid">
        {photos.map((p, i) => (
          <div key={i} className={`lp-gallery__item lp-gallery__item--${i === 0 ? 'large' : 'sm'}`}>
            <img src={p.url} alt={p.alt} className="lp-gallery__img" loading="lazy" />
            <div className="lp-gallery__img-overlay" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: '01', title: 'Create Your Account', desc: 'Sign up online in under a minute — no paperwork needed.' },
    { num: '02', title: 'Visit the Front Desk', desc: 'Our staff will help you choose a membership plan and process payment.' },
    { num: '03', title: 'Start Training!',      desc: 'Scan your QR code at the entrance and hit the gym floor.' },
  ];
  return (
    <section className="lp-section lp-how" id="how">
      <div className="lp-section__tag">GETTING STARTED</div>
      <h2 className="lp-section__title">Three Simple Steps</h2>
      <div className="lp-how__grid">
        {steps.map((s, i) => (
          <div key={i} className="lp-how__card">
            <div className="lp-how__num">{s.num}</div>
            <h3 className="lp-how__title">{s.title}</h3>
            <p className="lp-how__desc">{s.desc}</p>
            {i < steps.length - 1 && <div className="lp-how__arrow">→</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Membership plans ─────────────────────────────────────────────────────────
function Plans({ onSignup }) {
  return (
    <section className="lp-section lp-plans" id="plans">
      <div className="lp-section__tag">PRICING</div>
      <h2 className="lp-section__title">Simple, Transparent Pricing</h2>
      <div className="lp-plans__joining">
        <span>🎉</span> One-time joining fee of only <strong>₱100</strong>
      </div>
      <div className="lp-plans__grid">
        {PLANS.map((p, i) => (
          <div key={i} className={`lp-plan-card ${p.highlight ? 'lp-plan-card--hot' : ''}`}>
            {p.highlight && <div className="lp-plan-card__badge">MOST POPULAR</div>}
            <h3 className="lp-plan-card__label">{p.label}</h3>
            <div className="lp-plan-card__price">
              {p.price}
              <span className="lp-plan-card__period">{p.period}</span>
            </div>
            <ul className="lp-plan-card__perks">
              <li>✓ Unlimited Gym Access</li>
              <li>✓ QR Check-in</li>
              <li>✓ Progress Dashboard</li>
            </ul>

          </div>
        ))}
      </div>

      <div className="lp-trainer-fee">
        <h3>Personal Trainer Sessions</h3>
        <div className="lp-trainer-fee__grid">
          <div className="lp-trainer-fee__item">
            <span className="lp-trainer-fee__price">₱300</span>
            <span className="lp-trainer-fee__label">per session</span>
          </div>
          <div className="lp-trainer-fee__divider" />
          <div className="lp-trainer-fee__item">
            <span className="lp-trainer-fee__price">₱2,500</span>
            <span className="lp-trainer-fee__label">10 sessions</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Trainers ─────────────────────────────────────────────────────────────────
function Trainers() {
  return (
    <section className="lp-section lp-trainers" id="trainers">
      <div className="lp-section__tag">OUR TEAM</div>
      <h2 className="lp-section__title">Meet Our Expert Coaches</h2>
      <div className="lp-trainers__grid">
        {TRAINERS.map((t, i) => (
          <div key={i} className="lp-trainer-card">
            <div className="lp-trainer-card__avatar">{t.initials}</div>
            <div className="lp-trainer-card__name">{t.name}</div>
            <div className="lp-trainer-card__role">{t.specialty}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── CTA banner ───────────────────────────────────────────────────────────────
function CTABanner({ onSignup }) {
  return (
    <section className="lp-cta-banner">
      <div className="lp-cta-banner__bg" />
      <div className="lp-cta-banner__overlay" />
      <div className="lp-cta-banner__content">
        <h2 className="lp-cta-banner__title">Ready to Transform Your Body?</h2>
        <p className="lp-cta-banner__sub">Join hundreds of members who are already crushing their goals at KL Fitness.</p>
        <button className="lp-btn lp-btn--primary lp-cta-banner__btn" onClick={onSignup}>
          Join KLF Today — It's Free to Register
        </button>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="lp-footer" id="contact">
      <div className="lp-footer__inner">
        <div>
          <div className="lp-footer__brand">KL FITNESS</div>
          <div className="lp-footer__tagline">Forge Your Strongest Self</div>
        </div>
        <div>
          <div className="lp-footer__heading">Hours</div>
          <div className="lp-footer__text">Mon – Fri: 6:00 AM – 9:00 PM</div>
          <div className="lp-footer__text">Sat – Sun: 8:00 AM – 5:00 PM</div>
        </div>
        <div>
          <div className="lp-footer__heading">Contact</div>
          <div className="lp-footer__text">Caby's Commercial, 96 Magsaysay Dr, Olongapo City, 2200 Zambales</div>
          <div className="lp-footer__text">Facebook.com/KLFGYM</div>
          <div className="lp-footer__text">Instagram.com/klf_gym</div>
        </div>
      </div>
      <div className="lp-footer__copy">© 2026 KL Fitness. All rights reserved.</div>
    </footer>
  );
}

// ─── LandingPage ──────────────────────────────────────────────────────────────
export default function LandingPage({ onLoginSuccess, onAdminLoginSuccess }) {
  const [showSignup,    setShowSignup]    = useState(false);
  const [showLogin,     setShowLogin]     = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  return (
    <>
      <div className="lp-root">
        <Header onAdminClick={() => setShowAdminLogin(true)} />

        <Hero
          onSignup={() => setShowSignup(true)}
          onLogin={() => setShowLogin(true)}
        />
        <StatsBar />
        <Features />
        <GymGallery />
        <HowItWorks />
        <Plans onSignup={() => setShowSignup(true)} />
        <Trainers />
        <CTABanner onSignup={() => setShowSignup(true)} />
        <Footer />
      </div>

      {showSignup && (
        <Signup
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true); }}
        />
      )}

      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onLoginSuccess={() => { setShowLogin(false); onLoginSuccess(); }}
          onSwitchToSignup={() => { setShowLogin(false); setShowSignup(true); }}
        />
      )}

      {showAdminLogin && (
        <AdminLogin
          onClose={() => setShowAdminLogin(false)}
          onAdminSuccess={() => { setShowAdminLogin(false); onAdminLoginSuccess?.(); }}
        />
      )}
    </>
  );
}