import React from "react"
import Plot from "react-plotly.js"
import "./Dashboard.css"
import { CHART_COLORS, THEME } from "../../utils/theme"

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

/** Safely pull value; if masked/null, return null so Plotly skips the point */
function valOrNull(v, masked) {
  if (masked) return null
  if (v === undefined || v === null) return null
  return v
}

/** ---------- Chart builders ---------- **/

function OverallPie({ data }) {
  const values = [data.overall.graduated, data.overall.not_graduated]
  const labels = ["Graduated (1)", "Not Graduated (0)"]
  const colors = [COLORS.graduated, COLORS.not_graduated]

  return (
    <div className="chart-container">
      <Plot
        data={[
          {
            type: "pie",
            labels,
            values,
            marker: { colors },
            hole: 0.25,
            sort: false,
            direction: "clockwise",
            hovertemplate: "%{label}: %{percent:.1%} <extra></extra>",
          },
        ]}
        layout={{ ...BASE_LAYOUT, title: "Overall Graduation Outcome" }}
        config={BASE_CONFIG}
        style={{ width: "100%", height: 560, maxWidth: "100%" }}
        useResizeHandler
      />
    </div>
  )
}

function CategoryBars({ title, rows }) {
  const x = rows.map((r) => r.label)

  // graduated series
  const yG = rows.map((r) => valOrNull(r.graduated, r.masked))
  const textG = rows.map((r) =>
    r.masked ? "small count (masked)" : (r.graduated ?? "")
  )

  // not_graduated series
  const yN = rows.map((r) => valOrNull(r.not_graduated, r.masked))
  const textN = rows.map((r) =>
    r.masked ? "small count (masked)" : (r.not_graduated ?? "")
  )

  const traces = [
    {
      type: "bar",
      name: "Graduated (1)",
      x,
      y: yG,
      text: textG,
      texttemplate: "%{text}",
      textposition: "auto",
      marker: { color: COLORS.graduated },
      hovertemplate:
        "<b>%{x}</b><br>Graduated: %{y:.1%}<br>%{text}<extra></extra>",
    },
    {
      type: "bar",
      name: "Not Graduated (0)",
      x,
      y: yN,
      text: textN,
      texttemplate: "%{text}",
      textposition: "auto",
      marker: { color: COLORS.not_graduated },
      hovertemplate:
        "<b>%{x}</b><br>Not Graduated: %{y:.1%}<br>%{text}<extra></extra>",
    },
  ]

  return (
    <div className="chart-container">
      <Plot
        data={traces}
        layout={{
          ...BASE_LAYOUT,
          title,
          barmode: "group",
          bargap: 0.2,
          yaxis: { ...BASE_LAYOUT.yaxis, tickformat: ".0%", rangemode: "tozero" },
          xaxis: { ...BASE_LAYOUT.xaxis },
        }}
        config={BASE_CONFIG}
        style={{ width: "100%", height: 360, maxWidth: "100%" }}
        useResizeHandler
      />
    </div>
  )
}

function YearLines({ rows }) {
  const x = rows.map((r) => r.label)
  const yG = rows.map((r) => r.graduated)
  const yN = rows.map((r) => r.not_graduated)

  const traces = [
    {
      type: "scatter",
      mode: "lines+markers",
      name: "Graduated (1)",
      x,
      y: yG,
      marker: { color: COLORS.graduated },
      hovertemplate:
        "<b>%{x}</b><br>Graduated: %{y:.1%}<extra></extra>",
    },
    {
      type: "scatter",
      mode: "lines+markers",
      name: "Not Graduated (0)",
      x,
      y: yN,
      marker: { color: COLORS.not_graduated },
      hovertemplate:
        "<b>%{x}</b><br>Not Graduated: %{y:.1%}<extra></extra>",
    },
  ]

  return (
    <div className="chart-container">
      <Plot
        data={traces}
        layout={{
          ...BASE_LAYOUT,
          title: "Graduation Outcome Over Time",
          yaxis: { ...BASE_LAYOUT.yaxis, tickformat: ".0%", rangemode: "tozero" },
          xaxis: { ...BASE_LAYOUT.xaxis },
        }}
        config={BASE_CONFIG}
        style={{ width: "100%", height: 360, maxWidth: "100%" }}
        useResizeHandler
      />
    </div>
  )
}

/** ---------- Main wrapper ---------- **/

/**
 * Props:
 *  - data: the JSON you pasted earlier (with keys:
 *      overall, chronically_absent, english_learner_flag, frp_eligible_flag,
 *      gender, federal_race_code, special_education_flag, year)
 */
export default function GraduationOutcomesDashboard({ data }) {
  if (!data) return null

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Graduation Outcomes Dashboard</h1>
        <p>Comprehensive analysis of graduation rates across different student demographics and time periods</p>
      </div>
      
      <div className="dashboard-content">
        <OverallPie data={data} />

        <div className="charts-grid">
          <CategoryBars
            title="Chronically Absent vs Graduation"
            rows={data.chronically_absent}
          />
          <CategoryBars
            title="FRP Eligibility vs Graduation"
            rows={data.frp_eligible_flag}
          />
          <CategoryBars
            title="English Learner Flag vs Graduation"
            rows={data.english_learner_flag}
          />
          <CategoryBars
            title="Gender vs Graduation"
            rows={data.gender}
          />
          <CategoryBars
            title="Special Education vs Graduation"
            rows={data.special_education_flag}
          />
          <CategoryBars
            title="Race (Federal Code) vs Graduation"
            rows={data.federal_race_code}
          />
          <YearLines rows={data.year} />
        </div>
      </div>
    </div>
  )
}
