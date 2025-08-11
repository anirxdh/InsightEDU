import React from "react"
import Plot from "react-plotly.js"
import "./Dashboard.css"
import { CHART_COLORS, THEME } from "../../utils/theme"

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

function OverallDonut({ percent }) {
  const values = [percent, 1 - percent]
  const labels = ["Chronic Absentee", "Not Chronic"]
  const colors = [COLORS.primary, COLORS.secondary]

  return (
    <div className="chart-container">
      <Plot
        data={[
          {
            type: "pie",
            labels,
            values,
            marker: { colors },
            hole: 0.45,
            sort: false,
            direction: "clockwise",
            hovertemplate: "%{label}: %{percent:.1%} <extra></extra>",
          },
        ]}
        layout={{ ...BASE_LAYOUT, title: "Overall Chronic Absenteeism" }}
        config={BASE_CONFIG}
        style={{ width: "100%", height: 360, maxWidth: "100%" }}
        useResizeHandler
      />
    </div>
  )
}

function CategoryBarsSingle({ title, rows }) {
  const x = rows.map((r) => r.label)
  const y = rows.map((r) => r.percent)
  const text = rows.map((r) => (r.count != null ? `n=${r.count}` : ""))

  return (
    <div className="chart-container">
      <Plot
        data={[
          {
            type: "bar",
            name: "% Chronic",
            x,
            y,
            text,
            marker: { color: COLORS.primary },
            hovertemplate:
              "<b>%{x}</b><br>% Chronic: %{y:.1%}<br>%{text}<extra></extra>",
          },
        ]}
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

function TrendLine({ rows }) {
  const x = rows.map((r) => r.label)
  const y = rows.map((r) => r.percent)

  return (
    <div className="chart-container">
      <Plot
        data={[
          {
            type: "scatter",
            mode: "lines+markers",
            name: "% Chronic",
            x,
            y,
            marker: { color: COLORS.primary },
            hovertemplate: "<b>%{x}</b><br>% Chronic: %{y:.1%}<extra></extra>",
          },
        ]}
        layout={{
          ...BASE_LAYOUT,
          title: "Chronic Absenteeism Trend",
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

export default function ChronicAbsenteeismDashboard({ data }) {
  if (!data) return null

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Chronic Absenteeism Dashboard</h1>
        <p>Percent chronically absent across demographics, schools, and over time</p>
      </div>

      <div className="dashboard-content">
        <OverallDonut percent={data.overall.percent} />

        <div className="charts-grid">
          <CategoryBarsSingle title="By Gender" rows={data.gender} />
          <CategoryBarsSingle title="By Race (Code)" rows={data.race} />
          <CategoryBarsSingle title="By Grade Group" rows={data.grade_group} />
          <CategoryBarsSingle title="By School" rows={data.school_id} />
          <TrendLine rows={data.trend} />
        </div>
      </div>
    </div>
  )
}


