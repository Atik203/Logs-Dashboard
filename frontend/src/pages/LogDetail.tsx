import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { SEVERITY_OPTIONS, deleteLog, getLog, updateLog } from "@api/api";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";

interface FormState {
  timestamp: string;
  message: string;
  severity: (typeof SEVERITY_OPTIONS)[number];
  source: string;
}

const toLocalInput = (isoString: string) =>
  dayjs(isoString).format("YYYY-MM-DDTHH:mm");
const toIsoString = (localValue: string) => dayjs(localValue).toISOString();

export default function LogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Missing log identifier");
      setIsLoading(false);
      return;
    }

    const numericId = Number(id);
    if (isNaN(numericId) || numericId <= 0) {
      setError("Invalid log identifier");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    void getLog(numericId)
      .then((log) => {
        setForm({
          timestamp: toLocalInput(log.timestamp),
          message: log.message,
          severity: log.severity,
          source: log.source,
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load log");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const hasChanges = useMemo(() => {
    return form !== null;
  }, [form]);

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form || !id) return;

    const numericId = Number(id);
    if (isNaN(numericId) || numericId <= 0) {
      setError("Invalid log identifier");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await updateLog(numericId, {
        ...form,
        timestamp: toIsoString(form.timestamp),
      });
      toast.success("Log updated successfully!");
      navigate("/logs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update log");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    const numericId = Number(id);
    if (isNaN(numericId) || numericId <= 0) {
      setError("Invalid log identifier");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await deleteLog(numericId);
      toast.success("Log deleted successfully!");
      navigate("/logs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete log");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading log…</p>;
  }

  if (!form) {
    return (
      <p className="text-sm text-destructive">{error ?? "Log not found."}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Edit log</CardTitle>
          <CardDescription className="text-sm">
            Update the log entry or delete it permanently.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timestamp">Timestamp</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={form.timestamp}
                onChange={(event) =>
                  handleChange("timestamp", event.target.value)
                }
                required
                step="1"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <select
                id="severity"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.severity}
                onChange={(event) =>
                  handleChange("severity", event.target.value)
                }
                required
              >
                {SEVERITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={form.source}
              onChange={(event) => handleChange("source", event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={form.message}
              onChange={(event) => handleChange("message", event.target.value)}
              rows={6}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
          <Button
            type="submit"
            disabled={!hasChanges || isSaving}
            className="min-h-[44px] w-full sm:w-auto"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/logs")}
            className="min-h-[44px] w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSaving}
            className="min-h-[44px] w-full sm:w-auto"
          >
            Delete log
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
