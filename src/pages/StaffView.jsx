import React, { useEffect, useMemo, useState } from "react"
import Plot from "react-plotly.js"
import { THEME, CHART_COLORS } from "../utils/theme"
import GraphError from "../components/GraphError"
import { RACE_CODES } from "../utils/raceCodes"

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

const ANALYSIS_SUMMARIES = [
  {
    "filter": "overall",
    "summary": "Most staff have fewer than 10 years of experience, with 38.6% in the 0–5 year range and 21.8% in the 6–10 year range. Only a small portion have over 20 years, with the 21+ category masked due to small counts."
  },
  {
    "filter": "race",
    "summary": "The majority of staff (80.1%) are from race code 6, followed by 10.3% in race code 4. All other racial groups are below 5% representation."
  },
  {
    "filter": "gender",
    "summary": "Staff are predominantly female (70.6%) compared to 29.4% male."
  },
  {
    "filter": "category",
    "summary": "Support Staff make up the largest category (32.7%), followed closely by Teaching Staff (27.8%) and Community Education/Extracurricular roles (26%). Admin & Leadership represents less than 5% of staff."
  },
  {
    "filter": "year",
    "summary": "Staff counts have generally increased over time, peaking in 2022 with 2,877 staff members before declining slightly in 2023."
  },
  {
    "filter": "highest_degree",
    "summary": "Master's degrees are the most common (70.9%), followed by Bachelor's degrees (24.2%), Specialist degrees (2.6%), and Doctorate degrees (2.3%). This shows a well-educated workforce with the vast majority holding advanced degrees."
  }
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

  let rows = data[category] || []
  
  // Special handling for highest_degree to group into 4 main categories
  if (category === "highest_degree") {
    const groupedData = {
      "Master's": { percent: 0, count: 0 },
      "Bachelor's": { percent: 0, count: 0 },
      "Specialist": { percent: 0, count: 0 },
      "Doctorate": { percent: 0, count: 0 }
    }
    
    rows.forEach(row => {
      const label = row.label.toLowerCase()
      if (label.includes('masters') || label.includes('master')) {
        groupedData["Master's"].percent += row.percent
        groupedData["Master's"].count += row.count || 0
      } else if (label.includes('bachelors') || label.includes('bachelor')) {
        groupedData["Bachelor's"].percent += row.percent
        groupedData["Bachelor's"].count += row.count || 0
      } else if (label.includes('specialist')) {
        groupedData["Specialist"].percent += row.percent
        groupedData["Specialist"].count += row.count || 0
      } else if (label.includes('doctorate') || label.includes('doctor')) {
        groupedData["Doctorate"].percent += row.percent
        groupedData["Doctorate"].count += row.count || 0
      }
    })
    
    rows = Object.entries(groupedData).map(([label, data]) => ({
      label,
      percent: data.percent,
      count: data.count
    }))
  }
  
  const x = rows.map((r) => {
    if (category === "gender") return r.label === "0" ? "Female" : r.label === "1" ? "Male" : r.label
    if (category === "race") return RACE_CODES[String(r.label)] || r.label
    return r.label
  })
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
              Staff composition and experience analysis using data from <b>2019 to 2023</b> academic years. This dataset examines the professional characteristics of educational staff to support workforce planning, professional development initiatives, and ensure diverse representation across the educational system.
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
                "This analysis shows staff composition and characteristics across different categories, highlighting key patterns in workforce demographics and qualifications."}
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


