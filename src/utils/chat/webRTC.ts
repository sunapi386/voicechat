// src/utils/chat/webRTC.ts

// Define types for message handling callbacks
type HandleTextMessage = (text: string, role: "assistant" | "user") => void;
type HandleError = (error: Error) => void;
type HandleConnectionStateChange = (state: RTCPeerConnectionState) => void;

interface SetupOptions {
  ephemeralKeyValue: string;
  onTextMessage: HandleTextMessage;
  onError: HandleError;
  onConnectionStateChange: HandleConnectionStateChange;
  // Add other callbacks as needed (e.g., for specific events)
}

export const setupWebRTCConnection = async ({
  ephemeralKeyValue, // Assuming this key is needed for auth with the *specific* OpenAI endpoint
  onTextMessage,
  onError,
  onConnectionStateChange,
}: SetupOptions): Promise<{
  peerConnection: RTCPeerConnection;
  audioElement: HTMLAudioElement;
  dataChannel: RTCDataChannel | null;
}> => {
  let pc: RTCPeerConnection | null = null;
  let audio: HTMLAudioElement | null = null;
  let dc: RTCDataChannel | null = null;

  try {
    pc = new RTCPeerConnection();
    audio = new Audio();
    audio.autoplay = true; // Ensure audio plays automatically

    // --- State Change Handler ---
    pc.onconnectionstatechange = () => {
      onConnectionStateChange(pc?.connectionState ?? "disconnected");
    };

    // --- Track Handler (Receiving AI Audio) ---
    pc.ontrack = (event) => {
      console.log("Track received:", event.track.kind);
      if (audio && event.track.kind === "audio") {
        if (!audio.srcObject) {
          audio.srcObject = new MediaStream();
        }
        (audio.srcObject as MediaStream).addTrack(event.track);
        audio.play().catch((err) => {
          console.error("Audio play failed:", err);
          onError(new Error(`Failed to play incoming audio: ${err.message}`));
        });
      }
    };

    // --- ICE Candidate Handling ---
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        // In a real-world scenario with intermediate signaling,
        // you'd send this candidate to the peer via your signaling server.
        // For direct connection to OpenAI API, this might not be needed in this direction
        // if the API handles ICE itself after receiving the offer. Check docs.
        console.log("Local ICE candidate generated:", event.candidate);
      }
    };

    // --- Get Local Media ---
    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      // video: false // Ensure no video is requested
    });

    // Add local audio track (initially disabled until user speaks)
    localStream.getTracks().forEach((track) => {
      if (track.kind === "audio") {
        track.enabled = false; // Start disabled
        pc?.addTrack(track, localStream);
      }
    });

    // --- Create Offer ---
    // Add a transceiver for receiving audio explicitly if needed
    pc.addTransceiver("audio", { direction: "recvonly" });
    // Add a transceiver for the data channel if needed (check OpenAI docs)
    // pc.addTransceiver('data', { direction: 'recvonly' }); // Hypothetical
    // Error: Failed to execute 'addTransceiver' on 'RTCPeerConnection': The argument provided as parameter 1 is not a valid MediaStreamTrack kind ('audio' or 'video').

    // --- Create Data Channel (Sending Commands like 'repeat' - Assumption!) ---
    // This assumes *we* initiate the data channel. OpenAI might initiate it.
    // Verify with docs. Name might be important (e.g., 'control', 'input').
    dc = pc.createDataChannel("client_input", { ordered: true });
    dc.onopen = () => console.log("Client data channel opened.");
    dc.onclose = () => console.log("Client data channel closed.");
    dc.onerror = (err) => {
      console.error("Client data channel error:", err);
      onError(new Error("Client data channel failed."));
    };
    dc.addEventListener("message", (e) => {
      try {
        const message = JSON.parse(e.data);

        switch (message.type) {
          // Handle AI responses
          // case "response.audio_transcript.delta":
          //   onTextMessage(message.delta, "assistant");
          //   break;

          case "response.audio_transcript.done":
            onTextMessage(message.transcript, "assistant");
            break;

          // // Handle human input transcription
          // case "conversation.item.input_audio_transcription.delta":
          //   onTextMessage(message.delta, "user");
          //   break;

          case "conversation.item.input_audio_transcription.completed":
            onTextMessage(message.transcript, "user");
            break;

          // Handle errors
          case "conversation.item.input_audio_transcription.failed":
            onError(
              new Error(
                `Transcription failed: ${
                  message.error?.message || "Unknown error"
                }`
              )
            );
            break;

          default:
            // Optionally log unhandled message types
            console.debug("Unhandled data channel message type:", message.type);
        }
      } catch (err) {
        console.error("Failed to parse data channel message:", err);
        onError(
          err instanceof Error ? err : new Error("Failed to parse message")
        );
      }
    });

    console.log("Client data channel created.");

    const offerOptions: RTCOfferOptions = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: false, // Explicitly false
    };
    const offer = await pc.createOffer(offerOptions);

    const headers: HeadersInit = {
      Authorization: `Bearer ${ephemeralKeyValue}`,
      "Content-Type": "application/sdp",
    };

    await pc.setLocalDescription(offer);
    console.log("Local description set (Offer):", offer.sdp);

    // --- Connect to OpenAI Realtime API ---
    const finalApiUrl = `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;

    console.log("Sending offer to:", finalApiUrl);
    const apiResponse = await fetch(
      finalApiUrl, // Use the URL confirmed by OpenAI docs
      {
        method: "POST",
        headers: headers, // Send custom headers if needed
        body: offer.sdp, // Send offer SDP
      }
    );

    if (
      !apiResponse.ok /* || apiResponse.headers.get('content-type') !== 'application/sdp' */
    ) {
      const errorText = await apiResponse.text();
      console.error("Realtime API Error Response:", errorText);
      throw new Error(
        `Realtime API error: ${apiResponse.status} ${apiResponse.statusText} - ${errorText}`
      );
    }

    // Add logging for the content-type
    console.log(
      "Response content-type:",
      apiResponse.headers.get("content-type")
    );

    // The response appears to be valid SDP data, so proceed with setting it
    const answerSdp = await apiResponse.text();
    console.log("Received Answer SDP:", answerSdp);

    // Validate that it looks like SDP data
    if (!answerSdp.includes("v=0")) {
      throw new Error("Invalid SDP response received");
    }

    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    console.log("Remote description set (Answer)");

    // Ensure connection becomes stable
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Connection timed out")),
        10000
      ); // 10s timeout
      pc!.oniceconnectionstatechange = () => {
        console.log("ICE Connection State:", pc!.iceConnectionState);
        if (
          pc!.iceConnectionState === "connected" ||
          pc!.iceConnectionState === "completed"
        ) {
          clearTimeout(timeout);
          resolve();
        } else if (
          pc!.iceConnectionState === "failed" ||
          pc!.iceConnectionState === "closed"
        ) {
          clearTimeout(timeout);
          reject(
            new Error(
              `ICE connection failed or closed: ${pc!.iceConnectionState}`
            )
          );
        }
      };
      // Check initial state in case it's already connected
      if (
        pc!.iceConnectionState === "connected" ||
        pc!.iceConnectionState === "completed"
      ) {
        clearTimeout(timeout);
        resolve();
      }
    });

    console.log("WebRTC connection established successfully.");
    return { peerConnection: pc, audioElement: audio, dataChannel: dc };
  } catch (error) {
    console.error("Error setting up WebRTC connection:", error);
    // Cleanup partially created resources
    if (pc) pc.close();
    if (audio) {
      audio.pause();
      audio.srcObject = null;
    }
    onError(error instanceof Error ? error : new Error(String(error)));
    // Re-throw the error after cleaning up and notifying
    throw error;
  }
};

// Function to send text commands via Data Channel
export const sendCommandViaDataChannel = (
  dc: RTCDataChannel | null,
  command: object
) => {
  if (dc && dc.readyState === "open") {
    try {
      dc.send(JSON.stringify(command));
      console.log("Sent command via DC:", command);
    } catch (error) {
      console.error("Failed to send command via DC:", error);
    }
  } else {
    console.warn(
      "Cannot send command: Data channel not open or not available."
    );
  }
};

// Function to toggle audio sending
export const setAudioEnabled = (
  pc: RTCPeerConnection | null,
  enabled: boolean
) => {
  pc?.getSenders().forEach((sender) => {
    if (sender.track?.kind === "audio") {
      sender.track.enabled = enabled;
      console.log(`Audio track ${enabled ? "enabled" : "disabled"}`);
    }
  });
};
