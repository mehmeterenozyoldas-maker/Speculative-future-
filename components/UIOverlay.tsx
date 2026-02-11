
import React, { useState, useEffect } from 'react';
import { MultiverseNode, FutureType, FieldNote } from '../types';
import { generateReflection, generateCulturalProbes, generateFutureScenario } from '../services/geminiService';
import { Info, GitBranch, Loader2, Sparkles, X, Plus, Save, Camera, FileText, Palette, Edit2, Link as LinkIcon, Unlink, ArrowRightLeft, Undo, Redo, Wand2, Video, BookOpen, Trash2 } from 'lucide-react';

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
  // Doc Lab Props
  fieldNotes: FieldNote[];
  onAddNote: (nodeId: string, text: string) => void;
  onDeleteNote: (noteId: string) => void;
  onTakeSnapshot: () => void;
  onRecordVideo: () => void;
  isRecording: boolean;
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
    nodeColors,
    fieldNotes,
    onAddNote,
    onDeleteNote,
    onTakeSnapshot,
    onRecordVideo,
    isRecording
}) => {
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;

  const [reflection, setReflection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [probes, setProbes] = useState<string[] | null>(null);
  const [loadingProbes, setLoadingProbes] = useState(false);
  
  // Creation Mode
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<FutureType>(FutureType.PROBABLE);
  const [newPrinciples, setNewPrinciples] = useState('');
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);

  // Edit Principles
  const [isEditingPrinciples, setIsEditingPrinciples] = useState(false);
  const [tempPrinciples, setTempPrinciples] = useState('');

  // Doc Lab State
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  useEffect(() => {
    // Reset transient UI states on selection change
    setReflection(null);
    setProbes(null);
    setIsCreating(false);
    setNewTitle('');
    setNewDesc('');
    setNewPrinciples('');
    setNewType(FutureType.PROBABLE);
    setIsEditingPrinciples(false);
    setTempPrinciples('');
    // We don't close the journal automatically, as users might want to keep it open while browsing
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

  const handleAutoFill = async () => {
    if (!selectedNode) return;
    setIsGeneratingScenario(true);
    const result = await generateFutureScenario(selectedNode, newType);
    if (result) {
        setNewTitle(result.title);
        setNewDesc(result.description);
        setNewPrinciples(result.principles.join(', '));
    }
    setIsGeneratingScenario(false);
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

  const handleAddNoteSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedNode || !newNoteText.trim()) return;
      onAddNote(selectedNode.id, newNoteText);
      setNewNoteText('');
  };

  // Filter notes for current node if selected, otherwise show none (or could show all, but spec says "If a node is selected...")
  const displayedNotes = selectedNode 
    ? fieldNotes.filter(n => n.nodeId === selectedNode.id).sort((a, b) => b.timestamp - a.timestamp) 
    : [];

  // --- Components ---

  const GlobalControls = () => (
    <div className="absolute top-4 left-4 z-30 flex gap-2">
      <button onClick={onUndo} disabled={!canUndo} className={`p-2 rounded-full bg-gray-900/80 border border-white/20 text-white transition-colors ${!canUndo ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 hover:border-white/40'}`} title="Undo (Ctrl+Z)">
        <Undo className="w-4 h-4" />
      </button>
      <button onClick={onRedo} disabled={!canRedo} className={`p-2 rounded-full bg-gray-900/80 border border-white/20 text-white transition-colors ${!canRedo ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 hover:border-white/40'}`} title="Redo (Ctrl+Y)">
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );

  const DocLabToolbar = () => (
      <div className="absolute bottom-6 right-6 z-40 flex flex-col items-end gap-3">
          {/* Recording Indicator */}
          {isRecording && (
              <div className="bg-black/80 text-red-500 border border-red-500/50 px-3 py-1 rounded-full text-xs font-mono animate-pulse flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  REC 00:05
              </div>
          )}

          <div className="flex gap-2 bg-gray-900/90 p-2 rounded-lg border border-white/10 backdrop-blur-md shadow-2xl">
              <button 
                onClick={onTakeSnapshot}
                className="p-3 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all"
                title="Snapshot (PNG)"
              >
                  <Camera className="w-5 h-5" />
              </button>
              <button 
                onClick={onRecordVideo}
                disabled={isRecording}
                className={`p-3 rounded transition-all ${isRecording ? 'text-red-500 bg-red-500/10' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                title="Record Gift (5s Video)"
              >
                  <Video className="w-5 h-5" />
              </button>
              <div className="w-px bg-white/10 mx-1" />
              <button 
                onClick={() => setIsJournalOpen(!isJournalOpen)}
                className={`p-3 rounded transition-all ${isJournalOpen ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                title="Field Journal"
              >
                  <BookOpen className="w-5 h-5" />
              </button>
          </div>
      </div>
  );

  const JournalPanel = () => {
    if (!isJournalOpen) return null;
    return (
        <div className="absolute bottom-24 right-6 w-80 bg-[#1a1a24] border border-[#2a2a35] text-gray-200 p-4 rounded-lg shadow-2xl z-40 font-mono animate-in slide-in-from-right-10 duration-300">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Field Journal</h3>
                <button onClick={() => setIsJournalOpen(false)}><X className="w-4 h-4 hover:text-white" /></button>
            </div>
            
            {!selectedNode ? (
                <div className="text-center py-8 opacity-50">
                    <p className="text-xs italic">Select a node to view or add field notes.</p>
                </div>
            ) : (
                <>
                    <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-1">Target Subject:</div>
                        <div className="font-bold text-white truncate">{selectedNode.title}</div>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-3 mb-4 pr-1 custom-scrollbar">
                        {displayedNotes.length === 0 && (
                            <p className="text-xs text-gray-600 text-center py-2">No observations recorded yet.</p>
                        )}
                        {displayedNotes.map(note => (
                            <div key={note.id} className="bg-[#111116] p-3 rounded border border-white/5 relative group">
                                <p className="text-xs leading-relaxed text-gray-300 whitespace-pre-wrap">{note.content}</p>
                                <div className="mt-2 text-[10px] text-gray-600 flex justify-between items-center">
                                    <span>{new Date(note.timestamp).toLocaleTimeString()}</span>
                                    <button 
                                        onClick={() => onDeleteNote(note.id)}
                                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleAddNoteSubmit} className="mt-auto">
                        <textarea
                            value={newNoteText}
                            onChange={(e) => setNewNoteText(e.target.value)}
                            className="w-full bg-[#0a0a0f] border border-gray-700 rounded p-2 text-xs focus:border-indigo-500 focus:outline-none resize-none h-20 placeholder-gray-700"
                            placeholder="Record observation..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddNoteSubmit(e);
                                }
                            }}
                        />
                        <button 
                            type="submit"
                            disabled={!newNoteText.trim()}
                            className="w-full mt-2 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 text-xs py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-500/20"
                        >
                            Log Entry
                        </button>
                    </form>
                </>
            )}
        </div>
    );
  };

  // --- Main Render Logic ---

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
                    <strong>Instructions:</strong> Orbit to explore. Click to inspect. 
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
                        {isGeneratingTheme ? <><Loader2 className="w-3 h-3 animate-spin" /> Dreaming...</> : <><Palette className="w-3 h-3" /> Generate Theme (AI)</>}
                    </button>
                </div>
            </div>
            <DocLabToolbar />
            <JournalPanel />
        </>
    )
  }

  if (selectedNodes.length === 2) {
      const [nodeA, nodeB] = selectedNodes;
      const isLinked = nodeA.linkedIds?.includes(nodeB.id);
      return (
        <>
            <GlobalControls />
            <div className="absolute top-0 right-0 h-full w-full md:w-96 bg-gray-900/95 border-l border-white/10 text-white p-6 z-20 shadow-2xl backdrop-blur-xl flex flex-col justify-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                <div className="text-center mb-8">
                    <ArrowRightLeft className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
                    <h2 className="text-2xl font-bold">Bridge Timelines</h2>
                    <p className="text-gray-400 text-sm mt-2">{isLinked ? 'Existing connection detected.' : 'Create a manual connection.'}</p>
                </div>
                <button 
                    onClick={onLinkNodes}
                    className={`w-full font-bold py-3 rounded transition-colors flex items-center justify-center gap-2 ${isLinked ? 'bg-red-900/80 hover:bg-red-800 text-red-100' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}
                >
                    {isLinked ? <><Unlink className="w-4 h-4" /> Unlink</> : <><LinkIcon className="w-4 h-4" /> Link</>}
                </button>
            </div>
            <DocLabToolbar />
            <JournalPanel />
        </>
      )
  }
  
  if (selectedNodes.length > 2) {
       return (
        <>
            <GlobalControls />
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-6 py-4 rounded shadow-lg z-30 border border-red-500">
                <h3 className="font-bold flex items-center gap-2"><Info className="w-4 h-4" /> Limit Reached</h3>
                <button onClick={onClose} className="mt-2 text-xs underline">Clear Selection</button>
            </div>
            <DocLabToolbar />
        </>
       )
  }

  if (!selectedNode) return <GlobalControls />;

  return (
    <>
        <GlobalControls />
        <div className="absolute top-0 right-0 h-full w-full md:w-96 bg-gray-900/95 border-l border-white/10 text-white p-6 z-20 overflow-y-auto shadow-2xl backdrop-blur-xl transition-transform duration-300">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            <div className="mt-8">
                <div className="flex justify-between items-start">
                    <div className="inline-block px-2 py-1 text-xs font-bold tracking-wider rounded mb-4 uppercase border" style={{ color: selectedNode.color, borderColor: selectedNode.color }}>
                        {selectedNode.type} Future
                    </div>
                </div>
                <h2 className="text-3xl font-bold mb-2">{selectedNode.title}</h2>
                <p className="text-gray-300 italic mb-6">{selectedNode.description}</p>
                
                {/* Principles Editor */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm uppercase tracking-widest text-gray-500 font-semibold">Design Principles</h3>
                        {!isEditingPrinciples && (
                            <button onClick={handleStartEditPrinciples} className="text-gray-500 hover:text-white flex items-center gap-1 text-xs border border-transparent hover:border-white/10 px-2 py-1 rounded">
                                <Edit2 className="w-3 h-3" /> Edit
                            </button>
                        )}
                    </div>
                    {isEditingPrinciples ? (
                        <div className="bg-black/30 p-3 rounded border border-white/10">
                            <input type="text" value={tempPrinciples} onChange={(e) => setTempPrinciples(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-green-500 focus:outline-none mb-3 font-mono" autoFocus />
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setIsEditingPrinciples(false)} className="text-xs text-gray-400 hover:text-white px-3 py-1">Cancel</button>
                                <button onClick={handleSavePrinciples} className="text-xs bg-green-600 text-white px-3 py-1 rounded">Save</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {selectedNode.principles.map((p, i) => (
                                <span key={i} className="bg-white/10 px-3 py-1 rounded-full text-xs hover:bg-white/20 transition-colors cursor-default border border-white/5">{p}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reflection */}
                {!isCreating && (
                    <div className="border-t border-white/10 pt-6 mb-6">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-purple-300"><Sparkles className="w-4 h-4" /> Reflection</h3>
                        {!reflection && !loading && (
                            <button onClick={handleReflect} className="w-full bg-white/5 text-white border border-white/20 font-semibold py-3 rounded hover:bg-white/10 flex items-center justify-center gap-2">
                                <Sparkles className="w-4 h-4" /> Consult Oracle
                            </button>
                        )}
                        {loading && <div className="flex items-center justify-center py-8 text-gray-500 animate-pulse"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Thinking...</div>}
                        {reflection && <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg"><p className="text-purple-100 font-mono text-sm leading-relaxed">"{reflection}"</p></div>}
                    </div>
                )}

                {/* Branching */}
                <div className="border-t border-white/10 pt-6 mb-6">
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-green-300"><GitBranch className="w-4 h-4" /> Branch</h3>
                    {!isCreating ? (
                        <button onClick={() => setIsCreating(true)} className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-500 flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> New Future
                        </button>
                    ) : (
                        <form onSubmit={handleSubmitBranch} className="bg-black/30 p-4 rounded-lg border border-white/10">
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <select value={newType} onChange={e => setNewType(e.target.value as FutureType)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 pl-2 text-sm focus:border-green-500">
                                                {Object.values(FutureType).filter(t => t !== FutureType.ROOT).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <button type="button" onClick={handleAutoFill} disabled={isGeneratingScenario} className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/50 rounded px-3 flex items-center justify-center transition-colors">
                                            {isGeneratingScenario ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <input type="text" required autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm" placeholder="Title" />
                                <textarea required value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm h-20" placeholder="Description" />
                                <input type="text" value={newPrinciples} onChange={e => setNewPrinciples(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm" placeholder="Principles" />
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-2 text-xs text-gray-400 hover:text-white border border-transparent hover:border-gray-600 rounded">Cancel</button>
                                    <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-500 flex items-center justify-center gap-2"><Save className="w-3 h-3" /> Create</button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Cultural Probes */}
                {!isCreating && (
                    <div className="border-t border-white/10 pt-6 pb-10">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-pink-300"><FileText className="w-4 h-4" /> Probes</h3>
                        {!probes && !loadingProbes && (
                             <button onClick={handleGenerateProbes} className="w-full bg-white/5 text-white border border-white/20 font-semibold py-3 rounded hover:bg-white/10 flex items-center justify-center gap-2">
                                <FileText className="w-4 h-4" /> Generate
                            </button>
                        )}
                         {loadingProbes && <div className="flex items-center justify-center py-8 text-gray-500 animate-pulse"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Designing...</div>}
                        {probes && (
                            <ul className="space-y-3">
                                {probes.map((probe, idx) => (
                                    <li key={idx} className="bg-pink-900/10 border border-pink-500/20 p-3 rounded flex gap-3 items-start text-sm text-pink-100">
                                        <span className="bg-pink-500/20 text-pink-300 w-6 h-6 flex items-center justify-center rounded-full text-xs flex-shrink-0 mt-0.5">{idx + 1}</span>
                                        {probe}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
            
            <DocLabToolbar />
            <JournalPanel />
        </div>
    </>
  );
};
