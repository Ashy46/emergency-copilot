import type { LegacyEvent } from "@/types/legacy";
import { scenarioFilterConfigs } from "@/lib/constants";

interface FilterPanelProps {
  allCallers: LegacyEvent[];
  selectedIncidents: Set<string>;
  selectedScenarios: Set<string>;
  onToggleIncident: (incidentId: string) => void;
  onToggleScenario: (scenario: string) => void;
  onClear: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function FilterPanel({
  allCallers,
  selectedIncidents,
  selectedScenarios,
  onToggleIncident,
  onToggleScenario,
  onClear,
  isExpanded,
  onToggleExpand,
}: FilterPanelProps) {
  const uniqueIncidents = Array.from(new Set(allCallers.map((c) => c.incidentId))).sort();
  const hasActiveFilters = selectedIncidents.size > 0 || selectedScenarios.size > 0;

  const filteredCallers = allCallers.filter((caller) => {
    if (selectedIncidents.size > 0 && !selectedIncidents.has(caller.incidentId)) {
      return false;
    }
    if (selectedScenarios.size > 0 && !selectedScenarios.has(caller.scenario)) {
      return false;
    }
    return true;
  });

  if (allCallers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Filter Header - Always Visible */}
      <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex items-center gap-2 flex-1"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-semibold text-sm text-gray-700">Filters</span>
          {hasActiveFilters && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              {selectedIncidents.size + selectedScenarios.size}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 hover:bg-blue-50 rounded transition-colors"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1"
          >
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Options - Collapsible */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-3 space-y-3 border-t border-gray-100">
          {/* Emergency Type Filters */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Emergency Type
            </div>
            <div className="grid grid-cols-2 gap-2">
              {scenarioFilterConfigs.map((scenario) => {
                const isSelected = selectedScenarios.has(scenario.key);
                const count = allCallers.filter((c) => c.scenario === scenario.key).length;
                if (count === 0) return null;

                return (
                  <button
                    key={scenario.key}
                    onClick={() => onToggleScenario(scenario.key)}
                    className={`px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? scenario.bgClass
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{scenario.icon}</span>
                      <span className="text-gray-700">{scenario.label}</span>
                    </div>
                    <span className="text-gray-500 text-xs">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Incident ID Filters */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Incident ID
            </div>
            <div className="space-y-1.5">
              {uniqueIncidents.map((incidentId) => {
                const isSelected = selectedIncidents.has(incidentId);
                const count = allCallers.filter((c) => c.incidentId === incidentId).length;

                return (
                  <button
                    key={incidentId}
                    onClick={() => onToggleIncident(incidentId)}
                    className={`w-full px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? "bg-purple-100 border-purple-400"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-mono text-gray-700">{incidentId}</span>
                    <span className="text-gray-500">({count} caller{count !== 1 ? "s" : ""})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Results Summary */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600 text-center">
                Showing <span className="font-bold text-blue-600">{filteredCallers.length}</span> of{" "}
                <span className="font-bold">{allCallers.length}</span> caller{allCallers.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
