import { plantumlService } from '~/services/plantumlService';

// Caches persist across component lifecycles:
const globalSuccessCache = new Map<string, string>();     // diagramId -> imageUrl
const globalErrorCache   = new Map<string, string>();     // diagramId -> errorMessage

export const usePlantUML = () => {
  // Track in-flight/processed in this cycle
  const processedDiagrams = new Map<string, boolean>(); // diagramId -> success?
  const blobUrls = new Set<string>();

  const cleanupBlobUrls = () => {
    blobUrls.forEach(url => URL.revokeObjectURL(url));
    blobUrls.clear();
  };

  const processPlantUmlDiagrams = async () => {
    const diagrams = document.querySelectorAll('.plantuml-diagram');

    for (const diagram of diagrams) {
      const content   = decodeURIComponent(diagram.getAttribute('data-content') || '');
      const diagramId = diagram.getAttribute('data-diagram-id');
      if (!diagramId) continue;

      const loadingState   = diagram.querySelector<HTMLElement>('.loading-state');
      const errorState     = diagram.querySelector<HTMLElement>('.error-state');
      const errorMessageEl = diagram.querySelector<HTMLElement>('.error-message');
      const diagramContent = diagram.querySelector<HTMLElement>('.diagram-content');
      if (!loadingState || !errorState || !diagramContent) {
        console.warn('Missing PlantUML DOM elements for', diagramId);
        continue;
      }

      // 1️⃣ If we previously failed, show the cached error
      if (globalErrorCache.has(diagramId)) {
        loadingState.style.display = 'none';
        errorState.style.display   = 'flex';
        diagramContent.style.display = 'none';
        errorMessageEl!.textContent = globalErrorCache.get(diagramId)!;
        continue;
      }

      // 2️⃣ If we have a cached image URL, render immediately
      if (globalSuccessCache.has(diagramId)) {
        loadingState.style.display   = 'none';
        errorState.style.display     = 'none';
        diagramContent.style.display = 'block';

        const img = new Image();
        img.src       = globalSuccessCache.get(diagramId)!;
        img.alt       = 'PlantUML diagram';
        img.className = 'max-w-full';

        diagramContent.innerHTML = '';
        diagramContent.appendChild(img);

        continue;
      }

      // 3️⃣ Skip if already in-flight this cycle
      if (processedDiagrams.has(diagramId)) {
        continue;
      }

      // 4️⃣ Otherwise, fetch it
      processedDiagrams.set(diagramId, false); // mark in-flight
      loadingState.style.display   = 'flex';
      errorState.style.display     = 'none';
      diagramContent.style.display = 'none';

      try {
        const blob = await plantumlService.generateDiagram(content);
        const url  = URL.createObjectURL(blob);
        blobUrls.add(url);

        // Cache success
        globalSuccessCache.set(diagramId, url);

        const img = new Image();
        img.alt       = 'PlantUML diagram';
        img.className = 'max-w-full';

        img.onload = () => {
          loadingState.style.display   = 'none';
          errorState.style.display     = 'none';
          diagramContent.style.display = 'block';
          diagramContent.innerHTML     = '';
          diagramContent.appendChild(img);
        };

        img.onerror = () => {
          // Cleanup on load failure
          URL.revokeObjectURL(url);
          blobUrls.delete(url);
          globalSuccessCache.delete(diagramId);

          loadingState.style.display   = 'none';
          errorState.style.display     = 'flex';
          diagramContent.style.display = 'none';
          const msg = 'Failed to load diagram image';
          errorMessageEl!.textContent = msg;
          globalErrorCache.set(diagramId, msg);
        };

        img.src = url;
      } catch (err: any) {
        // Backend/generation error
        loadingState.style.display   = 'none';
        errorState.style.display     = 'flex';
        diagramContent.style.display = 'none';

        const msg = err.message || 'Failed to generate diagram';
        if (errorMessageEl) errorMessageEl.textContent = msg;
        globalErrorCache.set(diagramId, msg);
      }
    }
  };

  const reset = () => {
    // Only clear per-cycle flags; preserve both success & error caches
    processedDiagrams.clear();
  };

  return {
    processPlantUmlDiagrams,
    reset,
    cleanupBlobUrls,
  };
};
