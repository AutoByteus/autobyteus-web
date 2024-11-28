import apiService from './api';

export const plantumlService = {
  async generateDiagram(content: string): Promise<Blob> {
    try {
      const response = await apiService.post('/diagram', { content }, { responseType: 'blob' });
      return response.data;
    } catch (error) {
      throw new Error('Failed to generate diagram');
    }
  }
};