"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Volume2, RefreshCw, AlertCircle, Check, X } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

// Types for our conversation
type MessageRole = "clinician" | "patient"
type MessageType = "original" | "translation"

interface Message {
  id: string
  role: MessageRole
  text: string
  translation: string
  timestamp: Date
  type: MessageType
}

interface Action {
  id: string
  type: string
  description: string
  confirmed: boolean | null
}

export default function ConversationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isMobile = useMobile()

  // Get the role from URL params (clinician or patient)
  const role = (searchParams.get("role") as MessageRole) || "clinician"
  const isClinicianView = role === "clinician"

  // State for conversation
  const [messages, setMessages] = useState<Message[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [actions, setActions] = useState<Action[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock data for initial messages
  useEffect(() => {
    const initialMessages: Message[] = [
      {
        id: "1",
        role: "clinician",
        text: "Hello, how are you feeling today?",
        translation: "¿Hola, cómo se siente hoy?",
        timestamp: new Date(Date.now() - 120000),
        type: "original",
      },
      {
        id: "2",
        role: "patient",
        text: "Me duele mucho la cabeza desde ayer.",
        translation: "I have had a bad headache since yesterday.",
        timestamp: new Date(Date.now() - 90000),
        type: "original",
      },
      {
        id: "3",
        role: "clinician",
        text: "I'm sorry to hear that. Have you taken any medication for it?",
        translation: "Lamento escuchar eso. ¿Ha tomado algún medicamento para ello?",
        timestamp: new Date(Date.now() - 60000),
        type: "original",
      },
      {
        id: "4",
        role: "patient",
        text: "Tomé ibuprofeno pero no me ayudó mucho.",
        translation: "I took ibuprofen but it didn't help much.",
        timestamp: new Date(Date.now() - 30000),
        type: "original",
      },
    ]

    setMessages(initialMessages)
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Simulate recording and translation
  const handleMicPress = () => {
    setIsRecording(true)
  }

  const handleMicRelease = () => {
    setIsRecording(false)
    setIsTranslating(true)

    // Simulate translation delay
    setTimeout(() => {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: role,
        text: isClinicianView
          ? "I would like to order some blood tests to check for any issues."
          : "Todavía tengo náuseas y mareos cuando me levanto.",
        translation: isClinicianView
          ? "Me gustaría ordenar algunos análisis de sangre para verificar si hay algún problema."
          : "I still have nausea and dizziness when I get up.",
        timestamp: new Date(),
        type: "original",
      }

      setMessages((prev) => [...prev, newMessage])
      setIsTranslating(false)

      // Detect action if clinician mentions tests
      if (isClinicianView && newMessage.text.toLowerCase().includes("tests")) {
        setTimeout(() => {
          setActions((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: "lab_order",
              description: "Blood test order detected",
              confirmed: null,
            },
          ])
        }, 1000)
      }
    }, 2000)
  }

  const handleRepeat = () => {
    // Find the last message from the other role
    const lastMessage = [...messages].reverse().find((m) => m.role !== role)

    if (lastMessage) {
      // Play the audio (simulated)
      alert(`Playing: ${isClinicianView ? lastMessage.text : lastMessage.translation}`)
    }
  }

  const handleActionConfirm = (actionId: string, confirmed: boolean) => {
    setActions((prev) => prev.map((action) => (action.id === actionId ? { ...action, confirmed } : action)))
  }

  const handleEndSession = () => {
    router.push(`/summary?role=${role}`)
  }

  return (
    <div className={cn("min-h-screen flex flex-col", isClinicianView ? "bg-blue-50" : "bg-green-50")}>
      {/* Header */}
      <header
        className={cn(
          "p-4 flex justify-between items-center",
          isClinicianView ? "bg-blue-600 text-white" : "bg-green-600 text-white",
        )}
      >
        <h1 className="text-xl font-bold">
          {isClinicianView ? "Medical Interpreter (Clinician)" : "Intérprete Médico (Paciente)"}
        </h1>
        <Button
          variant="outline"
          className={cn(
            "border-white text-white hover:bg-white",
            isClinicianView ? "hover:text-blue-600" : "hover:text-green-600",
          )}
          onClick={handleEndSession}
        >
          {isClinicianView ? "End Session" : "Finalizar Sesión"}
        </Button>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Split view for desktop */}
        {!isMobile && (
          <>
            <div className="w-1/2 bg-blue-50 p-4 border-r border-slate-200">
              <div className="text-center mb-4">
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  Clinician View (English)
                </Badge>
              </div>
            </div>
            <div className="w-1/2 bg-green-50 p-4">
              <div className="text-center mb-4">
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Patient View (Spanish)
                </Badge>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Conversation area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("mb-4 flex", message.role === "clinician" ? "justify-start" : "justify-end")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  message.role === "clinician" ? "bg-blue-100 text-blue-900" : "bg-green-100 text-green-900",
                )}
              >
                <div className="font-medium mb-1">{message.role === "clinician" ? "Clinician" : "Patient"}</div>
                <p>{isClinicianView || message.role === "clinician" ? message.text : message.text}</p>
                <p className="mt-2 text-sm italic">
                  {isClinicianView || message.role === "patient" ? message.translation : message.translation}
                </p>
                <div className="text-xs mt-1 text-slate-500">{message.timestamp.toLocaleTimeString()}</div>
              </div>
            </div>
          ))}

          {isTranslating && (
            <div className="flex justify-center my-4">
              <Badge variant="outline" className="animate-pulse">
                Translating...
              </Badge>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Action alerts */}
      {actions.length > 0 && (
        <div className="p-4 border-t border-slate-200">
          <div className="max-w-4xl mx-auto">
            {actions
              .filter((a) => a.confirmed === null)
              .map((action) => (
                <Card key={action.id} className="mb-2 bg-amber-50 border-amber-200">
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="text-amber-500 mr-2" size={20} />
                      <span>
                        <strong>{action.type === "lab_order" ? "Lab Order Detected" : action.type}</strong>:{" "}
                        {action.description}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 hover:bg-red-100 hover:text-red-800"
                        onClick={() => handleActionConfirm(action.id, false)}
                      >
                        <X size={16} className="mr-1" /> Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleActionConfirm(action.id, true)}
                      >
                        <Check size={16} className="mr-1" /> Confirm
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className={cn("p-4 border-t border-slate-200", isClinicianView ? "bg-blue-100" : "bg-green-100")}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="rounded-full h-12 w-12" onClick={handleRepeat}>
              <RefreshCw size={20} />
            </Button>
            <span className="text-sm">{isClinicianView ? "Repeat Last" : "Repetir Último"}</span>
          </div>

          <Button
            className={cn(
              "rounded-full h-16 w-16 flex items-center justify-center transition-all",
              isRecording ? "scale-110 shadow-lg" : "",
              isClinicianView ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700",
            )}
            onMouseDown={handleMicPress}
            onMouseUp={handleMicRelease}
            onTouchStart={handleMicPress}
            onTouchEnd={handleMicRelease}
          >
            <Mic size={24} className={isRecording ? "animate-pulse" : ""} />
          </Button>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="rounded-full h-12 w-12">
              <Volume2 size={20} />
            </Button>
            <span className="text-sm">{isClinicianView ? "Play Audio" : "Reproducir Audio"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

