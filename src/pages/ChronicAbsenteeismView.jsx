import React, { useEffect, useState } from "react"
import ChronicAbsenteeismDashboard from "../components/dashboard/ChronicAbsenteeismDashboard"
import chronicData from "../data/chronicAbsenteeism.json"

export default function ChronicAbsenteeismView() {
  const [data, setData] = useState(null)

  useEffect(() => {
    setData(chronicData)
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <ChronicAbsenteeismDashboard data={data} />
    </div>
  )
}


