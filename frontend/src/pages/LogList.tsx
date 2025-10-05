import { saveAs } from "file-saver";
import Papa from "papaparse";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { type Log, type LogQueryParams, getRawLogs, listLogs } from "@api/api";
import { FilterPanel, type LogFilterState } from "@components/FilterPanel";
import { LogTable } from "@components/LogTable";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card";

const PAGE_SIZE = 20;

const buildQuery = (filters: LogFilterState): LogQueryParams => {
  const query: LogQueryParams = {};
  if (filters.search) query.search = filters.search;
  if (filters.severity) query.severity = filters.severity;
  if (filters.source) query.source = filters.source;
  if (filters.date_from) query.date_from = filters.date_from;
  if (filters.date_to) query.date_to = filters.date_to;
  return query;
};

export default function LogList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<LogFilterState>({});
  const [appliedFilters, setAppliedFilters] = useState<LogFilterState>({});
  const [logs, setLogs] = useState<Log[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount]
  );

  const fetchLogs = useCallback(async () => {
    const query = buildQuery(appliedFilters);
    query.page = page;

    setIsLoading(true);
    setError(null);
    try {
      const response = await listLogs(query);
      setLogs(response.results);
      setTotalCount(response.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load logs");
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const handleChangeFilters = (changes: Partial<LogFilterState>) => {
    setFilters((prev) => ({ ...prev, ...changes }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({});
    setAppliedFilters({});
    setPage(1);
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const query = buildQuery(appliedFilters);
      const raw = await getRawLogs(query);
      const csv = Papa.unparse(raw);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      saveAs(blob, `logs-export-${timestamp}.csv`);
      toast.success("CSV exported successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectLog = (log: Log) => {
    navigate(`/logs/${log.id}`);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Log explorer
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Search, filter, paginate, and export log entries.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={isExporting || isLoading}
            className="min-h-[44px]"
          >
            {isExporting ? "Exporting…" : "Export CSV"}
          </Button>
          <Button
            onClick={() => navigate("/logs/create")}
            className="min-h-[44px]"
          >
            Create log
          </Button>
        </div>
      </header>

      <FilterPanel
        filters={filters}
        onChange={handleChangeFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading logs…"
              : `${totalCount.toLocaleString()} total results`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <LogTable logs={logs} onSelect={handleSelectLog} />
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            Page {page} of {totalPages} ({PAGE_SIZE} per page)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-h-[44px] flex-1 sm:flex-initial"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="min-h-[44px] flex-1 sm:flex-initial"
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
