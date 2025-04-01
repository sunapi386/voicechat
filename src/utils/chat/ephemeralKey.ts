// src/utils/chat/ephemeralKey.ts
import { API_ROUTES } from "@/lib/apiRoutes"; // We'll define this shortly

// This function assumes a backend endpoint exists at API_ROUTES.GENERATE_EPHEMERAL_KEY
// It might need adjustments based on your auth strategy (if any for PoC)
export const fetchEphemeralKey = async (
  role: string
): // access_token: string | undefined, // Adapt if using auth
Promise<{ value: string; expires_at: number }> => {
  try {
    const language = role != "patient" ? "en-US" : "es-ES";
    const response = await fetch(API_ROUTES.GENERATE_EPHEMERAL_KEY, {
      method: "POST",
      // Add headers if needed, e.g., for authentication
      headers: {
        //  'Authorization': `Bearer ${access_token}`,
        Language: language,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch ephemeral key: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();
    if (!result.ephemeral_key || !result.ephemeral_key.value) {
      throw new Error("Invalid ephemeral key format received from server.");
    }
    return result.ephemeral_key;
  } catch (error) {
    console.error("Error in fetchEphemeralKey:", error);
    // Re-throw or return a specific error structure
    throw error;
  }
};
