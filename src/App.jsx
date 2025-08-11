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
import { CHART_COLORS, THEME } from './utils/theme'
import StaffView from './pages/StaffView'

// Dashboard components with fake Plotly data
const Attendance = () => (
  <div>
    <h2>Attendance Dashboard</h2>
    <Plot
      data={[{
        x: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        y: [95, 92, 90, 93, 94],
        type: 'bar',
        marker: { color: CHART_COLORS.primary },
      }]}
      layout={{ title: 'Monthly Attendance Rate (%)', paper_bgcolor: THEME.background, plot_bgcolor: THEME.background, font: { color: THEME.text } }}
      style={{ width: '100%', maxWidth: 700 }}
    />
  </div>
)

const Behaviour = () => (
  <div>
    <h2>Behaviour Dashboard</h2>
    <Plot
      data={[{
        labels: ['No Incidents', 'Minor', 'Major'],
        values: [80, 15, 5],
        type: 'pie',
        marker: { colors: [CHART_COLORS.primary, CHART_COLORS.secondary, '#2a2a32'] },
      }]}
      layout={{ title: 'Behaviour Incidents', paper_bgcolor: THEME.background, plot_bgcolor: THEME.background, font: { color: THEME.text } }}
      style={{ width: '100%', maxWidth: 700 }}
    />
  </div>
)

const Demographics = () => (
  <div>
    <h2>Demographics Dashboard</h2>
    <Plot
      data={[{
        x: ['Asian', 'Black', 'Hispanic', 'White', 'Other'],
        y: [120, 80, 60, 200, 40],
        type: 'bar',
        marker: { color: CHART_COLORS.primary },
      }]}
      layout={{ title: 'Student Demographics', paper_bgcolor: THEME.background, plot_bgcolor: THEME.background, font: { color: THEME.text } }}
      style={{ width: '100%', maxWidth: 700 }}
    />
  </div>
)

const FRP = () => (
  <div>
    <h2>Free/Reduced Price Lunch Dashboard</h2>
    <Plot
      data={[{
        labels: ['Eligible', 'Not Eligible'],
        values: [150, 350],
        type: 'pie',
        marker: { colors: [CHART_COLORS.primary, CHART_COLORS.secondary] },
      }]}
      layout={{ title: 'FRP Lunch Eligibility', paper_bgcolor: THEME.background, plot_bgcolor: THEME.background, font: { color: THEME.text } }}
      style={{ width: '100%', maxWidth: 700 }}
    />
  </div>
)

const GPA = () => (
  <div>
    <h2>GPA Dashboard</h2>
    <Plot
      data={[{
        x: ['A', 'B', 'C', 'D', 'F'],
        y: [60, 100, 80, 30, 10],
        type: 'bar',
        marker: { color: CHART_COLORS.primary },
      }]}
      layout={{ title: 'GPA Distribution', paper_bgcolor: THEME.background, plot_bgcolor: THEME.background, font: { color: THEME.text } }}
      style={{ width: '100%', maxWidth: 700 }}
    />
  </div>
)

const Graduation = () => <GraduationView />

const Staff = () => (
  <div>
    <h2>Staff Dashboard</h2>
    <Plot
      data={[{
        x: ['Teachers', 'Admins', 'Support', 'Other'],
        y: [80, 10, 20, 5],
        type: 'bar',
        marker: { color: CHART_COLORS.primary },
      }]}
      layout={{ title: 'Staff Composition', paper_bgcolor: THEME.background, plot_bgcolor: THEME.background, font: { color: THEME.text } }}
      style={{ width: '100%', maxWidth: 700 }}
    />
  </div>
)

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
            <Route path="/graduation" element={<Graduation />} />
            <Route path="/chronic" element={<ChronicAbsenteeismView />} />
            <Route path="/staff" element={<StaffView />} />
          </Routes>
        </section>
        {location.pathname === '/' && (
          <>
            <section id="about">
              <WhySection />
              <AboutSection />
            </section>
            <ContactSection />
          </>
        )}
      </div>
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
