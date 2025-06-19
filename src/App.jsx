import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import AboutSection from './components/AboutSection'
import WhySection from './components/WhySection'
import LandingSlider from './components/LandingSlider'

// Placeholder components for each dashboard
const Attendance = () => <div>Attendance Dashboard</div>
const Behaviour = () => <div>Behaviour Dashboard</div>
const Demographics = () => <div>Demographics Dashboard</div>
const FRP = () => <div>FRP Dashboard</div>
const GPA = () => <div>GPA Dashboard</div>
const Graduation = () => <div>Graduation Dashboard</div>
const Staff = () => <div>Staff Dashboard</div>

function App() {
  return (
    <Router>
      <Header />
      
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
      <WhySection />

      <AboutSection />
    </Router>
  )
}

export default App
