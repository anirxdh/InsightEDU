# Dashboard Components

This directory contains reusable dashboard components for displaying educational data using Plotly.js.

## Components

### GraduationOutcomesDashboard

A comprehensive dashboard for displaying graduation outcomes data with multiple interactive charts and demographic breakdowns.

**Features:**
- Overall graduation rate pie chart
- Categorical bar charts for various student demographics
- Time series analysis showing graduation trends
- Responsive design with modern UI
- Dark theme optimized for data visualization
- Handles masked data gracefully for privacy

**Props:**
```jsx
<GraduationOutcomesDashboard data={graduationData} />
```

**Data Structure:**
```javascript
const graduationData = {
  overall: {
    graduated: 0.85,        // 85% graduated
    not_graduated: 0.15     // 15% not graduated
  },
  chronically_absent: [
    { label: "Not Chronically Absent", graduated: 0.88, not_graduated: 0.12, masked: false },
    { label: "Chronically Absent", graduated: 0.72, not_graduated: 0.28, masked: false }
  ],
  // ... other categories
  year: [
    { label: "2019", graduated: 0.83, not_graduated: 0.17 },
    { label: "2020", graduated: 0.85, not_graduated: 0.15 }
  ]
}
```

## Usage

1. **Import the component:**
```jsx
import GraduationOutcomesDashboard from './components/dashboard/GraduationOutcomesDashboard'
```

2. **Prepare your data:**
```jsx
const myData = {
  overall: {
    graduated: 0.85,
    not_graduated: 0.15
  },
  chronically_absent: [
    { label: "Not Chronically Absent", graduated: 0.88, not_graduated: 0.12, masked: false },
    { label: "Chronically Absent", graduated: 0.72, not_graduated: 0.28, masked: false }
  ],
  // Add other categories as needed
  year: [
    { label: "2020", graduated: 0.85, not_graduated: 0.15 },
    { label: "2021", graduated: 0.87, not_graduated: 0.13 }
  ]
}
```

3. **Use in your component:**
```jsx
function MyComponent() {
  return (
    <div>
      <GraduationOutcomesDashboard data={myData} />
    </div>
  )
}
```

## Data Utilities

The `src/utils/dataUtils.js` file provides helper functions for:
- Data transformation
- Validation
- Statistics calculation
- Chart formatting

## Styling

All dashboard components use the `Dashboard.css` file for consistent styling. The design features:
- Dark theme with blue accents
- Glassmorphism effects
- Responsive grid layouts
- Hover animations
- Mobile-optimized layouts

## Adding New Dashboards

To create a new dashboard component:

1. Create a new component file (e.g., `AttendanceDashboard.jsx`)
2. Import the necessary dependencies
3. Use the `Dashboard.css` for styling
4. Follow the same prop pattern for data
5. Add the route in `App.jsx`

## Example Route Addition

```jsx
// In App.jsx
import GraduationOutcomesDashboard from './components/dashboard/GraduationOutcomesDashboard'

const Graduation = () => <GraduationOutcomesDashboard data={graduationData} />
```
