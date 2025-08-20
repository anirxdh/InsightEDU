import React, { useEffect, useMemo, useState } from "react"
import Plot from "react-plotly.js"
import { CHART_COLORS, THEME } from "../utils/theme"
import GraphError from "../components/GraphError"
import { RACE_CODES } from "../utils/raceCodes"

import gpaDataRaw from "../data/final_agg_gpa.json"

const CATEGORY_COLORS = [CHART_COLORS.primary, "#a78bfa", "#c4b5fd", "#581c87"]

const BASE_LAYOUT = {
  paper_bgcolor: THEME.background,
  plot_bgcolor: THEME.background,
  font: { color: THEME.text },
  margin: { t: 56, r: 24, b: 56, l: 56 },
  hovermode: "closest",
  legend: { orientation: "h", x: 0, y: 1.1 },
  xaxis: { type: "category", gridcolor: THEME.grid, zerolinecolor: THEME.grid },
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

const ANALYSIS_SUMMARIES = [
  {
    filter: "Overall",
    summary: "Across all students, most have high GPAs, with 61.8% in the 4–3 range and 29.8% in the 3–2 range. Only 8% are in the 2–1 range, and fewer than 1% have below 1 GPA."
  },
  {
    filter: "Chronically Absent",
    summary: "Students who are not chronically absent perform much better academically, with 74.4% having GPAs between 4–3, compared to only 35.6% of chronically absent students. Chronically absent students are far more likely to be in the lower GPA ranges."
  },
  {
    filter: "Gender",
    summary: "Female students outperform male students overall, with 72.5% of females in the 4–3 GPA range compared to 56.3% of males."
  },
  {
    filter: "Grade",
    summary: "GPA distribution is fairly consistent across grades 10–12, with about 60–63% of students in each grade having GPAs in the 4–3 range. Lower GPA rates increase slightly in higher grades."
  },
  {
    filter: "Race",
    summary: `Race groups show notable GPA disparities. For example, ${RACE_CODES["6"]} has the highest share (78.4%) of students in the 4–3 GPA range, while ${RACE_CODES["1"]} has less than half (44.3%) in this range and a higher proportion in lower GPAs.`
  },
  {
    filter: "Year",
    summary: "From 2017 to 2021, the percentage of students in the top GPA band (4–3) increased from 57.3% to 66.1%, while the share in lower ranges steadily declined."
  }
]

const GPA_BUCKET_ORDER = ["<1 gpa", "2-1 gpa", "3-2 gpa", "4-3 gpa"]

function sortedItemsByBucket(items) {
  const byBucket = new Map(items.map(i => [i.Category, i]))
  return GPA_BUCKET_ORDER.map(bucket => byBucket.get(bucket) || { Category: bucket, Percent: 0, Count: 0 })
}

function getSortedGroupKeys(category, groupMap) {
  const keys = Object.keys(groupMap)
  if (category === "Year") return keys.sort((a, b) => Number(a) - Number(b))
  if (category === "Grade") return keys.sort((a, b) => Number(a) - Number(b))
  if (category === "Gender") {
    const order = { "Female": 0, "Male": 1 }
    return keys.sort((a, b) => (order[a] ?? 99) - (order[b] ?? 99))
  }
  if (category === "Chronically Absent") {
    const order = { "Not chronically absent": 0, "Chronically absent": 1 }
    return keys.sort((a, b) => (order[a] ?? 99) - (order[b] ?? 99))
  }
  if (category === "Race") return keys.sort((a, b) => Number(a) - Number(b))
  return keys
}

function displayNameFor(category, key) {
  if (category === "Race") return RACE_CODES[String(key)] || String(key)
  return String(key)
}

function buildStackedFromGroupMap(groupMap, category) {
  const rawGroupKeys = getSortedGroupKeys(category, groupMap)
  const groupNames = rawGroupKeys.map((k) => displayNameFor(category, k))

  const traces = GPA_BUCKET_ORDER.map((bucket, idx) => ({
    type: "bar",
    name: bucket,
    x: groupNames,
    y: rawGroupKeys.map((gk) => {
      const items = sortedItemsByBucket(groupMap[gk] || [])
      const found = items.find(i => i.Category === bucket)
      return found ? Number(found.Percent) : 0
    }),
    customdata: rawGroupKeys.map((gk) => {
      const items = sortedItemsByBucket(groupMap[gk] || [])
      const found = items.find(i => i.Category === bucket)
      if (!found) return ""
      if (found.Count && found.Count !== "small count") return `n=${found.Count}`
      if (found.Count === "small count") return "n=too small"
      return ""
    }),
    marker: { color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] },
    hovertemplate: `<b>%{x}</b><br>${bucket}: %{y:.1%}<br>%{customdata}<extra></extra>`,
  }))

  return { traces }
}

