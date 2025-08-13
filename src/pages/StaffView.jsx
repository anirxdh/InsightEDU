import React, { useEffect, useMemo, useState } from "react"
import Plot from "react-plotly.js"
import { THEME, CHART_COLORS } from "../utils/theme"
import { getAllRaceCodes } from "../utils/raceCodes"
import staffDataRaw from "../data/staff.json"

const COLORS = { primary: CHART_COLORS.primary, secondary: CHART_COLORS.secondary }

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

const BASE_CONFIG = { displayModeBar: true, responsive: true, modeBarButtonsToRemove: ["select2d", "lasso2d"] }

const CATEGORY_META = [
  { key: "overall", label: "Experience (years)", type: "bars-single" },
  { key: "year", label: "Year (timeline)", type: "line" },
  { key: "gender", label: "Gender", type: "bars-single" },
  { key: "category", label: "Category", type: "bars-single" },
  { key: "highest_degree", label: "Highest Degree", type: "bars-single" },
  { key: "race", label: "Race (Code)", type: "bars-single" },
]

function makeChart(category, data) {
  const meta = CATEGORY_META.find((m) => m.key === category)
  if (!meta) return { traces: [], layout: {} }

  if (category === "year") {
    const rows = data.year
    const x = rows.map((r) => r.label)
    const y = rows.map((r) => r.percent)
    return {
      traces: [
        {
          type: "scatter",
          mode: "lines+markers",
          name: "% of staff",
          x,
          y,
          marker: { color: COLORS.primary },
          hovertemplate: "<b>%{x}</b><br>%: %{y:.1%}<br>n=%{customdata}<extra></extra>",
          customdata: rows.map((r) => r.count ?? ""),
        },
      ],
      layout: { ...BASE_LAYOUT, title: meta.label, yaxis: { tickformat: ".0%", rangemode: "tozero" } },
    }
  }

  const rows = data[category] || []
  const x = rows.map((r) => r.label)
  // Masking in this dataset refers to counts, not percentages. Always show percent; annotate text when masked.
  const y = rows.map((r) => r.percent)
  const labelText = rows.map((r) => `${Math.round((r.percent || 0) * 100)}%`)
  const hoverDetails = rows.map((r) => {
    const bits = []
    if (r.count != null) bits.push(`n=${r.count}`)
    if (r.masked) bits.push("masked")
    return bits.join(" ")
  })

  return {
    traces: [
      {
        type: "bar",
        name: "% of staff",
        x,
        y,
        text: labelText,
        texttemplate: "%{text}",
        textposition: "auto",
        customdata: hoverDetails,
        marker: { color: COLORS.primary },
        hovertemplate: "<b>%{x}</b><br>%: %{y:.1%}<br>%{customdata}<extra></extra>",
      },
    ],
    layout: {
      ...BASE_LAYOUT,
      title: meta.label,
      barmode: "group",
      yaxis: { tickformat: ".0%", rangemode: "tozero" },
    },
  }
}

export default function StaffView() {
  const [category, setCategory] = useState("overall")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      setData(staffDataRaw)
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
        }}>Staff</h1>
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
              Staff composition and experience, by category and over time. Values are percentages of staff; some counts are masked due to small numbers.
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
            <p style={{ margin: 0, color: "#c9c9d1" }}>Coming soon: callouts for largest groups and experience shifts over years.</p>
            
            {/* Race Code Legend */}
            {category === "race" && (
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


