// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, FileText, Settings, Database } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Conversation {
  id: string;
  date: string;
  patientId: string;
  duration: string;
  summary: string;
  actions: number;
}

export default function AdminPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleViewDetails = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/conversation");
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSummary = (summaryJson: string) => {
    try {
      const summary = JSON.parse(summaryJson);
      return `${summary.visitSummary} Diagnosis: ${summary.diagnosis}`;
    } catch (e) {
      console.error("Error parsing summary JSON:", e);
      return summaryJson;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-800 text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2 text-white hover:bg-white/20"
                >
                  <ArrowLeft size={20} />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="conversations">
            <TabsList className="mb-6">
              <TabsTrigger value="conversations" className="flex items-center">
                <FileText size={16} className="mr-2" />
                Conversations
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center">
                <Settings size={16} className="mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center">
                <Database size={16} className="mr-2" />
                Integrations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conversations">
              <Card>
                <CardHeader className="bg-slate-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle>Conversation History</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchConversations}
                      disabled={isLoading}
                    >
                      {isLoading ? "Refreshing..." : "Refresh"}
                    </Button>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                      <Input
                        type="search"
                        placeholder="Search by patient ID or summary..."
                        className="pl-8 w-full md:w-80"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                            Patient ID
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                            Duration
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                            Summary
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                            Actions
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">
                            View
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {" "}
                        {isLoading ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center">
                              Loading conversations...
                            </td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-8 text-center text-red-500"
                            >
                              {error}
                            </td>
                          </tr>
                        ) : filteredConversations.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-8 text-center text-slate-500"
                            >
                              No conversations found matching your search
                            </td>
                          </tr>
                        ) : (
                          filteredConversations.map((conv) => (
                            <tr
                              key={conv.id}
                              className="border-b hover:bg-slate-50"
                            >
                              <td className="px-4 py-3 text-sm">{conv.date}</td>
                              <td className="px-4 py-3 text-sm font-medium">
                                {conv.patientId}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {conv.duration}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {formatSummary(conv.summary)}
                              </td>

                              <td className="px-4 py-3 text-sm">
                                {conv.actions}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(conv)}
                                >
                                  View Details
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {selectedConversation && (
                      <Dialog
                        open={!!selectedConversation}
                        onOpenChange={() => setSelectedConversation(null)}
                      >
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Conversation Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-medium mb-2">Summary</h3>
                              {(() => {
                                try {
                                  const summary = JSON.parse(
                                    selectedConversation.summary
                                  );
                                  return (
                                    <div className="space-y-3">
                                      <p>
                                        <strong>Visit Summary:</strong>{" "}
                                        {summary.visitSummary}
                                      </p>
                                      <p>
                                        <strong>Chief Complaint:</strong>{" "}
                                        {summary.chiefComplaint}
                                      </p>
                                      <p>
                                        <strong>Key Findings:</strong>
                                      </p>
                                      <ul className="list-disc pl-5">
                                        {summary.keyFindings.map(
                                          (finding: string, index: number) => (
                                            <li key={index}>{finding}</li>
                                          )
                                        )}
                                      </ul>
                                      <p>
                                        <strong>Diagnosis:</strong>{" "}
                                        {summary.diagnosis}
                                      </p>
                                      <p>
                                        <strong>Treatment Plan:</strong>{" "}
                                        {summary.treatmentPlan}
                                      </p>
                                      <p>
                                        <strong>Follow Up:</strong>{" "}
                                        {summary.followUp}
                                      </p>
                                      <p>
                                        <strong>Medications:</strong>
                                      </p>
                                      <ul className="list-disc pl-5">
                                        {summary.medications.map(
                                          (med: string, index: number) => (
                                            <li key={index}>{med}</li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  );
                                } catch (e) {
                                  console.error(
                                    "Error parsing summary JSON:",
                                    e
                                  );
                                  return <p>{selectedConversation.summary}</p>;
                                }
                              })()}
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">
                                Actions Required
                              </h3>
                              <p>
                                {selectedConversation.actions} action(s) pending
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Translation Settings
                    </h3>
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <Label htmlFor="auto-translate" className="font-medium">
                          Auto-translate
                        </Label>
                        <p className="text-sm text-slate-500">
                          Automatically translate speech without manual
                          confirmation
                        </p>
                      </div>
                      <Switch id="auto-translate" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <Label htmlFor="text-to-speech" className="font-medium">
                          Text-to-speech
                        </Label>
                        <p className="text-sm text-slate-500">
                          Automatically play translated speech
                        </p>
                      </div>
                      <Switch id="text-to-speech" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between pb-4">
                      <div>
                        <Label
                          htmlFor="action-detection"
                          className="font-medium"
                        >
                          Action detection
                        </Label>
                        <p className="text-sm text-slate-500">
                          Detect and suggest actions from conversation
                        </p>
                      </div>
                      <Switch id="action-detection" defaultChecked />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Data Management</h3>
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <Label
                          htmlFor="save-transcripts"
                          className="font-medium"
                        >
                          Save transcripts
                        </Label>
                        <p className="text-sm text-slate-500">
                          Store conversation transcripts in database
                        </p>
                      </div>
                      <Switch id="save-transcripts" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between pb-4">
                      <div>
                        <Label htmlFor="auto-summarize" className="font-medium">
                          Auto-summarize
                        </Label>
                        <p className="text-sm text-slate-500">
                          Generate summaries after each conversation
                        </p>
                      </div>
                      <Switch id="auto-summarize" defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations">
              <Card>
                <CardHeader>
                  <CardTitle>System Integrations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">API Endpoints</h3>
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <Label
                          htmlFor="ehr-integration"
                          className="font-medium"
                        >
                          EHR Integration
                        </Label>
                        <p className="text-sm text-slate-500">
                          Connect to Electronic Health Record system
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="ehr-integration" />
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <Label htmlFor="lab-orders" className="font-medium">
                          Lab Orders API
                        </Label>
                        <p className="text-sm text-slate-500">
                          Connect to laboratory ordering system
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="lab-orders" defaultChecked />
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pb-4">
                      <div>
                        <Label htmlFor="scheduling" className="font-medium">
                          Scheduling API
                        </Label>
                        <p className="text-sm text-slate-500">
                          Connect to appointment scheduling system
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="scheduling" defaultChecked />
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Translation Services
                    </h3>
                    <div className="flex items-center justify-between pb-4">
                      <div>
                        <Label
                          htmlFor="translation-api"
                          className="font-medium"
                        >
                          Translation API
                        </Label>
                        <p className="text-sm text-slate-500">
                          Configure translation service provider
                        </p>
                      </div>
                      <Button variant="outline">Configure API Keys</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
