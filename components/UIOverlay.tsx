
import React, { useState, useEffect } from 'react';
import { MultiverseNode, FutureType } from '../types';
import { generateReflection, generateCulturalProbes } from '../services/geminiService';
import { Info, GitBranch, Loader2, Sparkles, X, Plus, Save, Camera, FileText, Palette, Edit2, Link as LinkIcon, ArrowRightLeft, Undo, Redo } from 'lucide-react';

interface UIOverlayProps {
  selectedNodes: MultiverseNode[];
  onClose: () => void;
  onCreateNode: (parentId: string, data: { title: string, description: string, type: FutureType, principles: string[] }) => void;
  onUpdateNode: (nodeId: string, updates: Partial<MultiverseNode>) => void;
  onGenerateTheme: () => void;
  isGeneratingTheme: boolean;
  onLinkNodes: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  nodeColors: { [key in FutureType]: string };
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ 
    selectedNodes, 
    onClose, 
    onCreateNode, 
    onUpdateNode, 
    onGenerateTheme, 
    isGeneratingTheme,
    onLinkNodes,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    nodeColors
}) => {
  // Use the last selected node as the primary focus for editing/viewing
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;

  const [reflection, setReflection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Probes State
  const [probes, setProbes] = useState<string[] | null>(null);
  const [loadingProbes, setLoadingProbes] = useState(false);

  // Creation Mode State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<FutureType>(FutureType.PROBABLE);
  const [newPrinciples, setNewPrinciples] = useState('');

  // Editing Principles State
  const [isEditingPrinciples, setIsEditingPrinciples] = useState(false);
  const [tempPrinciples, setTempPrinciples] = useState('');

  // Reset state when selected node(s) change
  useEffect(() => {
    setReflection(null);
    setProbes(null);
    setIsCreating(false);
    setNewTitle('');
    setNewDesc('');
    setNewPrinciples('');
    setNewType(FutureType.PROBABLE);
    
    // Reset edit state
    setIsEditingPrinciples(false);
    setTempPrinciples('');
  }, [selectedNodes]);

  const handleReflect = async () => {
    if (!selectedNode) return;
    setLoading(true);
    setReflection(null);
    const result = await generateReflection(selectedNode);
    setReflection(result);
    setLoading(false);
  };

  const handleGenerateProbes = async () => {
    if (!selectedNode) return;
    setLoadingProbes(true);
    setProbes(null);
    const result = await generateCulturalProbes(selectedNode);
    setProbes(result);
    setLoadingProbes(false);
  };

  const handleSubmitBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;

    const principlesArray = newPrinciples.split(',').map(s => s.trim()).filter(s => s.length > 0);

    onCreateNode(selectedNode.id, {
        title: newTitle,
        description: newDesc,
        type: newType,
        principles: principlesArray.length > 0 ? principlesArray : ['Unknown']
    });
    setIsCreating(false);
  };

  const handleStartEditPrinciples = () => {
    if (selectedNode) {
        setTempPrinciples(selectedNode.principles.join(', '));
        setIsEditingPrinciples(true);
    }
  };

  const handleSavePrinciples = () => {
    if (!selectedNode) return;
    const updatedPrinciples = tempPrinciples.split(',').map(s => s.trim()).filter(s => s.length > 0);
    onUpdateNode(selectedNode.id, { principles: updatedPrinciples });
    setIsEditingPrinciples(false);
  };

  const handleCancelEditPrinciples = () => {
    setIsEditingPrinciples(false);
    setTempPrinciples('');
  };

  // Global History Controls
  const GlobalControls = () => (
    <div className="absolute top-4 left-4 z-30 flex gap-2">
      <button 
        onClick={onUndo} 
        disabled={!canUndo}
        className={`p-2 rounded-full bg-gray-900/80 border border-white/20 text-white transition-colors ${!canUndo ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 hover:border-white/40'}`}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button 
        onClick={onRedo} 
        disabled={!canRedo}
        className={`p-2 rounded-full bg-gray-900/80 border border-white/20 text-white transition-colors ${!canRedo ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 hover:border-white/40'}`}
        title="Redo (Ctrl+Y)"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );

  // RENDER LOGIC BASED ON SELECTION COUNT

  // Case 0: No Selection - Show Intro
  if (selectedNodes.length === 0) {
    return (
        <>
            <GlobalControls />
            <div className="absolute top-16 left-4 z-10 max-w-sm p-6 bg-black/80 border border-white/20 backdrop-blur-md text-white rounded-lg shadow-xl">
                <h1 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-purple-400" />
                    Multiverse Atlas
                </h1>
                <p className="text-sm text-gray-300 leading-relaxed">
                    Inspired by <em>Designers in Multiverse</em>.
                </p>
                <p className="text-xs text-gray-400 mt-4 border-t border-white/10 pt-2">
                    <strong>Instructions:</strong> Use your mouse to orbit the timeline. 
                    Click a node to inspect. <strong>Shift+Click</strong> to select multiple nodes.
                    <br/><br/>
                    <span className="text-green-400">● Probable</span>
                    <span className="ml-2 text-blue-400">● Plausible</span>
                    <span className="ml-2 text-purple-400">● Possible</span>
                    <span className="ml-2 text-pink-400">● Preposterous</span>
                </p>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                <button 
                    onClick={onGenerateTheme}
                    disabled={isGeneratingTheme}
                    className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 text-xs py-2 px-3 rounded transition-all flex items-center justify-center gap-2"
                >
                    {isGeneratingTheme ? (
                    <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Dreaming of Colors...
                    </>
                    ) : (
                    <>
                        <Palette className="w-3 h-3" />
                        Generate Multiverse Theme (AI)
                    </>
                    )}
                </button>
                </div>
            </div>
        </>
    )
  }

  // Case 2: Two Nodes Selected - Show Linking UI
  if (selectedNodes.length === 2) {
      const [nodeA, nodeB] = selectedNodes;
      return (
        <>
            <GlobalControls />
            <div className="absolute top-0 right-0 h-full w-full md:w-96 bg-gray-900/95 border-l border-white/10 text-white p-6 z-20 shadow-2xl backdrop-blur-xl flex flex-col justify-center">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="text-center mb-8">
                    <ArrowRightLeft className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
                    <h2 className="text-2xl font-bold">Bridge Timelines</h2>
                    <p className="text-gray-400 text-sm mt-2">Create a manual connection between two distinct futures.</p>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="bg-black/40 p-4 rounded border-l-4" style={{ borderColor: nodeA.color }}>
                        <div className="text-xs uppercase text-gray-500">{nodeA.type}</div>
                        <div className="font-bold text-lg">{nodeA.title}</div>
                    </div>
                    <div className="flex justify-center">
                        <LinkIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="bg-black/40 p-4 rounded border-l-4" style={{ borderColor: nodeB.color }}>
                        <div className="text-xs uppercase text-gray-500">{nodeB.type}</div>
                        <div className="font-bold text-lg">{nodeB.title}</div>
                    </div>
                </div>

                <button 
                    onClick={onLinkNodes}
                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded transition-colors flex items-center justify-center gap-2"
                >
                    <LinkIcon className="w-4 h-4" />
                    Link Selected Nodes
                </button>
                <p className="text-xs text-gray-500 mt-4 text-center">
                    This will create a permanent wormhole connection between these points in the multiverse.
                </p>
            </div>
        </>
      )
  }
  
  // Case > 2: Too many nodes
  if (selectedNodes.length > 2) {
       return (
        <>
            <GlobalControls />
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-6 py-4 rounded shadow-lg z-30 border border-red-500">
                <h3 className="font-bold flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Selection Limit Reached
                </h3>
                <p className="text-sm opacity-90">Please select exactly 2 nodes to create a link.</p>
                <button onClick={onClose} className="mt-2 text-xs underline">Clear Selection</button>
            </div>
        </>
       )
  }

  // Case 1: Single Node Selected - Show Full Details (Original UI)
  // If no selected node (but length not 0, 2, >2) - should theoretically not happen given logic above, but good fallback.
  if (!selectedNode) return <GlobalControls />;

  return (
    <>
        <GlobalControls />
        <div className="absolute top-0 right-0 h-full w-full md:w-96 bg-gray-900/95 border-l border-white/10 text-white p-6 z-20 overflow-y-auto shadow-2xl backdrop-blur-xl transition-transform duration-300">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
                <X className="w-6 h-6" />
            </button>

            <div className="mt-8">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div 
                        className="inline-block px-2 py-1 text-xs font-bold tracking-wider rounded mb-4 uppercase border"
                        style={{ 
                            color: selectedNode.color,
                            borderColor: selectedNode.color
                        }}
                    >
                        {selectedNode.type} Future
                    </div>
                </div>

                <h2 className="text-3xl font-bold mb-2">{selectedNode.title}</h2>
                <p className="text-gray-300 italic mb-6">{selectedNode.description}</p>

                {/* Principles */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm uppercase tracking-widest text-gray-500 font-semibold">Design Principles</h3>
                        {!isEditingPrinciples && (
                            <button 
                                onClick={handleStartEditPrinciples} 
                                className="text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-xs border border-transparent hover:border-white/10 px-2 py-1 rounded"
                                title="Edit Principles"
                            >
                                <Edit2 className="w-3 h-3" />
                                Edit
                            </button>
                        )}
                    </div>

                    {isEditingPrinciples ? (
                        <div className="bg-black/30 p-3 rounded border border-white/10 animate-in fade-in zoom-in-95 duration-200">
                            <label className="block text-xs text-gray-400 mb-1">Comma separated values:</label>
                            <input
                                type="text"
                                value={tempPrinciples}
                                onChange={(e) => setTempPrinciples(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-green-500 focus:outline-none mb-3 font-mono"
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                                <button 
                                    onClick={handleCancelEditPrinciples} 
                                    className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded border border-transparent hover:border-white/20 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSavePrinciples} 
                                    className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500 font-bold flex items-center gap-1"
                                >
                                    <Save className="w-3 h-3" />
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {selectedNode.principles.map((p, i) => (
                                <span key={i} className="bg-white/10 px-3 py-1 rounded-full text-xs hover:bg-white/20 transition-colors cursor-default border border-white/5">
                                    {p}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reflection Section */}
                {!isCreating && (
                    <div className="border-t border-white/10 pt-6 mb-6">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-purple-300">
                            <Sparkles className="w-4 h-4" />
                            Norm-Critical Reflection
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Consult the multiverse to reveal the hidden biases and systemic implications of this timeline.
                        </p>

                        {!reflection && !loading && (
                            <button
                                onClick={handleReflect}
                                className="w-full bg-white/5 text-white border border-white/20 font-semibold py-3 rounded hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Consult Oracle
                            </button>
                        )}

                        {loading && (
                            <div className="flex items-center justify-center py-8 text-gray-500 animate-pulse">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                Interrogating the timeline...
                            </div>
                        )}

                        {reflection && (
                            <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <p className="text-purple-100 font-mono text-sm leading-relaxed">
                                    "{reflection}"
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Branching Section */}
                <div className="border-t border-white/10 pt-6 mb-6">
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-green-300">
                        <GitBranch className="w-4 h-4" />
                        Diverge Timeline
                    </h3>
                    
                    {!isCreating ? (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-500 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Branch from this Reality
                        </button>
                    ) : (
                        <form onSubmit={handleSubmitBranch} className="bg-black/30 p-4 rounded-lg border border-white/10 animate-in fade-in zoom-in-95 duration-300">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-1">Future Title</label>
                                    <input 
                                        type="text" 
                                        required
                                        autoFocus
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-green-500 focus:outline-none"
                                        placeholder="e.g., The Data Monk"
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-xs uppercase text-gray-500 mb-1">Future Type</label>
                                    <div className="relative">
                                        <select 
                                            value={newType}
                                            onChange={e => setNewType(e.target.value as FutureType)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 pl-8 text-sm focus:border-green-500 focus:outline-none appearance-none"
                                        >
                                            {Object.values(FutureType).filter(t => t !== FutureType.ROOT).map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                        <div 
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-sm"
                                            style={{ backgroundColor: nodeColors[newType] || '#fff' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-1">Description</label>
                                    <textarea 
                                        required
                                        value={newDesc}
                                        onChange={e => setNewDesc(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-green-500 focus:outline-none h-20"
                                        placeholder="How does this future look? What are the trade-offs?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-1">Principles (comma separated)</label>
                                    <input 
                                        type="text" 
                                        value={newPrinciples}
                                        onChange={e => setNewPrinciples(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-green-500 focus:outline-none"
                                        placeholder="e.g., Radical Transparency, Degrowth, Circularity"
                                    />
                                </div>
                                
                                <div className="flex gap-2 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 py-2 text-xs text-gray-400 hover:text-white border border-transparent hover:border-gray-600 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-2 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-500 flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-3 h-3" />
                                        Create Future
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Cultural Probes Section */}
                {!isCreating && (
                    <div className="border-t border-white/10 pt-6 pb-10">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-pink-300">
                            <Camera className="w-4 h-4" />
                            Cultural Probes
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Generate auto-ethnographic tasks to tangibly explore this future reality.
                        </p>
                        
                        {!probes && !loadingProbes && (
                             <button
                                onClick={handleGenerateProbes}
                                className="w-full bg-white/5 text-white border border-white/20 font-semibold py-3 rounded hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                Generate Probes
                            </button>
                        )}

                         {loadingProbes && (
                            <div className="flex items-center justify-center py-8 text-gray-500 animate-pulse">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                Designing probes...
                            </div>
                        )}

                        {probes && (
                            <ul className="space-y-3">
                                {probes.map((probe, idx) => (
                                    <li key={idx} className="bg-pink-900/10 border border-pink-500/20 p-3 rounded flex gap-3 items-start text-sm text-pink-100 animate-in fade-in slide-in-from-bottom-2" style={{animationDelay: `${idx * 100}ms`}}>
                                        <span className="bg-pink-500/20 text-pink-300 w-6 h-6 flex items-center justify-center rounded-full text-xs flex-shrink-0 mt-0.5">{idx + 1}</span>
                                        {probe}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    </>
  );
};
