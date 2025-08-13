import React, { useEffect, useMemo, useState } from "react"
import Plot from "react-plotly.js"
import { THEME } from "../utils/theme"
import { getAllRaceCodes } from "../utils/raceCodes"
import frpDataRaw from "../data/final_agg_frp.json"

// FRP categories as provided in the dataset
const FRP_LABELS = {
  F: "FRP Eligible",
  R: "Reduced",
  S: "Standard/Full",
  H: "Homeless/Other",
}

const CATEGORY_COLORS = [
  "#7c3aed", // main violet
  "#a78bfa", // light violet
  "#c4b5fd", // lavender
  "#581c87", // deep violet
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
  { key: "Overall", label: "Overall (FRP distribution)", type: "donut" },
  { key: "Gender", label: "Gender (FRP % stack)", type: "stacked" },
  { key: "Grade group", label: "Grade Group (FRP % stack)", type: "stacked" },
  { key: "Race", label: "Race (Code) (FRP % stack)", type: "stacked" },
  { key: "School Number", label: "School (FRP % stack)", type: "stacked" },
  { key: "Year", label: "Year (FRP % stack)", type: "stacked" },
  { key: "Chronic Absenteeism", label: "Chronic Absenteeism (FRP % stack)", type: "stacked" },
]

function labelFor(categoryCode) {
  return FRP_LABELS[categoryCode] || String(categoryCode)
}

function buildStackedFromGroupMap(groupMap) {
  const groupNames = Object.keys(groupMap)
  const categoryCodes = ["F", "R", "S", "H"]

  const traces = categoryCodes.map((code, idx) => ({
    type: "bar",
    name: labelFor(code),
    x: groupNames,
    y: groupNames.map((g) => {
      const found = (groupMap[g] || []).find((i) => i.Category === code)
      return found ? Number(found.Percent) : 0
    }),
    marker: { color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] },
    customdata: groupNames.map((g) => {
      const found = (groupMap[g] || []).find((i) => i.Category === code)
      return found && found.Count && found.Count !== "small count" ? `n=${found.Count}` : ""
    }),
    hovertemplate: `<b>%{x}</b><br>${labelFor(code)}: %{y:.1%}<br>%{customdata}<extra></extra>`,
  }))

  return { traces }
}

function makeChart(category, data) {
  const meta = CATEGORY_META.find((m) => m.key === category)
  if (!meta) return { traces: [], layout: {} }

  if (meta.type === "donut") {
    const items = data[category] || []
    const labels = items.map((i) => labelFor(i.Category))
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
            return i.Count && i.Count !== "small count" ? `n=${i.Count}` : ""
          }),
          hovertemplate: "%{label}: %{percent:.1%}<br>%{customdata}<extra></extra>",
        },
      ],
      layout: { ...BASE_LAYOUT, title: "Overall FRP Distribution" },
    }
  }

  if (meta.type === "stacked") {
    const groupMap = data[category] || {}
    const { traces } = buildStackedFromGroupMap(groupMap)
    const groupNames = Object.keys(groupMap)
    const countsByGroup = groupNames.map((g) =>
      (groupMap[g] || []).reduce((sum, it) => sum + (Number(it.Count) || 0), 0)
    )
    return {
      traces,
      layout: {
        ...BASE_LAYOUT,
        title: meta.label,
        barmode: "stack",
        yaxis: { tickformat: ".0%", rangemode: "tozero" },
      },
      // counts available per group in customdata on first trace for hover
      // Note: Plotly doesn't support per-bar annotations easily across all traces; keep counts in hover for clarity
      // We attach counts only to the first trace; hovertemplate already shows percent by segment
    }
  }

  return { traces: [], layout: {} }
}

export default function FRPView() {
  const [category, setCategory] = useState("Overall")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setData(frpDataRaw)
    setLoading(false)
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
        }}>FRP</h1>
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
              Free/Reduced Price (FRP) meal eligibility analysis using data from <b>2019-20 to 2023-24</b> academic years. This dataset examines student access to nutritional support programs, which serves as an important indicator of socioeconomic diversity and helps identify students who may need additional academic and social support services.
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
                key={`frp-${category}`} 
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
            <p style={{ margin: 0, color: "#c9c9d1" }}>Coming soon: highlight groups with highest FRP share and notable differences by category.</p>
            
            {/* Race Code Legend */}
            {category === "Race" && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #2a2a32" }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: "#D5D8EA" }}>Race Category Codes:</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "4px", fontSize: "12px" }}>
                  {getAllRaceCodes().map(({ code, description }) => (
                    <div key={code} style={{ color: "#a1a1aa" }}>
                      <span style={{ fontWeight: 600, color: "#fff" }}>{code}:</span> {description}
                    </div>
                  ))}
                </div>
              </div>
            )}
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


