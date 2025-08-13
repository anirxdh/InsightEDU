import React from 'react';
import './WhySection.css';
import ChemistryLab3D from './ChemistryLab3D';

const WhySection = () => (
  <section className="why-section">
    <h2>Why this project?</h2>
    <div className="why-grid">
      <div className="why-visual">
        <ChemistryLab3D />
      </div>
      <div className="why-content">
        <p>
          Build a privacy-respecting, interactive 3D data website that showcases educational equity insights in our district through charts, dashboards, and a potential AI assistant.
        </p>
        <p>
          <b>Final Note:</b> This project is intended to be more than just a visualization - the goal is to make it useful for future students, team members, and anyone who wants a quick, interactive way to explore key trends in the data. With most major EDAs built in, it can serve as a reference tool for future work, collaborative discussions, or even onboarding. I'm keeping privacy at the core of the design and would really appreciate your guidance on anything that might need to be adjusted.
        </p>
      </div>
    </div>
  </section>
);

export default WhySection; 