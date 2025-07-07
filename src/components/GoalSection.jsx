import React from 'react';
import './GoalSection.css';

const GoalSection = () => (
  <section className="goal-section" id="goal">
    <h2 className="goal-heading">Why this project?</h2>
    <div className="goal-why-content">
      <p>
        Build a privacy-respecting, interactive 3D data website that showcases educational equity insights in our district through charts, dashboards, and a potential AI assistant.
      </p>
      <p>
        <b>Final Note:</b> This project is intended to be more than just a visualization - the goal is to make it useful for future students, team members, and anyone who wants a quick, interactive way to explore key trends in the data. With most major EDAs built in, it can serve as a reference tool for future work, collaborative discussions, or even onboarding. I'm keeping privacy at the core of the design and would really appreciate your guidance on anything that might need to be adjusted.
      </p>
    </div>
    <h2 className="goal-heading">Our Goals</h2>
    <p className="goal-summary">
      The overall goal of this project is to leverage data shared with UMN by a local school district to:
    </p>
    <ul className="goal-list">
      <li>Identify health and education outcome disparities between their students</li>
      <li>Develop predictive and causal models to produce insights</li>
      <li>Help develop possible interventions that could reduce or erase these disparities</li>
    </ul>
    <p className="goal-details">
      We aim to make a real impact by providing actionable insights and supporting data-driven decisions for better student outcomes.
    </p>
  </section>
);

export default GoalSection; 