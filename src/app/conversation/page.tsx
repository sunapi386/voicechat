// src/app/conversation/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Mic,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  Info,
  Square,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WebRTCConnector } from "@/components/chat/WebRTCConnector"; // Import the connector
import { AI_ROLE_SHORT } from "@/lib/ai-prompt"; // Import prompts
import { API_ROUTES } from "@/lib/apiRoutes";
import { toast } from "sonner";
import { Language, MessageRole, MessageType } from "@/lib/types";

interface Message {
  id: string;
  role: MessageRole;
  text: string; // Original text if user/clinician, AI response/translation if assistant
  translation?: string; // Optional: Store explicit translation if needed separately
  timestamp: Date;
  type: MessageType;
}

interface Action {
  id: string;
  type: "lab_order" | "follow_up" | string; // Allow string for future types
  description: string;
  confirmed: boolean | null; // null = pending, true = confirmed, false = cancelled
  payload?: any; // Optional payload for execution
}

// --- Main Component ---
function ConversationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Role determination
  // Role and language determination
  const role = (searchParams.get("role") as MessageRole) || "clinician";
  const lang = searchParams.get("lang") || (role === "clinician" ? "en" : "es");
  const isClinicianView = role === "clinician";

  // Helper function for language-specific text
  const getLocalizedText = (en: string, es: string, zh: string) => {
    switch (lang) {
      case "es":
        return es;
      case "zh":
        return zh;
      default:
        return en;
    }
  };

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false); // User is actively holding mic
  const [rtcConnectionState, setRtcConnectionState] = useState<
    RTCPeerConnectionState | "error" | "connecting" | "idle"
  >("idle");
  const [actions, setActions] = useState<Action[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const webRTCConnectorRef = useRef<{
    sendCommand: (type: string, payload?: any) => void;
  }>(null); // Ref for commands

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add initial system message
  useEffect(() => {
    addMessage(
      getLocalizedText(
        `System initialized. Role: Clinician (EN)`,
        `Sistema inicializado. Rol: Paciente (ES)`,
        `系统已初始化。角色：患者 (中文)`
      ),
      "info",
      "assistant"
    );
  }, [isClinicianView]);

  // --- Message Handling ---
  const addMessage = useCallback(
    (
      text: string,
      type: MessageType,
      msgRole: MessageRole,
      translation?: string
    ) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: msgRole,
          text: text,
          translation: translation,
          timestamp: new Date(),
          type: type,
        },
      ]);
      // Play TTS for AI messages if needed (WebRTC handles AI voice, this is for other roles if necessary)
      // if (msgRole === 'assistant' && type !== 'info') {
      //   playTextToSpeech(text);
      // }
    },
    []
  );

  // --- WebRTC Callbacks ---
  const handleMessageReceived = useCallback(
    (text: string, msgRole: MessageRole) => {
      // TODO: Logic to determine if this is an original or translation
      // For now, assume it's the primary text from the assistant/tool
      addMessage(text, "original", msgRole);

      // --- Action Detection (Example) ---
      // This should ideally happen based on structured data from the AI via data channel,
      // but we can do basic keyword spotting on text as a fallback/PoC.
      const lowerText = text.toLowerCase();
      if (
        lowerText.includes("order") &&
        (lowerText.includes("lab") || lowerText.includes("blood test"))
      ) {
        const actionId = `action-${Date.now()}`;
        setActions((prev) => [
          ...prev,
          {
            id: actionId,
            type: "lab_order",
            description: `Detected: "${text.substring(
              0,
              50
            )}..." - Confirm Lab Order?`,
            confirmed: null, // Pending confirmation
            payload: { details: text }, // Store relevant details
          },
        ]);
      } else if (
        lowerText.includes("schedule") &&
        lowerText.includes("follow-up")
      ) {
        const actionId = `action-${Date.now()}`;
        setActions((prev) => [
          ...prev,
          {
            id: actionId,
            type: "follow_up",
            description: `Detected: "${text.substring(
              0,
              50
            )}..." - Confirm Follow-up?`,
            confirmed: null,
            payload: { details: text },
          },
        ]);
      }
      // Add more detection rules
    },
    [addMessage]
  );

  const handleConnectionStateChange = useCallback(
    (state: RTCPeerConnectionState | "error" | "connecting" | "idle") => {
      setRtcConnectionState(state);
      let infoMsg = "";
      if (state === "connected") {
        infoMsg = "Connection established. Start speaking.";
      } else if (state === "connecting") {
        infoMsg = "Attempting to connect...";
      } else if (state === "disconnected") {
        infoMsg = "Connection lost. Attempting to reconnect...";
      } else if (state === "failed") {
        infoMsg = "Connection failed. Please try reconnecting.";
      } else if (state === "closed") {
        infoMsg = "Connection closed.";
      } else if (state === "idle") {
        infoMsg = "Ready to connect.";
      }

      if (infoMsg) {
        // addMessage(infoMsg, "info", "assistant"); // Use 'assistant' or 'system' role for info
        // this is for debugging, not for user
        console.log(infoMsg);
      }
    },

    [addMessage]
  );

  const handleStopRecordingFromConnector = useCallback(() => {
    setIsRecording(false); // Sync state if connector stops it (e.g., AI starts talking)
  }, []);

  // --- User Input (Mic Button) ---
  const handleMicPress = () => {
    if (rtcConnectionState === "connected") {
      setIsRecording(true);
      // Audio sending is toggled by the useEffect watching isRecording + peerConnection
    } else {
      toast("Not Connected", {
        description: "Please start the voice session first.",
      });
    }
  };

  const handleMicRelease = () => {
    if (isRecording) {
      setIsRecording(false);
      // Audio sending is toggled by the useEffect
      // Optional: Send an 'end of speech' marker if API requires it
      // webRTCConnectorRef.current?.sendCommand('end_of_speech');
    }
  };

  // --- Controls ---
  const handleRepeat = () => {
    // Find the last message *spoken by the other party* (needs reliable role tracking)
    // For simplicity, let's find the last message *from the assistant*
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.type !== "info");

    if (lastAssistantMessage) {
      playTextToSpeech(lastAssistantMessage.text); // Use browser TTS for repeat
    } else {
      toast("Nothing to repeat", {
        description: "No previous message from the interpreter found.",
      });
    }
  };

  const playTextToSpeech = async (text: string) => {
    try {
      // First attempt: Use OpenAI TTS
      toast(getLocalizedText("Repeat", "Repetir", "重复一下"));
      const response = await fetch(API_ROUTES.TTS, {
        method: "POST",
        body: JSON.stringify({
          text: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }

      // Convert the response to an audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Clean up the URL after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };

      // Play the audio
      await audio.play();
    } catch (error) {
      console.warn("OpenAI TTS failed, falling back to browser TTS:", error);

      // Fallback: Use browser's SpeechSynthesis
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        // Optional: Set language based on whose text it is
        // utterance.lang = isClinicianView ? 'es-ES' : 'en-US';
        speechSynthesis.cancel(); // Cancel previous speech
        speechSynthesis.speak(utterance);
      } else {
        toast("TTS Not Supported", {
          description: "Text-to-speech is not available in your browser.",
        });
      }
    }
  };

  const handleActionConfirm = async (actionId: string, confirmed: boolean) => {
    const actionIndex = actions.findIndex((a) => a.id === actionId);
    if (actionIndex === -1) return;

    const actionToUpdate = actions[actionIndex];

    // Update UI immediately to show pending->confirmed/cancelled
    setActions((prev) =>
      prev.map((action) =>
        action.id === actionId ? { ...action, confirmed } : action
      )
    );

    if (confirmed) {
      addMessage(
        `Action Confirmed: ${actionToUpdate.type}. Executing...`,
        "info",
        "assistant"
      );
      try {
        const response = await fetch(API_ROUTES.EXECUTE_ACTION, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: actionToUpdate.type,
            payload: actionToUpdate.payload, // Send relevant data
            // Add patient/session context if needed
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(
            `Action execution failed: ${response.status} - ${errorData}`
          );
        }

        const result = await response.json(); // Assuming backend confirms success
        addMessage(
          `Action Executed: ${actionToUpdate.type}. ${result.message || ""}`,
          "info",
          "tool"
        );
        toast("Action Sent", {
          description: `${actionToUpdate.type} sent to system.`,
        });
        // Update action status definitively after backend confirmation if needed
        // setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'completed' } : a)); // If backend returns status
      } catch (error: any) {
        console.error("Failed to execute action:", error);
        addMessage(
          `Action Failed: ${actionToUpdate.type}. Error: ${error.message}`,
          "info",
          "assistant"
        );
        toast("Action Failed", {
          description: error.message,
        });
        // Optionally revert UI confirmation state on failure
        // setActions(prev => prev.map(a => a.id === actionId ? { ...a, confirmed: null } : a));
      }
    } else {
      // Action cancelled
      addMessage(
        `Action Cancelled: ${actionToUpdate.type}`,
        "info",
        "assistant"
      );
      toast("Action Cancelled");
      // Remove from pending actions list or mark as cancelled
      setActions((prev) => prev.filter((action) => action.id !== actionId));
    }
  };

  const handleEndSession = async () => {
    // 1. Stop WebRTC connection if active
    setIsRecording(false);
    if (
      rtcConnectionState === "connected" ||
      rtcConnectionState === "connecting"
    ) {
      console.warn(
        "Please stop the voice session using the dedicated button before ending."
      );
      toast("Please stop the voice session first", {});
      return;
    }

    try {
      // 2. Save transcript and get conversation ID
      const response = await fetch(API_ROUTES.SAVE_CONVERSATION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: messages }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save conversation: ${response.statusText}`);
      }

      const { id } = await response.json();

      // 3. Navigate to summary page with conversation ID
      router.push(`/summary?role=${role}&lang=${lang}&conversationId=${id}`);
    } catch (error) {
      console.error("Error ending session:", error);
      toast("Error", {
        description: "Failed to save conversation. Please try again.",
      });
    }
  };

  // --- Rendering ---
  return (
    <div
      className={cn(
        "min-h-screen flex flex-col",
        isClinicianView ? "bg-blue-50" : "bg-green-50"
      )}
    >
      {/* Header */}
      <header
        className={cn(
          "p-4 flex justify-between items-center sticky top-0 z-10 shadow",
          isClinicianView ? "bg-blue-600 text-white" : "bg-green-600 text-white"
        )}
      >
        <div>
          <h1 className="text-xl font-bold">
            {getLocalizedText(
              "Medical Interpreter",
              "Intérprete Médico",
              "医疗翻译"
            )}
          </h1>

          <div className="text-xs opacity-80 flex items-center gap-1">
            <Info size={12} /> {AI_ROLE_SHORT}
            <span
              className={cn(
                "ml-2 w-2 h-2 rounded-full inline-block",
                rtcConnectionState === "connected"
                  ? "bg-green-400 animate-pulse"
                  : rtcConnectionState === "connecting"
                  ? "bg-yellow-400 animate-pulse"
                  : rtcConnectionState === "error" ||
                    rtcConnectionState === "failed"
                  ? "bg-red-500"
                  : "bg-gray-400"
              )}
            ></span>
            {rtcConnectionState}
          </div>
        </div>

        <Button
          variant="outline"
          className={cn(
            "border-white text-gray-300 hover:bg-white",
            isClinicianView ? "hover:text-blue-600" : "hover:text-green-600"
          )}
          onClick={handleEndSession}
        >
          {getLocalizedText("End Session", "Finalizar Sesión", "结束会话")}
        </Button>
      </header>

      {/* Conversation area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={`msg-${message.id}-${index}`}
              className={cn(
                "flex",
                message.role === "clinician"
                  ? "justify-start"
                  : message.role === "patient"
                  ? "justify-end"
                  : message.role === "assistant" || message.role === "tool"
                  ? "justify-center"
                  : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3 shadow-sm",
                  message.role === "clinician"
                    ? "bg-blue-100 text-blue-900"
                    : message.role === "patient"
                    ? "bg-green-100 text-green-900"
                    : message.role === "assistant"
                    ? "bg-slate-100 text-slate-800 text-center"
                    : message.role === "tool"
                    ? "bg-purple-100 text-purple-900 text-center italic"
                    : "bg-gray-100 text-gray-800" // Default/System/Info
                )}
              >
                {/* Optionally show role, especially for assistant/tool/info */}
                {(message.role === "assistant" ||
                  message.role === "tool" ||
                  message.type === "info") && (
                  <div className="font-medium mb-1 text-xs uppercase opacity-70">
                    {message.role}
                  </div>
                )}
                {message.role === "clinician" && (
                  <div className="font-medium mb-1">Clinician</div>
                )}
                {message.role === "patient" && (
                  <div className="font-medium mb-1">Patient</div>
                )}

                {/* Display logic: Show main text. Show translation based on view */}
                <p>{message.text}</p>
                {/* Show translation only if it exists and is relevant to the current view */}
                {message.translation &&
                  ((isClinicianView && message.role === "patient") || // Show EN translation of ES patient speech
                    (!isClinicianView && message.role === "clinician") || // Show ES translation of EN clinician speech
                    (message.role === "assistant" && message.translation)) && ( // Show translation if assistant provided both
                    <p className="mt-2 text-sm opacity-70 italic">
                      Translation: {message.translation}
                    </p>
                  )}

                <div className="text-xs mt-1 text-slate-500 opacity-80">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {/* Display Translating/Thinking indicator ? */}
          {/* Need a state for this, e.g., isAiProcessing */}
          {/* {isAiProcessing && (
            <div className="flex justify-center my-4">
                <Badge variant="outline" className="animate-pulse bg-slate-100">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Interpreter processing...
                </Badge>
            </div>
            )} */}
          <div ref={messagesEndRef} /> {/* Scroll target */}
        </div>
      </div>

      {/* WebRTC Connection Controls */}
      <WebRTCConnector
        onMessageReceived={handleMessageReceived}
        onConnectionStateChange={handleConnectionStateChange}
        isRecording={isRecording} // Pass recording state down
        onStopRecording={handleStopRecordingFromConnector} // Pass callback down
        language={lang as Language}
        ref={webRTCConnectorRef} // Enable if you need to call sendCommand from parent
      />

      {/* Action alerts */}
      {actions.filter((a) => a.confirmed === null).length > 0 && (
        <div className="p-4 border-t border-slate-200 bg-white sticky bottom-[88px] md:bottom-[72px] z-10">
          {/* Adjust bottom based on control bar height */}
          <div className="max-w-4xl mx-auto space-y-2">
            <h3 className="text-sm font-medium text-amber-700 mb-1">
              {getLocalizedText(
                "Pending Actions:",
                "Acciones Pendientes:",
                "待处理操作："
              )}
            </h3>

            {actions
              .filter((a) => a.confirmed === null)
              .map((action) => (
                <Card
                  key={action.id}
                  className="mb-2 bg-amber-50 border-amber-200 shadow-none"
                >
                  <div className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-start text-sm">
                      <AlertCircle
                        className="text-amber-500 mr-2 mt-0.5 flex-shrink-0"
                        size={16}
                      />
                      <span className="break-words">
                        <strong>
                          {action.type.replace("_", " ").toUpperCase()}?
                        </strong>{" "}
                        {action.description}
                      </span>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100 h-8 px-2"
                        onClick={() => handleActionConfirm(action.id, false)}
                      >
                        <X size={14} className="mr-1" />
                        {getLocalizedText("No", "No", "否")}
                      </Button>

                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 h-8 px-2"
                        onClick={() => handleActionConfirm(action.id, true)}
                      >
                        <Check size={14} className="mr-1" />
                        {getLocalizedText("Yes", "Sí", "是")}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Controls Area */}
      <div
        className={cn(
          "p-4 border-t border-slate-200 sticky bottom-0 z-10",
          isClinicianView ? "bg-blue-100" : "bg-green-100"
        )}
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Repeat Button */}
          <div className="flex items-center gap-2 md:order-1">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 bg-white disabled:opacity-50"
              onClick={handleRepeat}
              disabled={rtcConnectionState !== "connected"}
            >
              <RefreshCw size={18} />
            </Button>
            <span className="text-sm hidden md:inline">
              {getLocalizedText(
                "Repeat Last",
                "Repetir Último",
                "请你重复一下"
              )}
            </span>
          </div>

          {/* Mic Button */}
          <button
            type="button"
            className={cn(
              "rounded-full h-16 w-16 flex items-center justify-center transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              isRecording ? "scale-110 shadow-lg animate-pulse" : "shadow",
              isClinicianView
                ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                : "bg-green-600 hover:bg-green-700 focus:ring-green-500",
              rtcConnectionState !== "connected" &&
                "bg-gray-400 hover:bg-gray-400" // Disabled look
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              handleMicPress();
            }} // Use MouseDown/Up for hold behavior
            onMouseUp={(e) => {
              e.preventDefault();
              handleMicRelease();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              handleMicPress();
            }} // Support touch
            onTouchEnd={(e) => {
              e.preventDefault();
              handleMicRelease();
            }}
            onMouseLeave={handleMicRelease} // Stop recording if mouse leaves button while held
            disabled={rtcConnectionState !== "connected"}
            aria-label={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? (
              <Square size={24} fill="white" /> // Show square when recording
            ) : (
              <Mic size={24} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Create a loading component
function ConversationLoading() {
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
export default function ConversationPage() {
  return (
    <Suspense fallback={<ConversationLoading />}>
      <ConversationContent />
    </Suspense>
  );
}
