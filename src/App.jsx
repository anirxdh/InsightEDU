import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import React from 'react'
import Header from './components/Header'
import AboutSection from './components/AboutSection'
import WhySection from './components/WhySection'
import LandingSlider from './components/LandingSlider'
import ContactSection from './components/ContactSection'
import GraduationView from './pages/GraduationView'
import ChronicAbsenteeismView from './pages/ChronicAbsenteeismView'
import AttendanceView from './pages/AttendanceView'
import DemographicsView from './pages/DemographicsView'
import FRPView from './pages/FRPView'
import GPAView from './pages/GPAView'

import StaffView from './pages/StaffView'
import Chatbot from './components/Chatbot'



function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()

  // Scroll to section, navigating home if needed
  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/', { replace: false })
      // Wait for the section to exist in the DOM, then scroll instantly
      const tryScroll = () => {
        const section = document.getElementById(id)
        if (section) {
          section.scrollIntoView({ behavior: 'auto' })
        } else {
          setTimeout(tryScroll, 10)
        }
      }
      setTimeout(tryScroll, 10)
    } else {
      const section = document.getElementById(id)
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <>
      <Header scrollToSection={scrollToSection} />
      <div>
        <section id="home">
          <Routes>
            <Route path="/" element={<LandingSlider />} />
            <Route path="/attendance" element={<AttendanceView />} />
            <Route path="/demographics" element={<DemographicsView />} />
            <Route path="/frp" element={<FRPView />} />
            <Route path="/gpa" element={<GPAView />} />
            <Route path="/graduation" element={<GraduationView />} />
            <Route path="/chronic" element={<ChronicAbsenteeismView />} />
            <Route path="/staff" element={<StaffView />} />
          </Routes>
        </section>
        {location.pathname === '/' && (
          <>
            <section id="why">
              <WhySection />
            </section>
            <section id="about">
              <AboutSection />
            </section>
            <section id="contact">
              <ContactSection />
            </section>
          </>
        )}
      </div>
      <Chatbot />
    </>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
