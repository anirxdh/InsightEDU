import React, { useEffect, useMemo, useState } from "react"
import Plot from "react-plotly.js"
import { CHART_COLORS, THEME } from "../utils/theme"
import graduationData from "../data/graduationOutcomes.json"

const COLORS = {
  graduated: CHART_COLORS.primary,
  not_graduated: CHART_COLORS.secondary,
}

const BASE_LAYOUT = {
  paper_bgcolor: THEME.background,
  plot_bgcolor: THEME.background,
  font: { color: THEME.text },
  margin: { t: 56, r: 24, b: 56, l: 56 },
  hovermode: "closest",
  legend: { orientation: "h", x: 0, y: 1.1 },
  xaxis: { gridcolor: THEME.grid, zerolinecolor: THEME.grid },
  yaxis: { gridcolor: THEME.grid, zerolinecolor: THEME.grid },
}

const BASE_CONFIG = {
  displayModeBar: true,
  responsive: true,
  modeBarButtonsToRemove: ["select2d", "lasso2d"],
}

const CATEGORY_META = [
  { key: "overall", label: "Overall Graduation", type: "pie" },
  { key: "year", label: "Year (timeline)", type: "line" },
  { key: "gender", label: "Gender", type: "bars-grouped" },
  { key: "federal_race_code", label: "Race", type: "bars-grouped" },
  { key: "chronically_absent", label: "Chronically Absent", type: "bars-grouped" },
  { key: "frp_eligible_flag", label: "FRP Eligible", type: "bars-grouped" },
  { key: "english_learner_flag", label: "English Learner", type: "bars-grouped" },
  { key: "special_education_flag", label: "Special Education", type: "bars-grouped" }
]

function makeChart(category, data) {
  const meta = CATEGORY_META.find((m) => m.key === category)
  if (!meta) return { traces: [], layout: {} }

  if (category === "overall") {
    const graduated = data.overall.graduated
    const not_graduated = data.overall.not_graduated
    const labels = ["Graduated", "Not Graduated"]
    const values = [graduated, not_graduated]
    
    return {
      traces: [
        {
          type: "pie",
          labels,
          values,
          marker: { colors: [COLORS.graduated, COLORS.not_graduated] },
          hole: 0.45,
          sort: false,
          direction: "clockwise",
          hovertemplate: "%{label}: %{percent:.1%}<extra></extra>",
        },
      ],
      layout: { 
        ...BASE_LAYOUT, 
        title: "Overall Graduation Outcomes"
      },
    }
  }

  if (category === "year") {
    const rows = data.year || []
    const x = rows.map((r) => r.label)
    const yGrad = rows.map((r) => r.graduated)
    const yNotGrad = rows.map((r) => r.not_graduated)
    
    return {
      traces: [
        {
          type: "scatter",
          mode: "lines+markers",
          name: "Graduated",
          x,
          y: yGrad,
          marker: { color: COLORS.graduated },
          line: { color: COLORS.graduated },
          hovertemplate: "<b>%{x}</b><br>Graduated: %{y:.1%}<extra></extra>",
        },
        {
          type: "scatter",
          mode: "lines+markers",
          name: "Not Graduated",
          x,
          y: yNotGrad,
          marker: { color: COLORS.not_graduated },
          line: { color: COLORS.not_graduated },
          hovertemplate: "<b>%{x}</b><br>Not Graduated: %{y:.1%}<extra></extra>",
        },
      ],
      layout: {
        ...BASE_LAYOUT,
        title: "Graduation Outcomes Over Time",
        yaxis: { tickformat: ".0%", rangemode: "tozero" },
      },
    }
  }

  // For all other categories: grouped bars
  const rows = data[category] || []
  if (rows.length === 0) {
    return { traces: [], layout: { ...BASE_LAYOUT, title: "No data available" } }
  }

  const x = rows.map((r) => r.label)
  const yGrad = rows.map((r) => r.graduated)
  const yNotGrad = rows.map((r) => r.not_graduated)
  
  // Debug logging for grouped bars
  console.log(`Creating grouped bars for ${category}:`, { x, yGrad, yNotGrad })
  
  return {
    traces: [
      {
        type: "bar",
        name: "Graduated",
        x,
        y: yGrad,
        text: yGrad.map(val => `${Math.round(val * 100)}%`),
        texttemplate: "%{text}",
        textposition: "auto",
        marker: { color: COLORS.graduated },
        hovertemplate: "<b>%{x}</b><br>Graduated: %{y:.1%}<extra></extra>",
      },
      {
        type: "bar",
        name: "Not Graduated",
        x,
        y: yNotGrad,
        text: yNotGrad.map(val => `${Math.round(val * 100)}%`),
        texttemplate: "%{text}",
        textposition: "auto",
        marker: { color: COLORS.not_graduated },
        hovertemplate: "<b>%{x}</b><br>Not Graduated: %{y:.1%}<extra></extra>",
      },
    ],
    layout: {
      ...BASE_LAYOUT,
      title: meta.label || "Category",
      barmode: "group",
      yaxis: { tickformat: ".0%", rangemode: "tozero", range: [0, 1] },
    },
  }
}