function makeChart(category, data) {
  const meta = CATEGORY_META.find((m) => m.key === category)
  if (!meta) return { traces: [], layout: {} }

  if (meta.type === "donut") {
    const items = sortedItemsByBucket((data[category]?.All) || [])
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
            if (i.Count && i.Count !== "small count") return `n=${i.Count}`
            if (i.Count === "small count") return "n=too small"
            return ""
          }),
          hovertemplate: `%{label}: %{percent:.1%}<br>%{customdata}<extra></extra>`,
        },
      ],
      layout: { ...BASE_LAYOUT, title: "Overall GPA Distribution" },
    }
  }

  if (meta.type === "stacked") {
    const groupMap = data[category] || {}
    const { traces } = buildStackedFromGroupMap(groupMap, category)
    return {
      traces,
      layout: {
        ...BASE_LAYOUT,
        title: meta.label,
        barmode: "stack",
        yaxis: { tickformat: ".0%", rangemode: "tozero", range: [0, 1] },
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
    try {
      setData(gpaDataRaw)
      setLoading(false)
    } catch (e) {
      setError(String(e))
    }
  }, [])

  const { traces, layout } = useMemo(
    () => (data ? makeChart(category, data) : { traces: [], layout: {} }),
    [category, data]
  )

  return (
    <div style={{ 
      padding: 24, 
      color: "#fff", 
      background: "#0b0b0d", 
      minHeight: "100vh",
      maxWidth: "100vw",
      overflowX: "hidden"
    }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 12, 
        marginBottom: 12,
        flexWrap: "wrap"
      }}>
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
        }}>GPA</h1>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "360px 1fr", 
        gap: 24,
        maxWidth: "100%"
      }}>
        <div>
          <div style={{ 
            border: "1px solid #2a2a32", 
            borderRadius: 16, 
            padding: 16, 
            marginBottom: 16, 
            background: "#16161a" 
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>About the data</h3>
            <p style={{ margin: 0, lineHeight: 1.5, color: "#c9c9d1" }}>
              GPA distribution analysis using data from <b>2017 to 2021</b>. This dataset shows the proportion of students across GPA bands and how distribution varies by year, demographics, and attendance.
            </p>
          </div>

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
            {error && <GraphError message={`Failed to load: ${error}`} />}
            {!loading && !error && data && traces && traces.length > 0 && (
              <Plot 
                key={`gpa-${category}`} 
                data={traces} 
                layout={{ ...BASE_LAYOUT, ...layout }} 
                config={BASE_CONFIG} 
                style={{ width: "100%", height: "100%" }} 
                useResizeHandler 
              />
            )}
            {!loading && !error && (!data || !traces || traces.length === 0) && (
              <GraphError message="No data available for this category" />
            )}
          </div>

          <div style={{ 
            border: "1px solid #2a2a32", 
            borderRadius: 16, 
            padding: 16, 
            background: "#16161a" 
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Analysis</div>
            <p style={{ margin: 0, color: "#c9c9d1", lineHeight: 1.6 }}>
              {ANALYSIS_SUMMARIES.find(summary => summary.filter === category)?.summary || 
                "This analysis shows GPA distribution patterns across different student groups, highlighting key trends and disparities across GPA bands."}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: 360px 1fr"] {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          div[style*="grid-template-columns: 360px 1fr"] > div:first-child {
            order: 2;
          }
          
          div[style*="grid-template-columns: 360px 1fr"] > div:last-child {
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

          /* Reduce donut chart size slightly on mobile */
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
          
          div[style*="grid-template-columns: 360px 1fr"] {
            gap: 12px !important;
          }

          /* Reduce donut chart size slightly on small mobile */
          div[style*="height: 560px"] .js-plotly-plot {
            transform: scale(0.85) !important;
            transform-origin: center center !important;
          }
        }
      `}</style>
    </div>
  )
}


