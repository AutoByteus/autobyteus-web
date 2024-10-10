export function getLanguage(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
      case 'py':
        return 'python';
      case 'ts':
        return 'typescript';
      case 'js':
        return 'javascript';
      case 'vue':
        return 'vue';
      case 'html':
        return 'markup';
      case 'php':
        return 'php';
      default:
        return 'plaintext';
    }
  }