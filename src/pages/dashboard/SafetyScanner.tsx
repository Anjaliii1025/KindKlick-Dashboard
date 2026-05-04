import { useEffect, useState } from "react";
import { Loader2, ScanSearch, ShieldAlert, ShieldCheck, Link2, Type } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { scanText, scanUrl, type TextScanResponse, type UrlScanResponse } from "@/lib/safetyApi";


function ResultBadge({ result, confidence }: { result?: string; confidence?: number }) {
  if (!result) {
    return <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Waiting for input</span>;
  }

  const risky = result !== "safe";
  const classes = risky
    ? "bg-danger/10 text-danger border-danger/30"
    : "bg-success/10 text-success border-success/30";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>
      {risky ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
      {result}
      {typeof confidence === "number" ? ` · ${Math.round(confidence * 100)}%` : ""}
    </span>
  );
}


export default function SafetyScanner() {
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [textResult, setTextResult] = useState<TextScanResponse | null>(null);
  const [urlResult, setUrlResult] = useState<UrlScanResponse | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [urlLoading, setUrlLoading] = useState(false);
  const [textError, setTextError] = useState("");
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    if (textInput.trim().length < 8) {
      setTextResult(null);
      setTextError("");
      return;
    }

    const timer = window.setTimeout(async () => {
      setTextLoading(true);
      setTextError("");

      try {
        const result = await scanText(textInput);
        setTextResult(result);
      } catch (error) {
        setTextError(error instanceof Error ? error.message : "Failed to scan text");
      } finally {
        setTextLoading(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [textInput]);

  useEffect(() => {
    if (urlInput.trim().length < 8) {
      setUrlResult(null);
      setUrlError("");
      return;
    }

    const timer = window.setTimeout(async () => {
      setUrlLoading(true);
      setUrlError("");

      try {
        const result = await scanUrl(urlInput);
        setUrlResult(result);
      } catch (error) {
        setUrlError(error instanceof Error ? error.message : "Failed to scan URL");
      } finally {
        setUrlLoading(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [urlInput]);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-3xl border-primary/20 bg-gradient-to-br from-primary/10 via-secondary/5 to-success/10 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand text-white shadow-soft">
              <ScanSearch className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Live Safety Scanner</CardTitle>
              <CardDescription className="mt-1 text-sm text-muted-foreground">
                Your website can now send text and URLs to your trained Python models in real time.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">Text Model</CardTitle>
            </div>
            <CardDescription>Type or paste text to classify it live.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={textInput}
              onChange={(event) => setTextInput(event.target.value)}
              placeholder="Paste a message, email, or chat text here..."
              className="min-h-[180px] rounded-2xl"
            />

            <div className="flex items-center justify-between gap-3">
              <ResultBadge result={textResult?.result} confidence={textResult?.confidence} />
              {textLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
            </div>

            {textError ? <p className="text-sm text-danger">{textError}</p> : null}

            <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm">
              <p className="font-semibold">Latest text verdict</p>
              <p className="mt-2 text-muted-foreground">
                Raw prediction: <span className="font-medium text-foreground">{textResult?.raw_prediction ?? "—"}</span>
              </p>
              <p className="mt-1 text-muted-foreground">
                Cleaned text: <span className="font-medium text-foreground">{textResult?.cleaned_text ?? "—"}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">URL Model</CardTitle>
            </div>
            <CardDescription>Paste a URL to check if your phishing model flags it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              placeholder="https://example.com/login"
              className="h-12 rounded-2xl"
            />

            <div className="flex items-center justify-between gap-3">
              <ResultBadge result={urlResult?.result} confidence={urlResult?.confidence} />
              {urlLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
            </div>

            {urlError ? <p className="text-sm text-danger">{urlError}</p> : null}

            <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm">
              <p className="font-semibold">Latest URL verdict</p>
              <p className="mt-2 text-muted-foreground">
                Raw prediction: <span className="font-medium text-foreground">{urlResult?.raw_prediction ?? "—"}</span>
              </p>
              <p className="mt-1 text-muted-foreground">
                URL sent: <span className="font-medium text-foreground break-all">{urlResult?.input ?? "—"}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
