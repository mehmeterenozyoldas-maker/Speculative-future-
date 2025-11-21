
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { MultiverseCanvas } from './components/MultiverseCanvas';
import { UIOverlay } from './components/UIOverlay';
import { MultiverseNode, FutureType, MultiverseTheme } from './types';
import { INITIAL_NODES, COLORS } from './constants';
import { generateMultiverseTheme } from './services/geminiService';

// Helper to calculate 3D position for new nodes based on their relationship type
const calculateChildPosition = (parent: MultiverseNode, type: FutureType): [number, number, number] => {
  const [px, py, pz] = parent.position;
  
  // Cone spread parameters
  let spreadXY = 0;
  let stepZ = 0;

  switch (type) {
    case FutureType.PROBABLE:
      spreadXY = 3;  // Tight cone
      stepZ = 8;
      break;
    case FutureType.PLAUSIBLE:
      spreadXY = 6;  // Medium cone
      stepZ = 10;
      break;
    case FutureType.POSSIBLE:
      spreadXY = 12; // Wide cone
      stepZ = 14;
      break;
    case FutureType.PREPOSTEROUS:
      spreadXY = 20; // Wild outliers
      stepZ = 18;
      break;
    default:
      spreadXY = 5;
      stepZ = 10;
  }

  // Random angle for X/Y plane
  const angle = Math.random() * Math.PI * 2;
  // Random radius within the spread
  const radius = Math.random() * spreadXY;

  const offsetX = Math.cos(angle) * radius;
  const offsetY = Math.sin(angle) * radius;
  
  // Add slight randomness to Z so they don't form perfect sheets
  const offsetZ = stepZ + (Math.random() * 2);

  return [px + offsetX, py + offsetY, pz + offsetZ];
};

const DEFAULT_THEME: MultiverseTheme = {
  backgroundColor: '#050505',
  nodeColors: COLORS,
  uiAccentColor: '#4ade80' // green-400 default
};

interface AppState {
  nodes: MultiverseNode[];
  theme: MultiverseTheme;
}

export default function App() {
  // History State Management
  const [history, setHistory] = useState<AppState[]>([
    { nodes: INITIAL_NODES, theme: DEFAULT_THEME }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Derived current state
  const { nodes, theme } = history[historyIndex];

  // Selection state (independent of history, though validated against it)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

  // History Modifiers
  const pushState = useCallback((newNodes: MultiverseNode[], newTheme: MultiverseTheme = theme) => {
    setHistory(prev => {
      // Discard any future history if we are in the middle of the stack
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ nodes: newNodes, theme: newTheme });
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex, theme]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
    }
  }, [historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, history.length]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.target?.['form']) { // Avoid triggering when typing in forms
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Derived state for selected node objects
  const selectedNodes = useMemo(() => {
    // Map ids to nodes, filtering out any that might have been deleted
    return selectedIds
      .map(id => nodes.find(n => n.id === id))
      .filter((n): n is MultiverseNode => !!n);
  }, [nodes, selectedIds]);

  // The "Primary" selected node is the last one clicked, used for branching/editing/camera focus
  const primarySelectedNode = selectedNodes.length > 0 ? selectedNodes[selectedNodes.length - 1] : null;

  const handleNodeSelect = useCallback((node: MultiverseNode, isMultiSelect: boolean) => {
    setSelectedIds(prev => {
      if (isMultiSelect) {
        // Toggle selection
        return prev.includes(node.id) 
          ? prev.filter(id => id !== node.id) 
          : [...prev, node.id];
      } else {
        // Replace selection
        return [node.id];
      }
    });
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Link the currently selected nodes
  const handleLinkSelectedNodes = useCallback(() => {
    if (selectedNodes.length !== 2) return;

    const [source, target] = selectedNodes;

    const updatedNodes = nodes.map(n => {
        if (n.id === source.id) {
            const existingLinks = n.linkedIds || [];
            // Avoid duplicates
            if (!existingLinks.includes(target.id)) {
                return { ...n, linkedIds: [...existingLinks, target.id] };
            }
        }
        return n;
    });

    // Detect if a change actually happened before pushing state
    const sourceNode = updatedNodes.find(n => n.id === source.id);
    const originalNode = nodes.find(n => n.id === source.id);
    
    if (sourceNode && originalNode && sourceNode.linkedIds?.length !== originalNode.linkedIds?.length) {
       pushState(updatedNodes);
    }
    
    // Reset selection to just the source for clarity
    setSelectedIds([source.id]);
  }, [selectedNodes, nodes, pushState]);

  const handleCreateNode = useCallback((parentId: string, data: { title: string; description: string; type: FutureType; principles: string[] }) => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const position = calculateChildPosition(parentNode, data.type);
    
    const newNode: MultiverseNode = {
      id: `node-${Date.now()}`,
      parentId,
      type: data.type,
      position,
      title: data.title,
      description: data.description,
      principles: data.principles,
      color: theme.nodeColors[data.type], // Use current theme color
      linkedIds: []
    };

    const newNodes = [...nodes, newNode];
    pushState(newNodes);

    // Automatically select the new node
    setSelectedIds([newNode.id]);
  }, [nodes, theme, pushState]);

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<MultiverseNode>) => {
    const updatedNodes = nodes.map((n) => {
        if (n.id === nodeId) {
            return { ...n, ...updates };
        }
        return n;
    });
    pushState(updatedNodes);
  }, [nodes, pushState]);

  const handleGenerateTheme = async () => {
    setIsGeneratingTheme(true);
    const newTheme = await generateMultiverseTheme(nodes, primarySelectedNode);
    if (newTheme) {
      // Update existing nodes to match the new theme colors
      const updatedNodes = nodes.map(node => ({
        ...node,
        color: newTheme.nodeColors[node.type]
      }));
      
      // Push both new nodes (colors) and new theme to history
      pushState(updatedNodes, newTheme);
    }
    setIsGeneratingTheme(false);
  };

  return (
    <div 
      className="relative w-full h-screen text-white overflow-hidden transition-colors duration-1000"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* The 3D Scene sits in the background */}
      <div className="absolute inset-0 z-0">
        <MultiverseCanvas 
          nodes={nodes}
          onNodeSelect={handleNodeSelect} 
          selectedIds={selectedIds}
          backgroundColor={theme.backgroundColor}
        />
      </div>

      {/* The UI Overlay handles interaction feedback and text */}
      <UIOverlay 
        selectedNodes={selectedNodes}
        onClose={handleCloseOverlay}
        onCreateNode={handleCreateNode}
        onUpdateNode={handleUpdateNode}
        onGenerateTheme={handleGenerateTheme}
        isGeneratingTheme={isGeneratingTheme}
        onLinkNodes={handleLinkSelectedNodes}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        nodeColors={theme.nodeColors}
      />
      
      {/* Footer / Watermark */}
      <div className="absolute bottom-4 left-4 z-10 text-[10px] text-gray-500 select-none pointer-events-none font-mono">
        Designers in Multiverse // Prototype // Three.js + Gemini
      </div>
    </div>
  );
}
