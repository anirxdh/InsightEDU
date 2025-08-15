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
  { key: "Race", label: "Race (Code) (GPA % stack)", type: "stacked" },
  { key: "Chronically Absent", label: "Chronically Absent (GPA % stack)", type: "stacked" },
]

const ANALYSIS_SUMMARIES = [
  {
    "filter": "Overall",
    "summary": "Across all students, most have high GPAs, with 61.8% in the 4–3 range and 29.8% in the 3–2 range. Only 8% are in the 2–1 range, and fewer than 1% have below 1 GPA."
  },
  {
    "filter": "Chronically Absent",
    "summary": "Students who are not chronically absent perform much better academically, with 74.4% having GPAs between 4–3, compared to only 35.6% of chronically absent students. Chronically absent students are far more likely to be in the lower GPA ranges."
  },
  {
    "filter": "Gender",
    "summary": "Female students outperform male students overall, with 72.5% of females in the 4–3 GPA range compared to 56.3% of males."
  },
  {
    "filter": "Grade",
    "summary": "GPA distribution is fairly consistent across grades 10–12, with about 60–63% of students in each grade having GPAs in the 4–3 range. Lower GPA rates increase slightly in higher grades."
  },
  {
    "filter": "Race",
    "summary": "Race groups show notable GPA disparities. For example, race code 6 has the highest share (78.4%) of students in the 4–3 GPA range, while race code 1 has less than half (44.3%) in this range and a higher proportion in lower GPAs."
  },
  {
    "filter": "Year",
    "summary": "From 2017 to 2021, the percentage of students in the top GPA band (4–3) increased from 57.3% to 66.1%, while the share in lower ranges steadily declined."
  }
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
    customdata: groupNames.map((g) => {
      const items = sortAndMap(groupMap[g] || [])
      const found = items.find((i) => i.Category === bucket)
      return found && found.Count && found.Count !== "small count" ? `n=${found.Count}` : ""
    }),
    hovertemplate: `<b>%{x}</b><br>${bucket}: %{y:.1%}<br>%{customdata}<extra></extra>`,
  }))
  return { traces }
}

function makeChart(category, data) {
  const meta = CATEGORY_META.find((m) => m.key === category)
  if (!meta) return { traces: [], layout: {} }

  if (meta.type === "donut") {
    // Create Overall data from Gender data since it's missing from the JSON
    let overallData
    if (category === "Overall" && !data[category]) {
      const genderData = data["Gender"] || {}
      const fData = genderData["F"] || []
      const mData = genderData["M"] || []
      
      // Combine F and M data to create overall percentages
      const combined = {}
      GPA_BUCKET_ORDER.forEach(bucket => {
        const fItem = fData.find(item => item.Category === bucket)
        const mItem = mData.find(item => item.Category === bucket)
        const fPercent = fItem ? Number(fItem.Percent) : 0
        const mPercent = mItem ? Number(mItem.Percent) : 0
        // Simple average for overall
        combined[bucket] = (fPercent + mPercent) / 2
      })
      
      overallData = { All: Object.entries(combined).map(([Category, Percent]) => ({ Category, Percent })) }
    } else {
      overallData = data[category] || {}
    }
    
    const items = sortAndMap(overallData.All || [])
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
          customdata: items.map((i) => {
            // For overall, we don't have individual counts, so we'll show a note
            return i.Count && i.Count !== "small count" ? `n=${i.Count}` : ""
          }),
          hovertemplate: "%{label}: %{percent:.1%}<br>%{customdata}<extra></extra>",
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
        yaxis: { tickformat: ".0%", rangemode: "tozero", range: [0, 1] } 
      },
    }
  }

  return { traces: [], layout: {} }
}

export default function GPAView() {
  const [category, setCategory] = useState("Overall")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

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
              GPA distribution analysis using data from <b>2017 to 2021</b> academic years. This dataset examines student academic performance across different demographic and institutional factors to understand achievement patterns and identify areas for improvement.
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
            {!loading && data && traces.length > 0 && (
              <Plot 
                key={`gpa-${category}`}
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

          {/* Analysis box */}
          <div style={{ border: "1px solid #2a2a32", borderRadius: 16, padding: 16, background: "#16161a" }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Analysis</div>
            <p style={{ margin: 0, color: "#c9c9d1", lineHeight: 1.6 }}>
              {ANALYSIS_SUMMARIES.find(summary => summary.filter === category)?.summary || 
                "This analysis shows GPA distribution patterns across different student groups, highlighting key trends in academic performance and achievement gaps."}
            </p>
            

          </div>
        </div>
      </div>
    </div>
  )
}