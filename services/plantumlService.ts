import apiService from './api';

export const plantumlService = {
  async generateDiagram(content: string): Promise<Blob> {
    try {
      const response = await apiService.post('/diagram', { content }, { responseType: 'blob' });
      return response.data;
    } catch (error: any) {
      // Extract the error message from the response if available
      let errorMessage = 'Failed to generate diagram';
      
      // Handle Axios error with response
      if (error.response) {
        // If the response is JSON with a 'detail' field
        if (error.response.data && typeof error.response.data === 'object') {
          try {
            // For JSON error responses
            const errorData = error.response.data;
            if (errorData.detail) {
              // Extract the main part of the error message, ignoring technical details
              const detailMatch = errorData.detail.match(/Diagram generation failed: (.+)/);
              errorMessage = detailMatch ? detailMatch[1] : errorData.detail;
            }
          } catch (jsonError) {
            // If parsing fails, try to read as text
            errorMessage = typeof error.response.data === 'string' 
              ? error.response.data 
              : 'Error generating diagram';
          }
        } else if (typeof error.response.data === 'string') {
          // For text error responses
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        // For network errors or other issues
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
};
