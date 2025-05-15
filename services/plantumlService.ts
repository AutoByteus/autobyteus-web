import apiService from './api';

export const plantumlService = {
  async generateDiagram(content: string): Promise<Blob> {
    try {
      const response = await apiService.post('/diagram', { content }, { responseType: 'blob' });
      // For successful blob responses, response.data is already the Blob.
      return response.data;
    } catch (error: any) {
      let extractedMessage = ''; 

      if (error.response && error.response.data) {
        let responseData = error.response.data;
        
        // Check if responseData is a Blob first (can happen if server sends blob for error, though unlikely for JSON detail)
        // Axios with responseType: 'blob' might try to convert error responses to Blob too if Content-Type suggests it.
        // If it's a Blob, we need to read it as text.
        if (responseData instanceof Blob) {
          try {
            // Try to read blob as text, assuming it might contain JSON
            const errorText = await responseData.text();
            responseData = JSON.parse(errorText); // Attempt to parse it as JSON
             if (typeof responseData.detail === 'string' && responseData.detail.trim() !== '') {
              extractedMessage = responseData.detail.trim();
            }
          } catch (blobReadError) {
            // Failed to read or parse blob, log and proceed to other fallbacks
            console.error('Failed to read or parse error response blob:', blobReadError);
          }
        }
        // If not a blob, or blob processing failed to extract message, check if it's an object or string
        if (!extractedMessage) {
            if (typeof responseData === 'object' && responseData !== null) {
                // Case 1: responseData is already an object
                if (typeof responseData.detail === 'string' && responseData.detail.trim() !== '') {
                    extractedMessage = responseData.detail.trim();
                }
            } else if (typeof responseData === 'string') {
                // Case 2: responseData is a string, try to parse as JSON
                try {
                    const parsedData = JSON.parse(responseData);
                    if (typeof parsedData.detail === 'string' && parsedData.detail.trim() !== '') {
                        extractedMessage = parsedData.detail.trim();
                    }
                } catch (parseError) {
                    // Not a JSON string, or JSON string without 'detail'.
                    // It might be a plain text error message string from the server.
                    // However, FastAPI usually sends JSON for HTTPExceptions.
                    // If parsing fails, and it's a non-empty string, consider using it directly
                    // but only if we haven't found a detail yet.
                    // For now, we prioritize 'detail' or let it fall to error.message.
                    console.warn('Failed to parse error.response.data string as JSON, or no detail field found:', parseError);
                }
            }
        }
      }
      
      // Priority 2 (or 3 if blob/parsing happened): Fallback to error.message
      if (!extractedMessage && error.message && typeof error.message === 'string' && error.message.trim() !== '') {
        extractedMessage = error.message.trim();
      }

      // Final safety net: if no message was extracted, provide a generic one.
      if (!extractedMessage) {
        extractedMessage = 'An unexpected error occurred while generating the diagram.';
      }
      
      // IMPORTANT: The `generateDiagram` function is async due to `responseData.text()`.
      // We must ensure the entire catch block completes before throwing.
      // Since we are in a catch block of an async function, `throw new Error` is fine.
      throw new Error(extractedMessage);
    }
  }
};
