import React from 'react';

const ContactSection = () => (
  <section id="contact" className="contact-container">
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ border: '2px solid #bbb', borderRadius: '1.5rem', width: '140px', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
        <span style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Erich Kummerlfd</span>
      </div>
      <div style={{ border: '2px solid #bbb', borderRadius: '1.5rem', width: '140px', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontWeight: 'bold' }}>Anirudh Vasudevan</span>
      </div>
    </div>
    <form className="flex flex-col gap-4 flex-1 min-w-[320px]">
      <label className="field-label">Name</label>
      <input type="text" className="field-input" placeholder="Name" />
      <label className="field-label">Email</label>
      <input type="email" className="field-input" placeholder="mail@umn.edu" />
      <label className="field-label">Share your thoughts</label>
      <textarea className="field-input" placeholder="Share your thoughts" rows={4} />
      <button type="submit" className="field-btn">Submit</button>
    </form>
  </section>
);

export default ContactSection; 