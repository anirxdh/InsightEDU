import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import React from 'react'
import Header from './components/Header'
import AboutSection from './components/AboutSection'
import WhySection from './components/WhySection'
import LandingSlider from './components/LandingSlider'
import ContactSection from './components/ContactSection'
import Plot from 'react-plotly.js'

// Dashboard components with fake Plotly data
const Attendance = () => (
  <div>
    <h2>Attendance Dashboard</h2>
    <Plot
      data={[{
        x: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        y: [95, 92, 90, 93, 94],
        type: 'bar',
        marker: { color: '#6ec1ff' },
      }]}
      layout={{ title: 'Monthly Attendance Rate (%)', paper_bgcolor: '#18181b', plot_bgcolor: '#18181b', font: { color: '#fff' } }}
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
        marker: { colors: ['#6ec1ff', '#b3e0ff', '#23263a'] },
      }]}
      layout={{ title: 'Behaviour Incidents', paper_bgcolor: '#18181b', plot_bgcolor: '#18181b', font: { color: '#fff' } }}
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
        marker: { color: ['#6ec1ff', '#b3e0ff', '#23263a', '#888', '#fff'] },
      }]}
      layout={{ title: 'Student Demographics', paper_bgcolor: '#18181b', plot_bgcolor: '#18181b', font: { color: '#fff' } }}
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
        marker: { colors: ['#6ec1ff', '#23263a'] },
      }]}
      layout={{ title: 'FRP Lunch Eligibility', paper_bgcolor: '#18181b', plot_bgcolor: '#18181b', font: { color: '#fff' } }}
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
        marker: { color: '#6ec1ff' },
      }]}
      layout={{ title: 'GPA Distribution', paper_bgcolor: '#18181b', plot_bgcolor: '#18181b', font: { color: '#fff' } }}
      style={{ width: '100%', maxWidth: 700 }}
    />
  </div>
)

const Graduation = () => (
  <div>
    <h2>Graduation Dashboard</h2>
    <Plot
      data={[{
        x: ['2019', '2020', '2021', '2022'],
        y: [88, 90, 92, 91],
        type: 'scatter',
        mode: 'lines+markers',
        marker: { color: '#6ec1ff' },
      }]}
      layout={{ title: 'Graduation Rate (%)', paper_bgcolor: '#18181b', plot_bgcolor: '#18181b', font: { color: '#fff' } }}
      style={{ width: '100%', maxWidth: 700 }}
    />
  </div>
)

const Staff = () => (
  <div>
    <h2>Staff Dashboard</h2>
    <Plot
      data={[{
        x: ['Teachers', 'Admins', 'Support', 'Other'],
        y: [80, 10, 20, 5],
        type: 'bar',
        marker: { color: '#6ec1ff' },
      }]}
      layout={{ title: 'Staff Composition', paper_bgcolor: '#18181b', plot_bgcolor: '#18181b', font: { color: '#fff' } }}
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
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/behaviour" element={<Behaviour />} />
            <Route path="/demographics" element={<Demographics />} />
            <Route path="/frp" element={<FRP />} />
            <Route path="/gpa" element={<GPA />} />
            <Route path="/graduation" element={<Graduation />} />
            <Route path="/staff" element={<Staff />} />
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
