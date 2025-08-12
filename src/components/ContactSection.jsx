import React, { useState } from 'react';
import './ContactSection.css';

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | sent | error

  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

  async function onSubmit(e) {
    e.preventDefault()
    if (!serviceId || !templateId || !publicKey) {
      setStatus('error')
      console.error('EmailJS env vars missing. Define VITE_EMAILJS_* in .env')
      return
    }

    setStatus('sending')
    try {
      const payload = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          from_name: form.name,
          reply_to: form.email,
          message: form.message,
        },
      }
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to send')
      setStatus('sent')
      setForm({ name: '', email: '', message: '' })
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="contact-section terminal">
      <div className="terminal-header">
        <span className="dot red" />
        <span className="dot yellow" />
        <span className="dot green" />
        <span className="title">Contact Us</span>
      </div>
      <form className="contact-form" onSubmit={onSubmit}>
        <label className="field-label">Full Name</label>
        <input
          type="text"
          className="field-input"
          placeholder="ex., John Doe"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <label className="field-label">Email address</label>
        <input
          type="email"
          className="field-input"
          placeholder="ex., johndoe@gmail.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
        <label className="field-label">Your message</label>
        <textarea
          className="field-input"
          placeholder="Share your thoughts or inquiries..."
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          required
        />
        <button type="submit" className="field-btn" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent ✔' : 'Send Message'}
        </button>
        {status === 'error' && (
          <div className="error-text">Failed to send. Configure VITE_EMAILJS_* in .env and try again.</div>
        )}
      </form>
    </section>
  )
}
