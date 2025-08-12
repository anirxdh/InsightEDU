import React, { useEffect, useMemo, useState } from "react"
import Plot from "react-plotly.js"
import { CHART_COLORS, THEME } from "../utils/theme"
import demoDataRaw from "../data/final_agg_demo.json"

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

function percentByCategory(items, categoryId) {
  const found = (items || []).find((x) => String(x.Category) === String(categoryId))
  return found ? Number(found.Percent) : 0
}

function buildStackedFromGroupMap(groupMap) {
  const groupNames = Object.keys(groupMap)
  const categoryIds = [1, 2, 3, 4, 5, 6, 7]

  const traces = categoryIds.map((catId, idx) => ({
    type: "bar",
    name: `Cat ${catId}`,
    x: groupNames,
    y: groupNames.map((g) => percentByCategory(groupMap[g], catId)),
    customdata: groupNames.map((g) => {
      const found = (groupMap[g] || []).find((x) => String(x.Category) === String(catId))
      return found && found.Count && found.Count !== "small count" ? `n=${found.Count}` : ""
    }),
    marker: { color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] },
    hovertemplate: `<b>%{x}</b><br>Cat ${catId}: %{y:.1%}<br>%{customdata}<extra></extra>`,
  }))

  return { traces }
}

function makeChart(category, data) {
  const meta = CATEGORY_META.find((m) => m.key === category)
  if (!meta) return { traces: [], layout: {} }

  if (meta.type === "donut") {
    const items = data[category] || []
    const labels = items.map((i) => String(i.Category))
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
          hovertemplate: "Cat %{label}: %{percent:.1%} <extra></extra>",
        },
      ],
      layout: { ...BASE_LAYOUT, title: "Overall Demographic Distribution" },
    }
  }

  if (meta.type === "stacked") {
    const groupMap = data[category] || {}
    const { traces } = buildStackedFromGroupMap(groupMap)

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
              This page shows demographic distributions by category. Use the list below to change the visualization.
              <br />• Overall: donut of categories
              <br />• Year/Gender/Grade/School: 100% stacked bars
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
            {error && <div style={{ color: "salmon" }}>Failed to load: {error}</div>}
            {!loading && !error && data && (
              <Plot 
                key={`demo-${category}`} 
                data={traces} 
                layout={{ ...BASE_LAYOUT, ...layout }} 
                config={BASE_CONFIG} 
                style={{ width: "100%", height: "100%" }} 
                useResizeHandler 
              />
            )}
          </div>

          <div style={{ 
            border: "1px solid #2a2a32", 
            borderRadius: 16, 
            padding: 16, 
            background: "#16161a" 
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Analysis</div>
            <p style={{ margin: 0, color: "#c9c9d1" }}>Coming soon: highlight groups with highest representation and year-over-year shifts.</p>
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

          /* Reduce donut chart size by 15% on mobile */
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

          /* Reduce donut chart size by 15% on small mobile */
          div[style*="height: 560px"] .js-plotly-plot {
            transform: scale(0.85) !important;
            transform-origin: center center !important;
          }
        }
      `}</style>
    </div>
  )
}


