import { type ChangeEvent } from "react";

import { SEVERITY_OPTIONS, type Log } from "@api/api";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";

export interface LogFilterState {
  search?: string;
  severity?: Log["severity"] | "";
  source?: string;
  date_from?: string;
  date_to?: string;
}

interface FilterPanelProps {
  filters: LogFilterState;
  onChange: (changes: Partial<LogFilterState>) => void;
  onReset?: () => void;
  onApply?: () => void;
}

export function FilterPanel({
  filters,
  onChange,
  onReset,
  onApply,
}: FilterPanelProps) {
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    onChange({ [name]: value });
  };

  const handleSeverity = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    const nextValue = (value || undefined) as
      | LogFilterState["severity"]
      | undefined;
    onChange({ severity: nextValue });
  };

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-2 text-sm lg:col-span-2">
          <Label htmlFor="filter-search" className="text-muted-foreground">
            Search
          </Label>
          <Input
            id="filter-search"
            name="search"
            value={filters.search ?? ""}
            onChange={handleInput}
            placeholder="Message or source"
          />
        </div>
        <div className="space-y-2 text-sm">
          <Label htmlFor="filter-severity" className="text-muted-foreground">
            Severity
          </Label>
          <select
            id="filter-severity"
            name="severity"
            value={filters.severity ?? ""}
            onChange={handleSeverity}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All severities</option>
            {SEVERITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 text-sm">
          <Label htmlFor="filter-source" className="text-muted-foreground">
            Source
          </Label>
          <Input
            id="filter-source"
            name="source"
            value={filters.source ?? ""}
            onChange={handleInput}
            placeholder="Service name"
          />
        </div>
        <div className="space-y-2 text-sm">
          <Label htmlFor="filter-date-from" className="text-muted-foreground">
            From
          </Label>
          <Input
            id="filter-date-from"
            type="datetime-local"
            name="date_from"
            value={filters.date_from ?? ""}
            onChange={handleInput}
            className="w-full min-w-[180px]"
            step="1"
          />
        </div>
        <div className="space-y-2 text-sm">
          <Label htmlFor="filter-date-to" className="text-muted-foreground">
            To
          </Label>
          <Input
            id="filter-date-to"
            type="datetime-local"
            name="date_to"
            value={filters.date_to ?? ""}
            onChange={handleInput}
            className="w-full min-w-[180px]"
            step="1"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={onApply}>
          Apply
        </Button>
        {onReset && (
          <Button type="button" variant="outline" onClick={onReset}>
            Reset
          </Button>
        )}
      </div>
    </section>
  );
}
