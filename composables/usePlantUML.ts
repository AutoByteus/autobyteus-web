import { plantumlService } from '~/services/plantumlService';

export const usePlantUML = () => {
  const processPlantUmlDiagrams = async () => {
    const diagrams = document.querySelectorAll('.plantuml-diagram');
    
    for (const diagram of diagrams) {
      const content = decodeURIComponent(diagram.getAttribute('data-content') || '');
      const loadingState = diagram.querySelector('.loading-state');
      const errorState = diagram.querySelector('.error-state');
      const diagramContent = diagram.querySelector('.diagram-content');
      
      if (!loadingState || !errorState || !diagramContent) continue;

      try {
        loadingState.style.display = 'flex';
        errorState.style.display = 'none';
        diagramContent.style.display = 'none';

        const imageBlob = await plantumlService.generateDiagram(content);
        const imageUrl = URL.createObjectURL(imageBlob);
        const img = new Image();
        
        img.onload = () => {
          loadingState.style.display = 'none';
          diagramContent.style.display = 'block';
        };
        
        img.onerror = () => {
          loadingState.style.display = 'none';
          errorState.style.display = 'flex';
        };
        
        img.src = imageUrl;
        img.alt = 'PlantUML diagram';
        img.className = 'max-w-full';
        
        diagramContent.innerHTML = '';
        diagramContent.appendChild(img);
      } catch (error) {
        console.error('Failed to process PlantUML diagram:', error);
        loadingState.style.display = 'none';
        errorState.style.display = 'flex';
      }
    }
  };

  return {
    processPlantUmlDiagrams
  };
};