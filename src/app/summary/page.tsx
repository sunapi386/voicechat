"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, ArrowLeft, CheckCircle } from "lucide-react"

type MessageRole = "clinician" | "patient"

interface Action {
  id: string
  type: string
  description: string
  status: "completed" | "pending" | "cancelled"
}

export default function SummaryPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get the role from URL params
  const role = (searchParams.get("role") as MessageRole) || "clinician"
  const isClinicianView = role === "clinician"

  // State for summary data
  const [summaryPoints, setSummaryPoints] = useState<string[]>([])
  const [actions, setActions] = useState<Action[]>([])

  // Mock data for summary
  useEffect(() => {
    setSummaryPoints([
      "Patient reported severe headache since yesterday",
      "Patient mentioned taking ibuprofen with limited relief",
      "Patient experiencing nausea and dizziness when standing",
      "Clinician ordered blood tests to investigate symptoms",
      "No known allergies to medications were reported",
    ])

    setActions([
      {
        id: "1",
        type: "lab_order",
        description: "Complete blood count (CBC) ordered",
        status: "completed",
      },
      {
        id: "2",
        type: "follow_up",
        description: "Schedule follow-up appointment in 1 week",
        status: "pending",
      },
    ])
  }, [])

  const handleBackToHome = () => {
    router.push("/")
  }

  const handleExportTranscript = () => {
    alert("Transcript would be exported as PDF/text here")
  }

  return (
    <div className={cn("min-h-screen", isClinicianView ? "bg-blue-50" : "bg-green-50")}>
      {/* Header */}
      <header className={cn("p-4", isClinicianView ? "bg-blue-600 text-white" : "bg-green-600 text-white")}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 text-white hover:bg-white/20"
              onClick={handleBackToHome}
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold">
              {isClinicianView ? "Conversation Summary" : "Resumen de Conversación"}
            </h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader className="bg-slate-50">
              <CardTitle className="flex items-center">
                <FileText className="mr-2" size={20} />
                {isClinicianView ? "Summary" : "Resumen"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2">
                {summaryPoints.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-slate-400 mr-2">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader className="bg-slate-50">
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2" size={20} />
                {isClinicianView ? "Detected Actions" : "Acciones Detectadas"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {actions.length > 0 ? (
                <ul className="space-y-4">
                  {actions.map((action) => (
                    <li key={action.id} className="flex items-start">
                      <Badge
                        className={cn(
                          "mr-3 mt-0.5",
                          action.status === "completed"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : action.status === "pending"
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              : "bg-red-100 text-red-800 hover:bg-red-100",
                        )}
                      >
                        {action.status}
                      </Badge>
                      <div>
                        <div className="font-medium">{action.type}</div>
                        <div className="text-sm text-slate-600">{action.description}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic">No actions detected</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center mt-8">
            <Button className="flex items-center gap-2" onClick={handleExportTranscript}>
              <Download size={16} />
              {isClinicianView ? "Export Transcript" : "Exportar Transcripción"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

