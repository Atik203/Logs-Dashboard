import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {
  type AggregateGroupBy,
  type AggregateInterval,
  type AggregatedLogDatum,
  type Log,
  type LogQueryParams,
  getAggregatedLogs,
  getRawLogs,
} from "../api/api";
import { FilterPanel, type LogFilterState } from "../components/FilterPanel";
import { TrendChart } from "../components/TrendChart";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const AGGREGATE_LABELS: Record<AggregateGroupBy, string> = {
  date: "Date",
  severity: "Severity",
  source: "Source",
};

const SEVERITY_COLORS: Record<string, string> = {
  DEBUG: "hsl(200, 80%, 50%)",
  INFO: "hsl(150, 60%, 50%)",
  WARNING: "hsl(40, 90%, 60%)",
  ERROR: "hsl(20, 90%, 60%)",
  CRITICAL: "hsl(0, 80%, 60%)",
};

const DEFAULT_GROUP_BY: AggregateGroupBy = "date";
const DEFAULT_INTERVAL: AggregateInterval = "day";

const sanitizeFilters = (filters: LogFilterState): LogQueryParams => {
  const query: LogQueryParams = {};
  if (filters.search) {
    query.search = filters.search;
  }
  if (filters.severity) {
    query.severity = filters.severity;
  }
  if (filters.source) {
    query.source = filters.source;
  }
  if (filters.date_from) {
    query.date_from = filters.date_from;
  }
  if (filters.date_to) {
    query.date_to = filters.date_to;
  }
  return query;
};

const Dashboard = () => {
  const [filters, setFilters] = useState<LogFilterState>({});
  const [appliedFilters, setAppliedFilters] = useState<LogFilterState>({});
  const [groupBy, setGroupBy] = useState<AggregateGroupBy>(DEFAULT_GROUP_BY);
  const [interval, setInterval] = useState<AggregateInterval>(DEFAULT_INTERVAL);
  const [chartData, setChartData] = useState<AggregatedLogDatum[]>([]);
  const [rawLogs, setRawLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchData = useCallback(() => {
    const params = sanitizeFilters(appliedFilters);
    const aggregatedParams = {
      ...params,
      group_by: groupBy,
      ...(groupBy === "date" ? { interval } : {}),
    };

    setIsLoading(true);
    setError(null);

    void Promise.all([getAggregatedLogs(aggregatedParams), getRawLogs(params)])
      .then(([aggregated, raw]) => {
        setChartData(aggregated);
        setRawLogs(raw);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Unable to load dashboard data"
        );
      })
      .finally(() => setIsLoading(false));
  }, [appliedFilters, groupBy, interval]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket for real-time updates
  useEffect(() => {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/logs/`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received log update:", message);
        // Refetch data when new log arrives
        fetchData();
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [fetchData]);

  const severityBreakdown = useMemo(() => {
    return rawLogs.reduce<Record<string, number>>((acc, log) => {
      acc[log.severity] = (acc[log.severity] ?? 0) + 1;
      return acc;
    }, {});
  }, [rawLogs]);

  const severityChartData = useMemo(() => {
    return Object.entries(severityBreakdown).map(([name, value]) => ({
      name,
      value,
      color: SEVERITY_COLORS[name] || "hsl(220, 20%, 50%)",
    }));
  }, [severityBreakdown]);

  const uniqueSources = useMemo(
    () => new Set(rawLogs.map((log) => log.source)).size,
    [rawLogs]
  );

  const handleChangeFilters = (changes: Partial<LogFilterState>) => {
    setFilters((prev) => ({ ...prev, ...changes }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setFilters({});
    setAppliedFilters({});
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Logs Dashboard
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Monitor ingestion volume, severity trends, and sources at a glance.
        </p>
      </header>

      <FilterPanel
        filters={filters}
        onChange={handleChangeFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0">
          <div>
            <CardTitle className="text-lg md:text-xl">
              Aggregated timeline
            </CardTitle>
            <CardDescription className="text-sm">
              Group the timeline by {AGGREGATE_LABELS[groupBy].toLowerCase()}{" "}
              and explore counts over time.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(AGGREGATE_LABELS) as AggregateGroupBy[]).map(
              (key) => (
                <Button
                  key={key}
                  variant={groupBy === key ? "default" : "outline"}
                  onClick={() => {
                    setGroupBy(key);
                    if (key !== "date") {
                      setInterval(DEFAULT_INTERVAL);
                    }
                  }}
                  className="transition-all duration-200"
                >
                  {AGGREGATE_LABELS[key]}
                </Button>
              )
            )}
            {groupBy === "date" && (
              <div className="flex items-center gap-1">
                <Button
                  variant={interval === "day" ? "secondary" : "outline"}
                  onClick={() => setInterval("day")}
                  className="transition-all duration-200"
                >
                  Day
                </Button>
                <Button
                  variant={interval === "month" ? "secondary" : "outline"}
                  onClick={() => setInterval("month")}
                  className="transition-all duration-200"
                >
                  Month
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading aggregated data…
            </p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <TrendChart data={chartData} groupBy={groupBy} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Severity distribution</CardTitle>
          <CardDescription>
            Breakdown of log entries by severity level (donut chart).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : severityChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total logs</CardTitle>
            <CardDescription>
              Count of raw logs matching current filters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {rawLogs.length.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unique sources</CardTitle>
            <CardDescription>Distinct source values observed.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {uniqueSources.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Critical events</CardTitle>
            <CardDescription>Number of CRITICAL severity logs.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {(severityBreakdown.CRITICAL ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Warning signals</CardTitle>
            <CardDescription>Count of WARNING severity logs.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {(severityBreakdown.WARNING ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
