
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { MultiverseCanvas } from './components/MultiverseCanvas';
import { UIOverlay } from './components/UIOverlay';
import { MultiverseNode, FutureType, MultiverseTheme, FieldNote } from './types';
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

  // Field Notes State (Independent of Undo/Redo history for now, persisted locally in session)
  const [fieldNotes, setFieldNotes] = useState<FieldNote[]>([]);

  // Derived current state
  const { nodes, theme } = history[historyIndex];

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

  // Canvas Reference for Capture
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);

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

  // Field Note Handlers
  const handleAddNote = useCallback((nodeId: string, text: string) => {
    const newNote: FieldNote = {
        id: `note-${Date.now()}`,
        nodeId,
        content: text,
        timestamp: Date.now()
    };
    setFieldNotes(prev => [...prev, newNote]);
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    setFieldNotes(prev => prev.filter(n => n.id !== noteId));
  }, []);

  // Media Capture Handlers
  const handleTakeSnapshot = useCallback(() => {
    if (canvasRef.current) {
        try {
            const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `multiverse-snapshot-${Date.now()}.png`;
            link.click();
        } catch (e) {
            console.error("Snapshot failed:", e);
        }
    }
  }, []);

  const handleRecordVideo = useCallback(() => {
    if (!canvasRef.current || isRecording) return;

    try {
        setIsRecording(true);
        // Cast to any because captureStream isn't in standard HTMLElement type defs yet
        const stream = (canvasRef.current as any).captureStream(30); // 30 FPS
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks: BlobPart[] = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `multiverse-gift-${Date.now()}.webm`;
            link.click();
            URL.revokeObjectURL(url);
            setIsRecording(false);
        };

        recorder.start();

        // Stop after 5 seconds
        setTimeout(() => {
            if (recorder.state === 'recording') {
                recorder.stop();
            }
        }, 5000);

    } catch (e) {
        console.error("Recording failed:", e);
        setIsRecording(false);
    }
  }, [isRecording]);

  // Derived state for selected node objects
  const selectedNodes = useMemo(() => {
    return selectedIds
      .map(id => nodes.find(n => n.id === id))
      .filter((n): n is MultiverseNode => !!n);
  }, [nodes, selectedIds]);

  const primarySelectedNode = selectedNodes.length > 0 ? selectedNodes[selectedNodes.length - 1] : null;

  const handleNodeSelect = useCallback((node: MultiverseNode, isMultiSelect: boolean) => {
    setSelectedIds(prev => {
      if (isMultiSelect) {
        return prev.includes(node.id) 
          ? prev.filter(id => id !== node.id) 
          : [...prev, node.id];
      } else {
        return [node.id];
      }
    });
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleLinkSelectedNodes = useCallback(() => {
    if (selectedNodes.length !== 2) return;

    const [source, target] = selectedNodes;
    const isLinked = source.linkedIds?.includes(target.id);

    const updatedNodes = nodes.map(n => {
        if (n.id === source.id) {
            const existingLinks = n.linkedIds || [];
            if (isLinked) {
                return { ...n, linkedIds: existingLinks.filter(id => id !== target.id) };
            } else {
                return { ...n, linkedIds: [...existingLinks, target.id] };
            }
        }
        return n;
    });

    pushState(updatedNodes);
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
      color: theme.nodeColors[data.type],
      linkedIds: []
    };

    const newNodes = [...nodes, newNode];
    pushState(newNodes);
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
      const updatedNodes = nodes.map(node => ({
        ...node,
        color: newTheme.nodeColors[node.type]
      }));
      pushState(updatedNodes, newTheme);
    }
    setIsGeneratingTheme(false);
  };

  return (
    <div 
      className="relative w-full h-screen text-white overflow-hidden transition-colors duration-1000"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="absolute inset-0 z-0">
        <MultiverseCanvas 
          nodes={nodes}
          onNodeSelect={handleNodeSelect} 
          selectedIds={selectedIds}
          backgroundColor={theme.backgroundColor}
          canvasRef={canvasRef}
        />
      </div>

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
        // Doc Lab Props
        fieldNotes={fieldNotes}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onTakeSnapshot={handleTakeSnapshot}
        onRecordVideo={handleRecordVideo}
        isRecording={isRecording}
      />
      
      <div className="absolute bottom-4 left-4 z-10 text-[10px] text-gray-500 select-none pointer-events-none font-mono">
        Designers in Multiverse // Prototype // Three.js + Gemini
      </div>
    </div>
  );
}
