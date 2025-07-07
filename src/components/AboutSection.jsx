import React from 'react';
import './AboutSection.css';

const AboutSection = () => (
  <section className="about-section" id="about">
    <h2>About Me &amp; My Advisor</h2>
    <div className="about-cards">
      <div className="about-card">
        <img src="/images/your_photo.jpg" alt="My portrait" className="about-img" />
        <h3>Anirudh Vasudevan</h3>
        <p>Graduate Researcher , AI enthusiast likes to build stuff </p>
      </div>
      <div className="about-card mentor">
        <img src="/images/mentor_photo.jpg" alt="Advisor portrait" className="about-img" />
        <h3>Prof. Erich Kummerfeld</h3>
        <p>Institute of Health Informatics, University of Minnesota. Data Sciene guy likes to watch webtoon and play rabbits and steel.</p>
      </div>
    </div>
  </section>
);

export default AboutSection; 