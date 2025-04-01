// src/components/chat/WebRTCConnector.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { fetchEphemeralKey } from "@/utils/chat/ephemeralKey";
import {
  setupWebRTCConnection,
  setAudioEnabled,
  sendCommandViaDataChannel,
} from "@/utils/chat/webRTC";
import { Loader2, Phone, PhoneOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface WebRTCConnectorProps {
  onMessageReceived: (text: string, role: "assistant" | "tool") => void;
  onConnectionStateChange: (
    state: RTCPeerConnectionState | "error" | "connecting" | "idle"
  ) => void;
  isRecording: boolean; // Controlled by parent (mic button)
  onStopRecording: () => void; // Callback to signal parent recording stopped
  role: "clinician" | "patient" | "assistant"; // To know which language context, if needed
  // Add other callbacks if needed, e.g., onSummary, onActionDetected
}

export const WebRTCConnector: React.FC<WebRTCConnectorProps> = ({
  onMessageReceived,
  onConnectionStateChange,
  isRecording,
  onStopRecording,
  role,
}) => {
  const [connectionState, setConnectionState] = useState<
    RTCPeerConnectionState | "error" | "connecting" | "idle"
  >("idle");
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInternalConnectionState = useCallback(
    (state: RTCPeerConnectionState) => {
      console.log("RTC Connection State:", state);
      setConnectionState(state);
      onConnectionStateChange(state);
      if (
        state === "failed" ||
        state === "closed" ||
        state === "disconnected"
      ) {
        setError(`Connection ${state}. Please reconnect.`);
        // Automatically stop if connection drops unexpectedly
        if (peerConnection) {
          stopConversation(false); // Don't trigger parent stop if already stopped
        }
      } else if (state === "connected") {
        setError(null); // Clear error on successful connection
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [onConnectionStateChange]
  ); // Add stopConversation if needed

  const handleTextMessage = useCallback(
    (text: string, role: "assistant" | "tool") => {
      onMessageReceived(text, role);
      // Stop local recording visualisation if AI starts talking
      if (role === "assistant") {
        onStopRecording();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [onMessageReceived]
  );

  const handleError = useCallback(
    (err: Error) => {
      console.error("WebRTC Error:", err);
      setError(`Error: ${err.message}`);
      setConnectionState("error");
      onConnectionStateChange("error");
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: err.message || "An unknown WebRTC error occurred.",
      });
      // Ensure cleanup happens
      if (peerConnection) {
        stopConversation(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [toast, onConnectionStateChange]
  ); // Add stopConversation if needed

  // Define stopConversation with useCallback to stabilize its identity
  const stopConversation = useCallback(
    (notifyParent = true) => {
      console.log("Stopping conversation...");
      if (peerConnection) {
        setAudioEnabled(peerConnection, false); // Ensure audio sending stops
        peerConnection.close();
        setPeerConnection(null);
      }
      if (audioElement) {
        audioElement.pause();
        audioElement.srcObject = null;
        setAudioElement(null);
      }
      if (dataChannel) {
        dataChannel.close();
        setDataChannel(null);
      }
      setAudioEnabled(peerConnection, false); // Ensure mic track is disabled
      setConnectionState("idle");
      onConnectionStateChange("idle");
      if (notifyParent) {
        onStopRecording(); // Ensure parent state reflects stop
      }
      // setError(null); // Keep error message if stopped due to error? Or clear? Decide UX.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      peerConnection,
      audioElement,
      dataChannel,
      onConnectionStateChange,
      onStopRecording,
    ]
  );

  const startConversation = useCallback(async () => {
    setError(null);
    setConnectionState("connecting");
    onConnectionStateChange("connecting");

    try {
      // Fetch ephemeral key (if needed by your specific OpenAI endpoint)
      // For standard OpenAI API keys, you might handle auth differently (e.g., backend proxy)
      const ephemeralKey = await fetchEphemeralKey(
        role /* pass auth token if required */
      );
      if (!ephemeralKey?.value) {
        throw new Error("Invalid or missing ephemeral key.");
      }

      const {
        peerConnection: pc,
        audioElement: audio,
        dataChannel: dc,
      } = await setupWebRTCConnection({
        ephemeralKeyValue: ephemeralKey.value,
        onTextMessage: handleTextMessage,
        onError: handleError,
        onConnectionStateChange: handleInternalConnectionState,
        // Pass other callbacks if setupWebRTCConnection expects them
      });

      setPeerConnection(pc);
      setAudioElement(audio);
      setDataChannel(dc); // Store the data channel reference
      // State should update via onConnectionStateChange callback
    } catch (error: any) {
      console.error("Failed to start conversation:", error);
      // handleError callback within setupWebRTCConnection should have already run
      // but we set state here just in case setup fails before callbacks are attached
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    handleError,
    handleInternalConnectionState,
    handleTextMessage,
    onConnectionStateChange,
  ]);

  // Effect to handle microphone toggle based on parent state
  useEffect(() => {
    if (
      peerConnection &&
      (connectionState === "connected" || connectionState === "connecting")
    ) {
      // Only toggle if connection exists/is forming
      setAudioEnabled(peerConnection, isRecording);
    }
  }, [isRecording, peerConnection, connectionState]);

  // Effect for cleanup on unmount
  useEffect(() => {
    return () => {
      stopConversation(false); // Clean up on component unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount/unmount

  // Public method to send commands (like 'repeat')
  // This could be exposed via a ref if needed by the parent, or called internally
  const sendCommand = useCallback(
    (commandType: string, payload?: any) => {
      const command = { type: commandType, ...payload };
      sendCommandViaDataChannel(dataChannel, command);
    },
    [dataChannel]
  );

  // Example: Expose sendCommand via ref (alternative to passing callbacks up)
  // useImperativeHandle(ref, () => ({
  //   sendCommand,
  // }));

  return (
    <div className="flex flex-col items-center gap-2 my-4">
      {connectionState === "idle" && (
        <Button onClick={startConversation} className="w-full max-w-xs">
          <Phone className="mr-2 h-4 w-4" /> Start Voice Session
        </Button>
      )}

      {connectionState === "connecting" && (
        <Button disabled className="w-full max-w-xs">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </Button>
      )}

      {connectionState === "connected" && (
        <Button
          onClick={() => stopConversation(true)}
          variant="destructive"
          className="w-full max-w-xs"
        >
          <PhoneOff className="mr-2 h-4 w-4" /> Stop Voice Session
        </Button>
      )}

      {(connectionState === "disconnected" ||
        connectionState === "failed" ||
        connectionState === "closed") &&
        connectionState !== "idle" && (
          <Button onClick={startConversation} className="w-full max-w-xs">
            <Phone className="mr-2 h-4 w-4" /> Reconnect
          </Button>
        )}

      {error && (
        <div className="text-red-600 text-sm flex items-center gap-1 mt-1">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}
      {/* Debugging display - remove later */}
      {/* <div className="text-xs text-gray-500 mt-1">State: {connectionState} | Mic Sends: {isRecording ? 'ON' : 'OFF'}</div> */}
    </div>
  );
};

// If using ref:
// export default React.forwardRef(WebRTCConnector);
