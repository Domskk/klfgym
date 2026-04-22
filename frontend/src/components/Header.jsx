import './Header.css';

export default function Header({ onAdminClick }) {
  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo">KL FITNESS</span>
      </div>

      <nav className="header__nav-links">
        <a href="#home" className="header__link">
          Home
        </a>
        <a href="#plans" className="header__link">
          Plans
        </a>
        <a href="#contact" className="header__link">
          Contact
        </a>
        <button className="header__admin-link" type="button" onClick={onAdminClick}>
          Admin
        </button>
      </nav>
    </header>
  );
}
