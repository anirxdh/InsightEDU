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
  { key: "chronically_absent", label: "Chronically Absent", type: "bars" },
  { key: "frp_eligible_flag", label: "FRP Eligible", type: "bars" },
  { key: "english_learner_flag", label: "English Learner", type: "bars" },
  { key: "special_education_flag", label: "Special Education", type: "bars" },
  { key: "gender", label: "Gender", type: "bars" },
  { key: "federal_race_code", label: "Race (Federal Code)", type: "bars" }
]

function valOrNull(v, masked) {
  if (masked) return null
  if (v === undefined || v === null) return null
  return v
}

function makeChart(category, data) {
  const meta = CATEGORY_META.find(m => m.key === category)
  if (!meta) return { traces: [], layout: {} }

  if (category === "overall") {
    const values = [data.overall.graduated, data.overall.not_graduated]
    const labels = ["Graduated (1)", "Not Graduated (0)"]
    const colors = [COLORS.graduated, COLORS.not_graduated]
    return {
      traces: [{
        type: "pie",
        labels, values,
        marker: { colors },
        hole: 0.25, sort: false, direction: "clockwise",
        hovertemplate: "%{label}: %{percent:.1%} <extra></extra>"
      }],
      layout: { ...BASE_LAYOUT, title: "Overall Graduation Outcome" }
    }
  }

  if (category === "year") {
    const rows = data.year
    const x = rows.map(r => r.label)
    const yG = rows.map(r => r.graduated)
    const yN = rows.map(r => r.not_graduated)
    return {
      traces: [
        {
          type: "scatter", mode: "lines+markers", name: "Graduated (1)",
          x, y: yG, marker: { color: COLORS.graduated },
          hovertemplate: "<b>%{x}</b><br>Graduated: %{y:.1%}<extra></extra>"
        },
        {
          type: "scatter", mode: "lines+markers", name: "Not Graduated (0)",
          x, y: yN, marker: { color: COLORS.not_graduated },
          hovertemplate: "<b>%{x}</b><br>Not Graduated: %{y:.1%}<extra></extra>"
        }
      ],
      layout: {
        ...BASE_LAYOUT,
        title: "Graduation Outcome Over Time",
        yaxis: { tickformat: ".0%", rangemode: "tozero" }
      }
    }
  }

  // default: grouped bars
  const rows = data[category] || []
  const x = rows.map(r => r.label)
  const yG = rows.map(r => valOrNull(r.graduated, r.masked))
  const yN = rows.map(r => valOrNull(r.not_graduated, r.masked))
  const textG = rows.map(r => (r.masked ? "small count (masked)" : (r.graduated ?? "")))
  const textN = rows.map(r => (r.masked ? "small count (masked)" : (r.not_graduated ?? "")))

  return {
    traces: [
      {
        type: "bar", name: "Graduated (1)",
        x, y: yG, text: textG, marker: { color: COLORS.graduated },
        hovertemplate: "<b>%{x}</b><br>Graduated: %{y:.1%}<br>%{text}<extra></extra>"
      },
      {
        type: "bar", name: "Not Graduated (0)",
        x, y: yN, text: textN, marker: { color: COLORS.not_graduated },
        hovertemplate: "<b>%{x}</b><br>Not Graduated: %{y:.1%}<br>%{text}<extra></extra>"
      }
    ],
    layout: {
      ...BASE_LAYOUT,
      title: CATEGORY_META.find(m => m.key === category)?.label || "Category",
      barmode: "group",
      yaxis: { tickformat: ".0%", rangemode: "tozero" }
    }
  }
}

export default function GraduationView() {
  const [category, setCategory] = useState("overall")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Using imported JSON data instead of API call
    // You can swap this with: const res = await fetch("/api/graduation_outcomes")
    setData(graduationData)
    setLoading(false)
  }, [])

  const { traces, layout } = useMemo(() => data ? makeChart(category, data) : { traces: [], layout: {} }, [category, data])

  return (
    <div className="graduation-view-container" style={{ padding: 24, color: "#fff", background: "#0b0b0d", minHeight: "100vh" }}>
      {/* Header row */}
      <div className="graduation-view-header" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button
          onClick={() => window.history.back()}
          aria-label="Back"
          style={{
            background: "transparent", color: "#fff", border: "1px solid #333",
            width: 40, height: 40, borderRadius: 8, cursor: "pointer"
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Graduation</h1>
      </div>

      {/* 2-column main area */}
      <div className="graduation-view-grid" style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24 }}>
        {/* Left column */}
        <div className="graduation-view-left-panel">
          {/* Description */}
          <div style={{
            border: "1px solid #2a2a32", borderRadius: 16, padding: 16, marginBottom: 16,
            background: "#16161a"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>About the data</h3>
            <p style={{ margin: 0, lineHeight: 1.5, color: "#c9c9d1" }}>
              This page shows graduation outcomes (1 = graduated, 0 = not graduated).
              Use the category list below to switch the visualization.
              <br />• <b>Overall</b>: pie chart
              <br />• <b>Year</b>: line chart (trend)
              <br />• Others: grouped bars by category
            </p>
          </div>

          {/* Filter/Category panel */}
          <div style={{
            border: "1px solid #2a2a32", borderRadius: 20, padding: 16,
            background: "#16161a"
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Categories</div>
            <div className="graduation-view-category-buttons" style={{ display: "grid", gap: 8 }}>
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
                      cursor: "pointer"
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right column: chart + analysis stacked */}
        <div className="graduation-view-right" style={{ display: "grid", gap: 16 }}>
          <div className="graduation-view-chart" style={{
            border: "1px solid #2a2a32", borderRadius: 16, padding: 8,
            background: "#16161a", height: 560, display: "flex",
            alignItems: "center", justifyContent: "center", overflow: "hidden"
          }}>
            {loading && <div style={{ color: "#a1a1aa" }}>Loading chart…</div>}
            {error && <div style={{ color: "salmon" }}>Failed to load: {error}</div>}
            {!loading && !error && data && (
              <Plot
                data={traces}
                layout={{ ...layout }}
                config={BASE_CONFIG}
                style={{ width: "100%", height: "100%", maxWidth: 1000 }}
                useResizeHandler
              />
            )}
          </div>

          {/* Analysis box now under the chart (right column) */}
          <div style={{
            border: "1px solid #2a2a32", borderRadius: 16,
            padding: 16, background: "#16161a"
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Analysis</div>
            <p style={{ margin: 0, color: "#c9c9d1" }}>
              Coming soon: add auto‑generated insights (e.g., "Graduation is lowest among EL (0.743) and highest for White (0.921)"), and highlight significant gaps.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
