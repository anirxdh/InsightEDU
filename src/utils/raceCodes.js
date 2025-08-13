// Race category code mappings
export const RACE_CODES = {
  "1": "Hispanic/Latino",
  "2": "American Indian/Alaskan Native", 
  "3": "Asian",
  "4": "African-American/Black",
  "5": "Native Hawaiian/Other Pacific Islander",
  "6": "Caucasian/White",
  "7": "Two or more races"
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
