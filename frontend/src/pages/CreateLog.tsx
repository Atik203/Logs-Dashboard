import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { SEVERITY_OPTIONS, createLog } from "@api/api";
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

const buildDefaultForm = (): FormState => ({
  timestamp: dayjs().format("YYYY-MM-DDTHH:mm"),
  message: "",
  severity: "INFO",
  source: "",
});

export default function CreateLog() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(buildDefaultForm);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await createLog({
        ...form,
        timestamp: dayjs(form.timestamp).toISOString(),
      });
      toast.success("Log created successfully!");
      navigate("/logs");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to create log");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Create log</CardTitle>
          <CardDescription className="text-sm">
            Capture an incident or manual note for troubleshooting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="min-h-[44px] w-full sm:w-auto"
          >
            {isSaving ? "Creating…" : "Create log"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/logs")}
            className="min-h-[44px] w-full sm:w-auto"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
