import React from 'react';
import './AboutSection.css';

const AboutSection = () => (
  <section className="about-section">
    <h2>About Me &amp; My Mentor</h2>
    <div className="about-cards">
      <a className="about-link" href="https://anirudhvasudevan.netlify.app/" target="_blank" rel="noopener noreferrer">
        <div className="about-card">
          <img src="/images/anirudhvasudevan.jpeg" alt="Anirudh Vasudevan portrait" className="about-img" />
          <h3>Anirudh Vasudevan</h3>
          <p>I’m a Full‑Stack Developer with a strong inclination toward frontend development and AI integration. Currently pursuing my MS in Computer Science at the University of Minnesota (UMN), I focus on building dynamic, responsive, and intelligent applications that merge creativity with cutting‑edge technology.</p>
        </div>
      </a>
      <a className="about-link" href="https://erichkummerfeld.com/" target="_blank" rel="noopener noreferrer">
        <div className="about-card mentor">
          <img src="/images/erichKummerfld.jpeg" alt="Mentor portrait" className="about-img" />
          <h3>Erich Kummerfeld</h3>
          <p>Dr. Kummerfeld’s research focuses on statistical and machine‑learning methods for causal discovery, especially causal latent variable models. He develops new algorithms and theory, conducts rigorous simulation benchmarks, and applies these methods to health data to help inform new treatments.</p>
        </div>
      </a>
    </div>
  </section>
);

export default AboutSection; 