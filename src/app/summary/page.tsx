// src/app/summary/page.tsx
"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Language, MessageRole, translations } from "@/lib/types";
import { toast } from "sonner";

interface Action {
  id: string;
  type: string;
  description: string;
  status: "completed" | "pending" | "cancelled";
  metadata?: {
    notes?: string;
    date?: string;
    testType?: string;
  };
  success?: boolean;
}

interface SummaryData {
  summary: string[];
  actions: Action[];
  date?: string;
  duration?: string;
}

function SummaryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [summaryData, setSummaryData] = useState<SummaryData>({
    summary: [],
    actions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = (searchParams.get("role") as MessageRole) || "clinician";
  const lang = (searchParams.get("lang") as Language) || "en";
  const conversationId = searchParams.get("conversationId");
  const isClinicianView = role === "clinician";

  const t = translations[lang];

  useEffect(() => {
    const fetchSummary = async () => {
      if (!conversationId) {
        setError("No conversation ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/conversation/${conversationId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch summary: ${response.statusText}`);
        }

        const data = await response.json();

        // Since the data is already parsed in the API response, we don't need to parse it again
        setSummaryData({
          summary: Array.isArray(data.summary) ? data.summary : data.summary,
          actions: (data.executedActions || []).map((action: Action) => ({
            id: action.type,
            type: action.type,
            description: action.metadata?.notes || "",
            status: action.success ? "completed" : "pending",
            metadata: action.metadata,
          })),
          date: data.createdAt, // Update to match the API response field
          duration: data.duration,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load summary";
        setError(errorMessage);
        toast.error("Error", {
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [conversationId]);
  const handleBackToHome = () => {
    router.push("/");
  };

  const handleExportTranscript = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(
        `/api/conversation/${conversationId}/export`,
        {
          method: "GET",
        }
      );

      if (!response.ok) throw new Error("Failed to export transcript");

      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `conversation-${conversationId}.md`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t.exportSuccess);
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t.exportError);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" />
          <span>{t.loading}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleBackToHome}>{t.backToHome}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen",
        isClinicianView ? "bg-blue-50" : "bg-green-50"
      )}
    >
      <header
        className={cn(
          "p-4",
          isClinicianView ? "bg-blue-600 text-white" : "bg-green-600 text-white"
        )}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 text-white hover:bg-white/20"
                onClick={handleBackToHome}
              >
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-xl font-bold">{t.conversationSummary}</h1>
            </div>
            {summaryData.date && (
              <div className="text-sm opacity-80">
                {new Date(summaryData.date).toLocaleDateString()}
                {summaryData.duration && ` • ${summaryData.duration}`}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Summary Card */}
          <Card className="mb-6">
            <CardHeader className="bg-slate-50">
              <CardTitle className="flex items-center">
                <FileText className="mr-2" size={20} />
                {t.summary}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {summaryData.summary.length > 0 ? (
                <ul className="space-y-2">
                  {summaryData.summary.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-slate-400 mr-2">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic">{t.noSummaryAvailable}</p>
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="mb-6">
            <CardHeader className="bg-slate-50">
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2" size={20} />
                {t.detectedActions}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {summaryData.actions.length > 0 ? (
                <ul className="space-y-4">
                  {summaryData.actions.map((action) => (
                    <li key={action.id} className="flex items-start">
                      <Badge
                        className={cn(
                          "mr-3 mt-0.5",
                          action.status === "completed"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : action.status === "pending"
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                        )}
                      >
                        {action.status}
                      </Badge>
                      <div>
                        <div className="font-medium">{action.type}</div>
                        <div className="text-sm text-slate-600">
                          {action.description}
                          {action.metadata && (
                            <div className="mt-1 text-xs text-slate-500">
                              {action.metadata.date && (
                                <div>Date: {action.metadata.date}</div>
                              )}
                              {action.metadata.testType && (
                                <div>Test: {action.metadata.testType}</div>
                              )}
                              {action.metadata.notes && (
                                <div>Notes: {action.metadata.notes}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic">{t.noActionsDetected}</p>
              )}
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="flex justify-center mt-8 space-x-4">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleBackToHome}
            >
              <ArrowLeft size={16} />
              {t.backToHome}
            </Button>
            <Button
              className="flex items-center gap-2"
              onClick={handleExportTranscript}
            >
              <Download size={16} />
              {t.exportTranscript}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create a loading component
function SummaryLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}

// Main page component
export default function SummaryPage() {
  return (
    <Suspense fallback={<SummaryLoading />}>
      <SummaryContent />
    </Suspense>
  );
}
