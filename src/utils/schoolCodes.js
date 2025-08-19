// School ID to School Name mappings
// Extend this list as needed; unknown IDs will fall back to `School <ID>`
export const SCHOOL_CODES = {
  "1": "Alice Smith",
  "2": "Glen Lake",
  "5": "Eisenhower",
  "6": "Tanglen",
  "7": "Gatewood",
  "8": "Meadowbrook",
  "9": "Pre-School",
  "12": "HHS",
  "13": "NMS",
  "14": "WMS",
  "17": "Homeschool",
  "18": "NonPublic",
  "19": "ELSE",
  "20": "T+",
  "23": "ESY",
  "26": "HAP Summer",
  "28": "XinXing",
  "29": "SENOPS",
  "30": "Harley",
  "31": "Meadowbrook",
  "41": "Virtual Elementary",
  "42": "Virtual Secondary",
  "43": "Royal Academy",
  "44": "Harley Hopkins Early Childhood Center",
  "45": "Freedom School",
}

export function getSchoolName(code) {
  const key = String(code)
  return SCHOOL_CODES[key] || `School ${key}`
}


