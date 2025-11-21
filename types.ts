
// Represents a single 'Self' or point in the future/multiverse
export enum FutureType {
  ROOT = 'ROOT', // The present self
  PROBABLE = 'PROBABLE', // Business as usual
  PLAUSIBLE = 'PLAUSIBLE', // Could happen based on current knowledge
  POSSIBLE = 'POSSIBLE', // Might happen, requires new knowledge
  PREPOSTEROUS = 'PREPOSTEROUS', // Impossible? Or just radically different?
}

export interface MultiverseNode {
  id: string;
  parentId: string | null;
  type: FutureType;
  position: [number, number, number]; // 3D coordinates
  title: string; // e.g., "The Corporate Stoic"
  description: string; // Detailed persona description
  principles: string[]; // e.g., ["Sustainability", "Profit", "Equity"]
  color: string;
  linkedIds?: string[]; // IDs of manually connected nodes
}

export interface ReflectionResponse {
  question: string;
  context: string;
}

export interface MultiverseTheme {
  backgroundColor: string;
  nodeColors: {
    [key in FutureType]: string;
  };
  uiAccentColor: string;
}
