import React, { useEffect, useMemo, useState } from "react"
import Plot from "react-plotly.js"
import { CHART_COLORS, THEME } from "../utils/theme"
import gpaDataRaw from "../data/final_agg_gpa.json"

const CATEGORY_COLORS = [CHART_COLORS.primary, "#a78bfa", "#c4b5fd", "#581c87"]

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
  modeBarButtonsToRemove: ["select2d", "lasso2d"] 
}

const CATEGORY_META = [
  { key: "Overall", label: "Overall GPA distribution", type: "donut" },
  { key: "Year", label: "Year (GPA % stack)", type: "stacked" },
  { key: "Gender", label: "Gender (GPA % stack)", type: "stacked" },
  { key: "Grade", label: "Grade (GPA % stack)", type: "stacked" },
  { key: "Race", label: "Race (GPA % stack)", type: "stacked" },
  { key: "Chronically Absent", label: "Chronically Absent (GPA % stack)", type: "stacked" },
]

const GPA_BUCKET_ORDER = ["<1 gpa", "2-1 gpa", "3-2 gpa", "4-3 gpa"]

function sortAndMap(items) {
  const order = new Map(GPA_BUCKET_ORDER.map((k, i) => [k, i]))
  const sorted = [...(items || [])].sort((a, b) => (order.get(a.Category) ?? 99) - (order.get(b.Category) ?? 99))
  return sorted
}

function buildStacked(groupMap) {
  const groupNames = Object.keys(groupMap)
  const traces = GPA_BUCKET_ORDER.map((bucket, idx) => ({
    type: "bar",
    name: bucket,
    x: groupNames,
    y: groupNames.map((g) => {
      const items = sortAndMap(groupMap[g] || [])
      const found = items.find((i) => i.Category === bucket)
      const value = found ? Number(found.Percent) : 0
      return value
    }),
    text: groupNames.map((g) => {
      const items = sortAndMap(groupMap[g] || [])
      const found = items.find((i) => i.Category === bucket)
      const value = found ? Number(found.Percent) : 0
      return `${Math.round(value * 100)}%`
    }),
    texttemplate: "%{text}",
    textposition: "auto",
    marker: { color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] },
    hovertemplate: `<b>%{x}</b><br>${bucket}: %{y:.1%}<extra></extra>`,
  }))
  return { traces }
}

function makeChart(category, data) {
  const meta = CATEGORY_META.find((m) => m.key === category)
  if (!meta) return { traces: [], layout: {} }

  if (meta.type === "donut") {
    const items = sortAndMap((data[category] || {}).All || [])
    const labels = items.map((i) => i.Category)
    const values = items.map((i) => Number(i.Percent))
    return {
      traces: [
        {
          type: "pie",
          labels,
          values,
          marker: { colors: labels.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]) },
          hole: 0.45,
          sort: false,
          direction: "clockwise",
          hovertemplate: "%{label}: %{percent:.1%} <extra></extra>",
        },
      ],
      layout: { ...BASE_LAYOUT, title: "Overall GPA Distribution" },
    }
  }

  if (meta.type === "stacked") {
    const groupMap = data[category] || {}
    const { traces } = buildStacked(groupMap)
    return {
      traces,
      layout: { 
        ...BASE_LAYOUT, 
        title: meta.label, 
        barmode: "stack", 
        yaxis: { tickformat: ".0%", rangemode: "tozero" } 
      },
    }
  }

  return { traces: [], layout: {} }
}

export default function GPAView() {
  const [category, setCategory] = useState("Overall")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setData(gpaDataRaw)
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
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>GPA Distribution</h1>
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
              GPA distribution across different groups. Overall shows a donut chart, and others show 100% stacked bars by GPA buckets.
              <br />• <b>Overall</b>: donut chart
              <br />• Others: 100% stacked bars by GPA ranges
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
              <Plot key={`gpa-${category}`} data={traces} layout={{ ...layout }} config={BASE_CONFIG} style={{ width: "100%", height: "100%", maxWidth: 1000 }} useResizeHandler />
            )}
          </div>

          {/* Analysis box */}
          <div style={{ border: "1px solid #2a2a32", borderRadius: 16, padding: 16, background: "#16161a" }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Analysis</div>
            <p style={{ margin: 0, color: "#c9c9d1" }}>
              Coming soon: insights about GPA trends and distributions across different student groups.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}