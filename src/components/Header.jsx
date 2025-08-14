import React, { useState } from 'react';
import './Header.css';

const Header = ({ scrollToSection }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (section) => {
    scrollToSection(section);
    setMenuOpen(false);
  };

  return (
    <header className="main-header">
      <div className="header-content">
        <span className="logo">EDUDATA</span>
        <nav className="nav-links">
          <div className="desktop-nav">
            <button className="nav-btn" onClick={() => scrollToSection('home')}>Home</button>
            <button className="nav-btn" onClick={() => scrollToSection('why')}>Goal</button>
            <button className="nav-btn" onClick={() => scrollToSection('about')}>About</button>
            <button className="nav-btn" onClick={() => scrollToSection('contact')}>Contact</button>
          </div>
          <div className="mobile-nav">
            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </button>
            {menuOpen && (
              <div className="mobile-dropdown">
                <button className="nav-btn" onClick={() => handleNav('home')}>Home</button>
                <button className="nav-btn" onClick={() => handleNav('why')}>Goal</button>
                <button className="nav-btn" onClick={() => handleNav('about')}>About</button>
                <button className="nav-btn" onClick={() => handleNav('contact')}>Contact</button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header; 