import React, { useEffect, useMemo, useState } from "react"
import Plot from "react-plotly.js"
import { CHART_COLORS, THEME } from "../utils/theme"
import GraphError from "../components/GraphError"
import demoDataRaw from "../data/final_agg_demo.json"
import { RACE_CODES } from "../utils/raceCodes"
import { SCHOOL_CODES } from "../utils/schoolCodes"

const CATEGORY_COLORS = [
  "#c4b5fd", // 1
  "#ddd6fe", // 2
  "#a78bfa", // 3
  "#7c3aed", // 4
  "#6d28d9", // 5
  "#8b5cf6", // 6
  "#581c87", // 7
]

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
  { key: "Overall", label: "Overall", type: "donut" },
  { key: "Year", label: "Year (stacked %)", type: "stacked" },
  { key: "Gender", label: "Gender (stacked %)", type: "stacked" },
  { key: "Grade Group", label: "Grade Group (stacked %)", type: "stacked" },
  { key: "School Number", label: "School (stacked %)", type: "stacked" },
]

const ANALYSIS_SUMMARIES = [
  {
    "filter": "Overall",
    "summary": "Across all students, race code 6 represents the largest share at 38.8%, followed by race code 4 at 29.4% and race code 1 at 18.4%. Codes 3, 7, and 2 each make up less than 8% combined."
  },
  {
    "filter": "Chronic Absenteeism",
    "summary": "Among non-chronically absent students, race code 6 is the most common (44.6%) followed by race code 4 (25.5%). For chronically absent students, race code 4 dominates at 35.6% with race code 6 falling to 29.2%."
  },
  {
    "filter": "FRP",
    "summary": "In the Free category, race code 4 is highest at 48.5%, followed by code 1 (21.4%) and code 6 (16.6%). In Reduced, code 1 leads (34.1%), while in Standard, code 6 dominates (50.7%)."
  },
  {
    "filter": "Gender",
    "summary": "Both genders show similar patterns—race code 6 is most prevalent (37.1% for females, 40.2% for males), followed by code 4 (30.5% for females, 28.5% for males) and code 1 (~18% for both)."
  },
  {
    "filter": "Grade Group",
    "summary": "Across grade groups, race code 6 is consistently highest: 38.0% in Elementary, 40.4% in High School, and 35.6% in Secondary. Race code 4 remains second in all groups."
  },
  {
    "filter": "School Number",
    "summary": "Race distribution varies widely by school. For example, School 8 is heavily race code 6 (66.2%), while School 2 also leans heavily toward code 6 (60.6%). School 14 is more balanced between codes 4 (40.1%) and 6 (34.7%)."
  },
  {
    "filter": "Year",
    "summary": "Race code 6 remains the largest group across all years, ranging from 36.7% to 40.9%. Race code 4 consistently holds second place, between 27.3% and 30.9%."
  }
]

function percentByCategory(items, categoryId) {
  const found = (items || []).find((x) => String(x.Category) === String(categoryId))
  return found ? Number(found.Percent) : 0
}

function buildStackedFromGroupMap(groupMap, category) {
  const rawGroupKeys = Object.keys(groupMap)
  const groupNames = rawGroupKeys.map((g) => {
    if (category === "School Number") return SCHOOL_CODES[String(g)] || `School ${g}`
    return g
  })
  const categoryIds = [1, 2, 3, 4, 5, 6, 7]

  const traces = categoryIds.map((catId, idx) => ({
    type: "bar",
    name: RACE_CODES[String(catId)] || `Code ${catId}`,
    x: groupNames,
    y: rawGroupKeys.map((gk) => percentByCategory(groupMap[gk], catId)),
    customdata: rawGroupKeys.map((gk) => {
      const found = (groupMap[gk] || []).find((x) => String(x.Category) === String(catId))
      if (!found) return ""
      if (found.Count && found.Count !== "small count") return `n=${found.Count}`
      if (found.Count === "small count") return "n=too small"
      return ""
    }),
    marker: { color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] },
    hovertemplate: `<b>%{x}</b><br>${RACE_CODES[String(catId)] || `Code ${catId}`}: %{y:.1%}<br>%{customdata}<extra></extra>`,
  }))

  return { traces }
}

function makeChart(category, data) {
  const meta = CATEGORY_META.find((m) => m.key === category)
  if (!meta) return { traces: [], layout: {} }

  if (meta.type === "donut") {
    const items = data[category] || []
    const labels = items.map((i) => RACE_CODES[String(i.Category)] || String(i.Category))
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
      layout: { ...BASE_LAYOUT, title: "Overall Demographic Distribution" },
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
        yaxis: { tickformat: ".0%", rangemode: "tozero" },
      },
    }
  }

  return { traces: [], layout: {} }
}

export default function DemographicsView() {
  const [category, setCategory] = useState("Overall")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      setData(demoDataRaw)
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
        }}>Demographics</h1>
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
              Demographic distribution analysis using data from <b>2019-20 to 2023-24</b> academic years. This dataset provides insights into the student population composition across various institutional and demographic factors to support equitable resource allocation and program planning.
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
                key={`demo-${category}`} 
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
                "This analysis shows demographic distribution patterns across different student groups, highlighting population composition and representation trends."}
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

          /* Better donut chart layout for mobile */
          div[style*="height: 560px"] .js-plotly-plot {
            transform: scale(0.85) !important;
            transform-origin: center center !important;
            margin-top: 50px !important;
            margin-bottom: 20px !important;
          }
          
          /* Ensure chart container has enough space */
          div[style*="height: 560px"] {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 30px 10px !important;
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

          /* Better donut chart layout for small mobile */
          div[style*="height: 560px"] .js-plotly-plot {
            transform: scale(0.8) !important;
            transform-origin: center center !important;
            margin-top: 40px !important;
            margin-bottom: 15px !important;
          }
          
          /* Ensure chart container has enough space */
          div[style*="height: 560px"] {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 25px 8px !important;
          }
        }
      `}</style>
    </div>
  )
}


