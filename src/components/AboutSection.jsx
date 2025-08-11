import React from 'react';
import './AboutSection.css';

const AboutSection = () => (
  <section className="about-section">
    <h2>About Me &amp; My Mentor</h2>
    <div className="about-cards">
      <div className="about-card">
        <img src="/images/your_photo.jpg" alt="Your portrait" className="about-img" />
        <h3>Your Name</h3>
        <p>Builder, explorer, and passionate about educational data. I love making complex insights accessible and interactive for everyone.</p>
      </div>
      <div className="about-card mentor">
        <img src="/images/mentor_photo.jpg" alt="Mentor portrait" className="about-img" />
        <h3>Prof. Mentor Name</h3>
        <p>My mentor and guide. Always encouraging curiosity, rigor, and creative problem-solving in data science and education.</p>
      </div>
    </div>
  </section>
);

export default AboutSection; 