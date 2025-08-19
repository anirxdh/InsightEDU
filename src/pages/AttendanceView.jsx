import React, { useEffect, useMemo, useState } from "react"
import Plot from "react-plotly.js"
import { CHART_COLORS, THEME } from "../utils/theme"
import GraphError from "../components/GraphError"
import { RACE_CODES } from "../utils/raceCodes"
import { SCHOOL_CODES } from "../utils/schoolCodes"

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

const ANALYSIS_SUMMARIES = [
  {
    "filter": "overall",
    "summary": "Overall chronic absenteeism rate is 29.6% across 10,620 students."
  },
  {
    "filter": "gender",
    "summary": "Males have a slightly higher absenteeism rate (30.5%) than females (28.7%)."
  },
  {
    "filter": "race",
    "summary": "Race code 2 has the highest absenteeism rate at 56.6%, followed by race code 5 (48.9%) and race code 4 (41.1%). Race code 6 has the lowest at 21.1%."
  },
  {
    "filter": "grade_group",
    "summary": "High school students show the highest absenteeism rate at 39.5%, followed by Secondary at 28.7%. Elementary students have the lowest at 22.9%."
  },
  {
    "filter": "school_id",
    "summary": "School 23 has the highest absenteeism rate at 64.9%, followed by School 42 (57.7%) and School 2 has the lowest at 14.1%."
  },
  {
    "filter": "trend",
    "summary": "Absenteeism peaked in 2021-22 at 37.7%, dipped sharply in 2020-21 to 18.5%, and has since remained near 30%."
  }
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
  const x = rows.map((r) => {
    if (category === "gender") return r.label === "0" ? "Female" : r.label === "1" ? "Male" : r.label
    if (category === "race") return RACE_CODES[String(r.label)] || r.label
    if (category === "school_id") return SCHOOL_CODES[String(r.label)] || `School ${r.label}`
    return r.label
  })
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
              Chronic absenteeism analysis using data from <b>2019-20 to 2023-24</b> academic years. This dataset shows the percentage of students missing a substantial portion of school and helps identify attendance patterns to support early intervention strategies for improved student engagement and academic success.
            </p>
            <div
              style={{
                marginTop: 10,
                padding: "8px 10px",
                borderRadius: 10,
                background: "#241313",
                border: "1px solid #7f1d1d",
                color: "#fecaca",
                fontSize: 13,
              }}
              role="note"
              aria-live="polite"
            >
              <span style={{ fontWeight: 700, color: "#ef4444" }}>Data update needed:</span> The chronic absenteeism dataset is pending updates/corrections and may not reflect final values.
            </div>
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
            {error && <GraphError message={`Failed to load: ${error}`} />}
            {!loading && !error && data && traces && traces.length > 0 && (
              <Plot key={`attendance-${category}`} data={traces} layout={{ ...layout }} config={BASE_CONFIG} style={{ width: "100%", height: "100%", maxWidth: 1000 }} useResizeHandler />
            )}
            {!loading && !error && (!data || !traces || traces.length === 0) && (
              <GraphError message="No data available for this category" />
            )}
          </div>

          {/* Analysis box */}
          <div style={{ border: "1px solid #2a2a32", borderRadius: 16, padding: 16, background: "#16161a" }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Analysis</div>
            <p style={{ margin: 0, color: "#c9c9d1", lineHeight: 1.6 }}>
              {ANALYSIS_SUMMARIES.find(summary => summary.filter === category)?.summary || 
                "This analysis shows chronic absenteeism patterns across different student groups, highlighting key trends and disparities in attendance rates."}
            </p>
            

          </div>
        </div>
      </div>
    </div>
  )
}


