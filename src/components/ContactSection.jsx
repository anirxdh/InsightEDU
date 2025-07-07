import React from 'react';
import './ContactSection.css';

const ContactSection = () => (
  <section id="contact" className="contact-section">
    <form className="contact-form">
      <label className="field-label">Full Name</label>
      <input type="text" className="field-input" placeholder="ex., John Doe" />
      <label className="field-label">Email address</label>
      <input type="email" className="field-input" placeholder="ex., johndoe@gmail.com" />
      <label className="field-label">Your message</label>
      <textarea className="field-input" placeholder="Share your thoughts or inquiries..." rows={4} />
      <button type="submit" className="field-btn">Send Message</button>
    </form>
  </section>
);

export default ContactSection; 