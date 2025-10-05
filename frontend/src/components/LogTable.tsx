import dayjs from "dayjs";

import { type Log } from "@api/api";

interface LogTableProps {
  logs: Log[];
  onSelect?: (log: Log) => void;
}

export function LogTable({ logs, onSelect }: LogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No logs match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Timestamp</th>
            <th className="px-4 py-3 text-left">Severity</th>
            <th className="px-4 py-3 text-left">Source</th>
            <th className="px-4 py-3 text-left">Message</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {logs.map((log) => (
            <tr
              key={log.id}
              className="cursor-pointer transition hover:bg-muted"
              onClick={() => onSelect?.(log)}
            >
              <td className="px-4 py-3 font-mono text-xs">
                {dayjs(log.timestamp).format("YYYY-MM-DD HH:mm:ss")}
              </td>
              <td className="px-4 py-3 font-medium">{log.severity}</td>
              <td className="px-4 py-3">{log.source}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {log.message.length > 120
                  ? `${log.message.slice(0, 117)}...`
                  : log.message}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
