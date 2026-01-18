import { useState, useMemo } from "react";

export function useCallerFilters() {
  const [selectedIncidents, setSelectedIncidents] = useState<Set<string>>(new Set());
  const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set());

  const toggleIncidentFilter = (incidentId: string) => {
    setSelectedIncidents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(incidentId)) {
        newSet.delete(incidentId);
      } else {
        newSet.add(incidentId);
      }
      return newSet;
    });
  };

  const toggleScenarioFilter = (scenario: string) => {
    setSelectedScenarios((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(scenario)) {
        newSet.delete(scenario);
      } else {
        newSet.add(scenario);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setSelectedIncidents(new Set());
    setSelectedScenarios(new Set());
  };

  const hasActiveFilters = useMemo(() => {
    return selectedIncidents.size > 0 || selectedScenarios.size > 0;
  }, [selectedIncidents.size, selectedScenarios.size]);

  return {
    selectedIncidents,
    selectedScenarios,
    toggleIncidentFilter,
    toggleScenarioFilter,
    clearFilters,
    hasActiveFilters,
  };
}
