import React from 'react';

const ContactSection = () => (
  <section id="contact" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '2rem', padding: '2rem 0' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ border: '2px solid #bbb', borderRadius: '1.5rem', width: '140px', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
        <span style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Erich Kummerlfd</span>
      </div>
      <div style={{ border: '2px solid #bbb', borderRadius: '1.5rem', width: '140px', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontWeight: 'bold' }}>Anirudh Vasudevan</span>
      </div>
    </div>
    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '320px', flex: 1 }}>
      <input type="text" placeholder="Name" style={{ fontWeight: 'bold', fontSize: '1.1rem', padding: '0.7em', borderRadius: '0.7em', border: '2px solid #bbb' }} />
      <input type="email" placeholder="mail@umn.edu" style={{ fontSize: '1.1rem', padding: '0.7em', borderRadius: '0.7em', border: '2px solid #bbb' }} />
      <textarea placeholder="Share your thoughts" style={{ fontSize: '1.1rem', padding: '0.7em', borderRadius: '0.7em', border: '2px solid #bbb', minHeight: '90px' }} />
      <button type="submit" style={{ background: '#b3e0ff', border: 'none', borderRadius: '0.7em', padding: '1em', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>Submit</button>
    </form>
  </section>
);

export default ContactSection; 