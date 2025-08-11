// Data transformation utilities for dashboard components

/**
 * Transform graduation data into the format expected by GraduationDashboard
 * @param {Object} rawData - Raw aggregated graduation data
 * @returns {Object} Formatted data for the dashboard
 */
export const transformGraduationData = (rawData) => {
  // This function will be updated based on your actual data structure
  // For now, it returns a sample structure
  return {
    years: rawData.years || [],
    rates: rawData.rates || [],
    totalStudents: rawData.totalStudents || [],
    graduatedStudents: rawData.graduatedStudents || []
  }
}

/**
 * Validate graduation data structure
 * @param {Object} data - Data to validate
 * @returns {boolean} Whether the data is valid
 */
export const validateGraduationData = (data) => {
  if (!data || typeof data !== 'object') return false
  
  const requiredFields = ['years', 'rates', 'totalStudents', 'graduatedStudents']
  return requiredFields.every(field => 
    Array.isArray(data[field]) && data[field].length > 0
  )
}

/**
 * Calculate additional statistics from graduation data
 * @param {Object} data - Formatted graduation data
 * @returns {Object} Additional statistics
 */
export const calculateGraduationStats = (data) => {
  if (!validateGraduationData(data)) return {}
  
  const rates = data.rates
  const currentRate = rates[rates.length - 1]
  const previousRate = rates[rates.length - 2] || rates[0]
  const change = currentRate - previousRate
  const trend = change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable'
  
  return {
    currentRate,
    previousRate,
    change,
    trend,
    averageRate: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
    bestYear: data.years[rates.indexOf(Math.max(...rates))],
    worstYear: data.years[rates.indexOf(Math.min(...rates))]
  }
}

/**
 * Format data for different chart types
 * @param {Object} data - Base graduation data
 * @param {string} chartType - Type of chart ('line', 'bar', 'scatter')
 * @returns {Array} Plotly data array
 */
export const formatChartData = (data, chartType = 'scatter') => {
  if (!validateGraduationData(data)) return []
  
  const baseConfig = {
    x: data.years,
    y: data.rates,
    name: 'Graduation Rate (%)',
    marker: { 
      color: '#6ec1ff',
      size: 10,
      line: { color: '#ffffff', width: 2 }
    }
  }
  
  switch (chartType) {
    case 'bar':
      return [{
        ...baseConfig,
        type: 'bar'
      }]
    case 'line':
      return [{
        ...baseConfig,
        type: 'scatter',
        mode: 'lines',
        line: { width: 3 }
      }]
    case 'scatter':
    default:
      return [{
        ...baseConfig,
        type: 'scatter',
        mode: 'lines+markers',
        line: { width: 3 }
      }]
  }
}
