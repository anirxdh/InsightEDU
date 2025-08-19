// Race category code mappings
export const RACE_CODES = {
  "1": "Hispanic",
  "2": "American Indian", 
  "3": "Asian",
  "4": "Black",
  "5": "Hawaiian",
  "6": "White",
  "7": "Two or more"
};

// Function to get race description from code
export function getRaceDescription(code) {
  return RACE_CODES[code] || `Category ${code}`;
}

// Function to get all race codes with descriptions
export function getAllRaceCodes() {
  return Object.entries(RACE_CODES).map(([code, description]) => ({
    code,
    description
  }));
}