export default function GraduationView() {
  const [category, setCategory] = useState("overall")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      console.log("Loading graduation data:", graduationData)
      setData(graduationData)
      setLoading(false)
    } catch (e) {
      console.error("Error loading graduation data:", e)
      setError(String(e))
    }
  }, [])

  const { traces, layout } = useMemo(() => {
    if (!data) return { traces: [], layout: {} }
    return makeChart(category, data)
  }, [category, data])

  return (
    <div style={{ 
      padding: 24, 
      color: "#fff", 
      background: "#0b0b0d", 
      minHeight: "100vh",
      maxWidth: "100vw",
      overflowX: "hidden"
    }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 12, 
        marginBottom: 12,
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => window.history.back()}
          style={{
            background: "transparent",
            color: "#fff",
            border: "1px solid #333",
            width: 40,
            height: 40,
            borderRadius: 8,
            cursor: "pointer",
            flexShrink: 0
          }}
        >
          ←
        </button>
        <h1 style={{ 
          fontSize: 28, 
          fontWeight: 700, 
          margin: 0,
          flex: 1,
          minWidth: 0
        }}>Graduation Outcomes</h1>
      </div>

      {/* Main content */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "300px 1fr", 
        gap: 24,
        maxWidth: "100%"
      }}>
        {/* Left panel */}
        <div>
          {/* Description */}
          <div style={{
            border: "1px solid #2a2a32",
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            background: "#16161a",
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>About the data</h3>
            <p style={{ margin: 0, lineHeight: 1.5, color: "#c9c9d1" }}>
              Graduation outcomes by category. Overall shows a pie chart, Year shows trends, and others show grouped bars comparing graduated vs not graduated rates.
            </p>
          </div>

          {/* Categories */}
          <div style={{
            border: "1px solid #2a2a32",
            borderRadius: 20,
            padding: 16,
            background: "#16161a"
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Categories</div>
            <div style={{ display: "grid", gap: 8 }}>
              {CATEGORY_META.map(({ key, label }) => {
                const active = category === key
                return (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid " + (active ? "#3b82f6" : "#2a2a32"),
                      background: active ? "#0f172a" : "#121218",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "14px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right panel: Chart */}
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{
            border: "1px solid #2a2a32",
            borderRadius: 16,
            padding: 8,
            background: "#16161a",
            height: 560,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            minHeight: 400
          }}>
            {loading && <div style={{ color: "#a1a1aa" }}>Loading chart…</div>}
            {error && <div style={{ color: "salmon" }}>Failed to load: {error}</div>}
            {!loading && !error && data && traces.length > 0 && (
              <Plot 
                key={`graduation-${category}`}
                data={traces} 
                layout={{ ...layout, autosize: true }} 
                config={BASE_CONFIG} 
                style={{ width: "100%", height: "100%" }} 
                useResizeHandler 
              />
            )}
            {!loading && !error && data && traces.length === 0 && (
              <div style={{ color: "#a1a1aa" }}>No data available for this category</div>
            )}
          </div>

          {/* Analysis */}
          <div style={{
            border: "1px solid #2a2a32",
            borderRadius: 16,
            padding: 16,
            background: "#16161a"
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Analysis</div>
            <p style={{ margin: 0, color: "#c9c9d1" }}>
              {category === "overall" && "Overall graduation rate shows the percentage of students who successfully graduated."}
              {category === "year" && "Graduation trends over time show how rates have changed across different academic years."}
              {category !== "overall" && category !== "year" && "Grouped bars show graduation rates (blue) vs non-graduation rates (orange) for each category, allowing easy comparison of outcomes across different student groups."}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: 300px 1fr"] {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          div[style*="grid-template-columns: 300px 1fr"] > div:first-child {
            order: 2;
          }
          
          div[style*="grid-template-columns: 300px 1fr"] > div:last-child {
            order: 1;
          }
          
          div[style*="height: 560px"] {
            height: 400px !important;
            margin-bottom: 16px !important;
          }
        }

        @media (max-width: 768px) {
          div[style*="padding: 24px"] {
            padding: 16px !important;
          }
          
          h1[style*="font-size: 28px"] {
            font-size: 24px !important;
          }
          
          div[style*="display: grid"] > div > div > div > div > div {
            grid-template-columns: 1fr !important;
          }
          
          div[style*="height: 560px"] {
            height: 350px !important;
            padding: 4px !important;
          }

          /* Reduce pie chart size by 15% on mobile */
          div[style*="height: 560px"] .js-plotly-plot {
            transform: scale(0.85) !important;
            transform-origin: center center !important;
          }
        }

        @media (max-width: 480px) {
          div[style*="padding: 24px"] {
            padding: 12px !important;
          }
          
          h1[style*="font-size: 28px"] {
            font-size: 20px !important;
          }
          
          div[style*="height: 560px"] {
            height: 300px !important;
          }
          
          div[style*="grid-template-columns: 300px 1fr"] {
            gap: 12px !important;
          }

          /* Reduce pie chart size by 15% on small mobile */
          div[style*="height: 560px"] .js-plotly-plot {
            transform: scale(0.85) !important;
            transform-origin: center center !important;
          }
        }
      `}</style>
    </div>
  )
}