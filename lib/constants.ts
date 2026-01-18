export const scenarioLabels = {
  carAccident: "Car Accident",
  fire: "Fire",
  medical: "Medical",
  unknown: "Unknown",
} as const;

export const scenarioColors = {
  carAccident: "from-red-50 to-red-100 border-red-300",
  fire: "from-orange-50 to-orange-100 border-orange-300",
  medical: "from-blue-50 to-blue-100 border-blue-300",
  unknown: "from-gray-50 to-gray-100 border-gray-300",
} as const;

export const scenarioIcons = {
  carAccident: "🚗",
  fire: "🔥",
  medical: "⚕️",
  unknown: "❓",
} as const;

export const scenarioTimelineColors = {
  carAccident: "#ef4444",
  fire: "#f97316",
  medical: "#3b82f6",
  unknown: "#6b7280",
} as const;

export const scenarioFilterConfigs = [
  { key: "carAccident", label: "Car Accident", icon: "🚗", bgClass: "bg-red-100 border-red-400" },
  { key: "fire", label: "Fire", icon: "🔥", bgClass: "bg-orange-100 border-orange-400" },
  { key: "medical", label: "Medical", icon: "⚕️", bgClass: "bg-blue-100 border-blue-400" },
  { key: "unknown", label: "Unknown", icon: "❓", bgClass: "bg-gray-100 border-gray-400" },
] as const;
