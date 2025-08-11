// Sample data structure for GraduationOutcomesDashboard
// Replace this with your actual aggregated graduation data

export const sampleGraduationData = {
  overall: {
    graduated: 0.85,        // 85% graduated
    not_graduated: 0.15     // 15% not graduated
  },
  
  chronically_absent: [
    { label: "Not Chronically Absent", graduated: 0.88, not_graduated: 0.12, masked: false },
    { label: "Chronically Absent", graduated: 0.72, not_graduated: 0.28, masked: false }
  ],
  
  english_learner_flag: [
    { label: "Not English Learner", graduated: 0.87, not_graduated: 0.13, masked: false },
    { label: "English Learner", graduated: 0.78, not_graduated: 0.22, masked: false }
  ],
  
  frp_eligible_flag: [
    { label: "Not FRP Eligible", graduated: 0.89, not_graduated: 0.11, masked: false },
    { label: "FRP Eligible", graduated: 0.81, not_graduated: 0.19, masked: false }
  ],
  
  gender: [
    { label: "Female", graduated: 0.87, not_graduated: 0.13, masked: false },
    { label: "Male", graduated: 0.83, not_graduated: 0.17, masked: false }
  ],
  
  federal_race_code: [
    { label: "White", graduated: 0.86, not_graduated: 0.14, masked: false },
    { label: "Black", graduated: 0.82, not_graduated: 0.18, masked: false },
    { label: "Hispanic", graduated: 0.84, not_graduated: 0.16, masked: false },
    { label: "Asian", graduated: 0.91, not_graduated: 0.09, masked: false },
    { label: "Other", graduated: 0.79, not_graduated: 0.21, masked: true }  // masked due to small count
  ],
  
  special_education_flag: [
    { label: "Not Special Education", graduated: 0.87, not_graduated: 0.13, masked: false },
    { label: "Special Education", graduated: 0.76, not_graduated: 0.24, masked: false }
  ],
  
  year: [
    { label: "2019", graduated: 0.83, not_graduated: 0.17 },
    { label: "2020", graduated: 0.85, not_graduated: 0.15 },
    { label: "2021", graduated: 0.87, not_graduated: 0.13 },
    { label: "2022", graduated: 0.88, not_graduated: 0.12 }
  ]
}

// Data structure explanation:
// - Values are proportions (0-1), not percentages
// - If you have percentages, divide by 100
// - masked: true means the count is too small to display (for privacy)
// - Each category has graduated and not_graduated rates
// - The year data shows trends over time
