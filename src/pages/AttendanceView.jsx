import React, { useEffect, useMemo, useState } from "react"
import Plot from "react-plotly.js"
import { CHART_COLORS, THEME } from "../utils/theme"
import chronicData from "../data/chronicAbsenteeism.json"

const COLORS = {
  primary: CHART_COLORS.primary,
  secondary: CHART_COLORS.secondary,
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
  { key: "trend", label: "Year (timeline)", type: "line" },
  { key: "gender", label: "Gender", type: "bars-single" },
  { key: "race", label: "Race (Code)", type: "bars-single" },
  { key: "grade_group", label: "Grade Group", type: "bars-single" },
  { key: "school_id", label: "School", type: "bars-single" },
]

function makeChart(category, data) {
  const meta = CATEGORY_META.find((m) => m.key === category)
  if (!meta) return { traces: [], layout: {} }

  if (category === "overall") {
    const percent = data.overall.percent
    const labels = ["Chronic Absentee", "Not Chronic"]
    const values = [percent, 1 - percent]
    return {
      traces: [
        {
          type: "pie",
          labels,
          values,
          marker: { colors: [COLORS.primary, COLORS.secondary] },
          hole: 0.45,
          sort: false,
          direction: "clockwise",
          hovertemplate: `%{label}: %{percent:.1%}<br>total n=${data.overall.count} <extra></extra>`,
        },
      ],
      layout: { ...BASE_LAYOUT, title: "Overall Chronic Absenteeism", annotations: [
        { text: `n=${data.overall.count}`, x: 0.5, y: 0.5, font: { color: THEME.text }, showarrow: false }
      ] },
    }
  }

  if (category === "trend") {
    const rows = data.trend
    const x = rows.map((r) => r.label)
    const y = rows.map((r) => r.percent)
    return {
      traces: [
        {
          type: "scatter",
          mode: "lines+markers",
          name: "% Chronic",
          x,
          y,
          marker: { color: COLORS.primary },
          hovertemplate: "<b>%{x}</b><br>% Chronic: %{y:.1%}<extra></extra>",
        },
      ],
      layout: {
        ...BASE_LAYOUT,
        title: "Chronic Absenteeism Over Time",
        yaxis: { tickformat: ".0%", rangemode: "tozero" },
      },
    }
  }

  // default: single-series bars using percent
  const rows = data[category] || []
  const x = rows.map((r) => r.label)
  const y = rows.map((r) => r.percent)
  const labelText = rows.map((r) => `${Math.round((r.percent || 0) * 100)}%`)
  const hoverDetails = rows.map((r) => (r.count != null ? `n=${r.count}` : ""))

  return {
    traces: [
      {
        type: "bar",
        name: "% Chronic",
        x,
        y,
        text: labelText,
        texttemplate: "%{text}",
        textposition: "auto",
        customdata: hoverDetails,
        marker: { color: COLORS.primary },
        hovertemplate: "<b>%{x}</b><br>% Chronic: %{y:.1%}<br>%{customdata}<extra></extra>",
      },
    ],
    layout: {
      ...BASE_LAYOUT,
      title: CATEGORY_META.find((m) => m.key === category)?.label || "Category",
      barmode: "group",
      yaxis: { tickformat: ".0%", rangemode: "tozero" },
    },
  }
}

export default function AttendanceView() {
  const [category, setCategory] = useState("overall")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setData(chronicData)
    setLoading(false)
  }, [])

  const { traces, layout } = useMemo(
    () => (data ? makeChart(category, data) : { traces: [], layout: {} }),
    [category, data]
  )

  return (
    <div className="graduation-view-container" style={{ padding: 24, color: "#fff", background: "#0b0b0d", minHeight: "100vh" }}>
      {/* Header row */}
      <div className="graduation-view-header" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button
          onClick={() => window.history.back()}
          aria-label="Back"
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
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Attendance (Chronic Absenteeism)</h1>
      </div>

      {/* 2-column main area */}
      <div className="graduation-view-grid" style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24 }}>
        {/* Left column */}
        <div className="graduation-view-left-panel">
          {/* Description */}
          <div
            style={{
              border: "1px solid #2a2a32",
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              background: "#16161a",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>About the data</h3>
            <p style={{ margin: 0, lineHeight: 1.5, color: "#c9c9d1" }}>
              This page shows chronic absenteeism percent (share of students missing a substantial portion of school).
              Use the category list below to switch the visualization.
              <br />• <b>Overall</b>: donut
              <br />• <b>Year</b>: trend line
              <br />• Others: single-series bars by category
            </p>
          </div>

          {/* Filter/Category panel */}
          <div style={{ border: "1px solid #2a2a32", borderRadius: 20, padding: 16, background: "#16161a" }}>
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

        {/* Right column: chart + analysis stacked */}
        <div className="graduation-view-right" style={{ display: "grid", gap: 16 }}>
          <div
            className="graduation-view-chart"
            style={{
              border: "1px solid #2a2a32",
              borderRadius: 16,
              padding: 8,
              background: "#16161a",
              height: 560,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {loading && <div style={{ color: "#a1a1aa" }}>Loading chart…</div>}
            {error && <div style={{ color: "salmon" }}>Failed to load: {error}</div>}
            {!loading && !error && data && (
              <Plot key={`attendance-${category}`} data={traces} layout={{ ...layout }} config={BASE_CONFIG} style={{ width: "100%", height: "100%", maxWidth: 1000 }} useResizeHandler />
            )}
          </div>

          {/* Analysis box */}
          <div style={{ border: "1px solid #2a2a32", borderRadius: 16, padding: 16, background: "#16161a" }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Analysis</div>
            <p style={{ margin: 0, color: "#c9c9d1" }}>
              Coming soon: insights such as groups with highest chronic absenteeism and trend changes year over year.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


