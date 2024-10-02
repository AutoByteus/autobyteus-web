import { TreeNode } from '~/utils/fileExplorer/TreeNode'

export function getFilePathsFromFolder(node: TreeNode): string[] {
  const filePaths: string[] = [];

  function traverse(currentNode: TreeNode) {
    if (currentNode.is_file) {
      filePaths.push(currentNode.path);
    } else {
      // If it's a folder, traverse its children
      currentNode.children.forEach(child => traverse(child));
    }
  }

  traverse(node);
  return filePaths;
}


export async function determineFileType(filePath: string): Promise<'text' | 'image'> {
  // This is a simple implementation. In a real-world scenario, you might want to use
  // a more robust method, such as checking file extensions or mime types.
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
  const lowercasePath = filePath.toLowerCase()
  
  for (const ext of imageExtensions) {
    if (lowercasePath.endsWith(ext)) {
      return 'image'
    }
  }
  
  return 'text'
}