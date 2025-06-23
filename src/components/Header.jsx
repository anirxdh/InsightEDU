import React from 'react';
import './Header.css';

const Header = ({ scrollToSection }) => (
  <header className="main-header">
    <div className="header-content">
      <span className="logo">EDUDATA</span>
      <nav className="nav-links">
        <button className="nav-btn" onClick={() => scrollToSection('home')}>Home</button>
        <button className="nav-btn" onClick={() => scrollToSection('about')}>About</button>
        <button className="nav-btn" onClick={() => scrollToSection('contact')}>Contact</button>
      </nav>
    </div>
  </header>
);

export default Header; 