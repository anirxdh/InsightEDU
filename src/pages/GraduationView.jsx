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
  { key: "overall", label: "Overall", type: "pie" },
  { key: "year", label: "Year (timeline)", type: "line" },
  { key: "gender", label: "Gender", type: "bars" },
  { key: "federal_race_code", label: "Race", type: "bars" },
  { key: "chronically_absent", label: "Chronically Absent", type: "bars" },
  { key: "frp_eligible_flag", label: "FRP Eligible", type: "bars" },
  { key: "english_learner_flag", label: "English Learner", type: "bars" },
  { key: "special_education_flag", label: "Special Education", type: "bars" }
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
      yaxis: { tickformat: ".0%", rangemode: "tozero" },
    },
  }
}

export default function GraduationView() {
  const [category, setCategory] = useState("overall")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("Loading graduation data:", graduationData)
    setData(graduationData)
    setLoading(false)
  }, [])

  const { traces, layout } = useMemo(() => {
    if (!data) return { traces: [], layout: {} }
    const result = makeChart(category, data)
    console.log(`Chart for ${category}:`, result)
    return result
  }, [category, data])

  return (
    <div style={{ padding: 24, color: "#fff", background: "#0b0b0d", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
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
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Graduation Outcomes</h1>
      </div>

      {/* Main content */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
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
              Graduation outcomes by category. Overall shows a pie chart, Year shows trends, and others show grouped bars.
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
          }}>
            {loading && <div style={{ color: "#a1a1aa" }}>Loading chart…</div>}
            {!loading && data && traces.length > 0 && (
              <Plot 
                key={`graduation-${category}-${Date.now()}`}
                data={traces} 
                layout={{ ...layout, autosize: true }} 
                config={BASE_CONFIG} 
                style={{ width: "100%", height: "100%" }} 
                useResizeHandler 
              />
            )}
            {!loading && data && traces.length === 0 && (
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
              Graduation rate insights will appear here based on the selected category.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}