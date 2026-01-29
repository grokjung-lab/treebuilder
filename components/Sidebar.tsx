
import React, { useState, useMemo, useEffect } from 'react';
import { Project, OrgNode } from '../types';
import { 
  Plus, Trash2, FolderOpen, ChevronRight, Edit2, Search, Layers, 
  Hash, Award, Box, X, ArrowLeft, Users, BarChart3, TrendingUp, 
  PieChart, DollarSign, ArrowUpRight, Table as TableIcon, Settings, Key, CheckCircle2,
  // Added missing imports for ShieldCheck and Database
  ShieldCheck, Database
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  selectedProjectId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onHighlightNode: (nodeId: string) => void;
  onViewChange?: (view: 'chart' | 'report') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen,
  onClose,
  projects, 
  selectedProjectId, 
  onSelect, 
  onCreate, 
  onDelete,
  onRename,
  onHighlightNode,
  onViewChange
}) => {
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnitsPopup, setShowUnitsPopup] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isApiSaved, setIsApiSaved] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const themes = [
    { badge: 'bg-indigo-400', dot: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-400', depth: 'border-b-indigo-700' },
    { badge: 'bg-emerald-400', dot: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-400', depth: 'border-b-emerald-700' },
    { badge: 'bg-amber-400', dot: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-400', depth: 'border-b-amber-700' },
    { badge: 'bg-rose-400', dot: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-400', depth: 'border-b-rose-700' }
  ];

  useEffect(() => {
    if (!isOpen) {
      setShowUnitsPopup(false);
      setSearchQuery("");
      setShowApiSettings(false);
    }
  }, [isOpen]);

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    setIsApiSaved(true);
    setTimeout(() => {
      setIsApiSaved(false);
      setShowApiSettings(false);
    }, 1500);
  };

  const nodeMetrics = useMemo(() => {
    if (!selectedProject) return {};
    const nodes = selectedProject.nodes;
    const metrics: Record<string, { childrenSum: number; rank: string | null; totalWithSelf: number; level: number; maxRankInSubtree: number }> = {};

    const calculate = (nodeId: string, level: number = 0): any => {
      const node = nodes[nodeId];
      if (!node) return { totalWithSelf: 0, childrenSum: 0, maxRankInSubtree: 0 };

      let childrenSum = 0;
      const childMaxRanks: number[] = [];

      for (const childId of node.children) {
        const res = calculate(childId, level + 1);
        childrenSum += res.totalWithSelf;
        childMaxRanks.push(res.maxRankInSubtree);
      }

      let rank: string | null = null;
      let rankLevel = 0;
      const countBranchesWithRank = (targetLevel: number) => 
        childMaxRanks.filter(lvl => lvl >= targetLevel).length;

      // 직급 승계 로직: 산하 매출 + (좌측/우측 각각 1명 이상 하위 직급자 존재)
      if (childrenSum >= 15000000 && countBranchesWithRank(7) >= 2) { rank = 'S8'; rankLevel = 8; }
      else if (childrenSum >= 5000000 && countBranchesWithRank(6) >= 2) { rank = 'S7'; rankLevel = 7; }
      else if (childrenSum >= 1500000 && countBranchesWithRank(5) >= 2) { rank = 'S6'; rankLevel = 6; }
      else if (childrenSum >= 500000 && countBranchesWithRank(4) >= 2) { rank = 'S5'; rankLevel = 5; }
      else if (childrenSum >= 150000 && countBranchesWithRank(3) >= 2) { rank = 'S4'; rankLevel = 4; }
      else if (childrenSum >= 50000 && countBranchesWithRank(2) >= 2) { rank = 'S3'; rankLevel = 3; }
      else if (childrenSum >= 15000 && countBranchesWithRank(1) >= 2) { rank = 'S2'; rankLevel = 2; }
      else if (childrenSum >= 5000) { rank = 'S1'; rankLevel = 1; }

      const maxRankInSubtree = Math.max(rankLevel, ...childMaxRanks);
      const result = { totalWithSelf: (node.value || 0) + childrenSum, childrenSum, rank, level, maxRankInSubtree };
      metrics[nodeId] = result;
      return result;
    };

    if (selectedProject.rootNodeId) calculate(selectedProject.rootNodeId);
    return metrics;
  }, [selectedProject]);

  const filteredNodes = useMemo(() => {
    if (!selectedProject) return [];
    const allNodes = Object.values(selectedProject.nodes) as OrgNode[];
    if (!searchQuery.trim()) return allNodes;
    
    const query = searchQuery.toLowerCase();
    return allNodes.filter(node => 
      node.name.toLowerCase().includes(query) || 
      node.employeeId.toLowerCase().includes(query)
    );
  }, [selectedProject, searchQuery]);

  const startRename = (id: string, title: string) => {
    setEditingProjectId(id);
    setTempTitle(title);
  };

  const submitRename = (id: string) => {
    if (tempTitle.trim()) {
      onRename(id, tempTitle.trim());
    }
    setEditingProjectId(null);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`fixed top-0 left-0 h-full w-80 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-500 ease-out shadow-[40px_0_80px_-15px_rgba(0,0,0,0.1)] overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className={`flex flex-col h-full transition-transform duration-500 ${showUnitsPopup ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
          <div className="p-6 border-b border-black/5 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Box className="w-6 h-6 text-amber-600" />
              </div>
              <h1 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Project Manager</h1>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-800 transition-all hover:scale-110 active:scale-90">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar bg-slate-50/20">
            <button
              onClick={onCreate}
              className="w-full flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-400 text-white font-black py-4 px-4 rounded-2xl transition-all shadow-xl hover:-translate-y-1 hover:shadow-amber-500/30 active:translate-y-0.5 active:border-b-0 border-b-[6px] border-amber-700 group uppercase tracking-tighter"
            >
              <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 group-hover:scale-110" />
              프로젝트 만들기
            </button>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-1 flex items-center gap-2">
                <FolderOpen className="w-3 h-3" />
                My Projects
              </p>
              {projects.length === 0 ? (
                <div className="text-[10px] text-slate-400 py-10 text-center border border-dashed border-slate-200 rounded-3xl italic bg-white">
                  생성된 프로젝트가 없습니다.
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border border-b-4 active:translate-y-0.5 active:border-b-2 ${
                      selectedProjectId === project.id 
                        ? 'bg-amber-500 text-white border-amber-400 border-b-amber-700 shadow-lg shadow-amber-600/20' 
                        : 'text-slate-600 bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                    onClick={() => onSelect(project.id)}
                  >
                    <div className="flex items-center gap-3 truncate flex-1">
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${selectedProjectId === project.id ? 'rotate-90 text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      {editingProjectId === project.id ? (
                        <input autoFocus className="bg-white text-slate-800 text-xs outline-none px-2 py-1 rounded-lg w-full font-bold border border-amber-200" value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} onBlur={() => submitRename(project.id)} onClick={(e) => e.stopPropagation()} />
                      ) : (
                        <span className="truncate text-xs font-black tracking-tight uppercase group-hover:text-slate-900 transition-colors">{project.title}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); startRename(project.id, project.title); }} className="p-1.5 hover:bg-black/5 rounded-lg text-inherit transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm('이 프로젝트를 삭제하시겠습니까?')) onDelete(project.id); }} className="p-1.5 hover:bg-red-500/10 hover:text-red-600 rounded-lg text-inherit transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="pt-6 border-t border-black/5 space-y-4">
              <button 
                onClick={() => selectedProjectId && setShowUnitsPopup(true)}
                disabled={!selectedProjectId}
                className={`w-full group flex items-center gap-4 p-4 rounded-3xl border border-b-4 transition-all ${
                  selectedProjectId 
                    ? 'bg-white border-slate-200 border-b-slate-300 hover:border-amber-500 hover:bg-amber-50/30 text-slate-700 hover:text-amber-600 active:translate-y-0.5 active:border-b-2 hover:-translate-y-1 shadow-sm' 
                    : 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedProjectId ? 'bg-amber-100 group-hover:bg-amber-500 group-hover:shadow-lg group-hover:shadow-amber-500/30 group-hover:scale-110 group-hover:text-white' : 'bg-slate-50'}`}>
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Explore Units</p>
                  <p className="text-xs font-black transition-colors">멤버 리스트 보기</p>
                </div>
                <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => selectedProjectId && onViewChange?.('report')}
                disabled={!selectedProjectId}
                className={`w-full group flex items-center gap-4 p-4 rounded-3xl border border-b-4 transition-all ${
                  selectedProjectId 
                    ? 'bg-white border-slate-200 border-b-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 text-slate-700 hover:text-emerald-600 active:translate-y-0.5 active:border-b-2 hover:-translate-y-1 shadow-sm' 
                    : 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedProjectId ? 'bg-slate-100 group-hover:bg-emerald-600 group-hover:shadow-lg group-hover:shadow-emerald-500/30 group-hover:scale-110 group-hover:text-white' : 'bg-slate-50'}`}>
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">수익보고서</p>
                  <p className="text-xs font-black transition-colors">정산 데이터 확인</p>
                </div>
                <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          <div className="relative p-6 border-t border-black/5 bg-white shrink-0">
            {/* API Settings Sliding Panel (White 3D Form) */}
            <div className={`absolute left-0 right-0 bottom-full bg-white border-t border-slate-200 p-6 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${showApiSettings ? 'max-h-72 translate-y-0 opacity-100 shadow-[0_-25px_50px_-15px_rgba(0,0,0,0.1)]' : 'max-h-0 translate-y-full opacity-0 pointer-events-none'}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Configuration Console</span>
                  </div>
                  <button onClick={() => setShowApiSettings(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                
                {/* 3D Carved Inset Input Field */}
                <div className="bg-slate-100 rounded-2xl p-1 shadow-[inset_0_4px_12px_rgba(0,0,0,0.08)] border border-slate-200/60 focus-within:border-indigo-400/40 focus-within:ring-4 focus-within:ring-indigo-400/5 transition-all">
                  <div className="flex items-center gap-3 px-5 py-4">
                    <Key className="w-4 h-4 text-slate-400" />
                    <input 
                      type="password" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="ENTER GEMINI API KEY" 
                      className="bg-transparent text-sm font-black text-slate-700 outline-none w-full placeholder:text-slate-300 tracking-widest"
                    />
                  </div>
                </div>

                {/* 3D Tactile Apply Button */}
                <button 
                  onClick={handleSaveApiKey}
                  className={`w-full py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-4 active:translate-y-1 active:border-b-0 flex items-center justify-center gap-3 shadow-xl ${
                    isApiSaved 
                      ? 'bg-emerald-500 text-white border-emerald-700 shadow-emerald-500/30' 
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-slate-200/50'
                  }`}
                >
                  {isApiSaved ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 animate-in zoom-in duration-300" />
                      Sync Complete
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      Deploy Changes
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer with 3D Gear Settings Button */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Node</span>
                </div>
                <span className="text-[10px] font-black text-slate-300 tracking-tighter uppercase">v3.13.0 PRO</span>
              </div>
              
              <button 
                onClick={() => setShowApiSettings(!showApiSettings)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white border-2 border-b-4 transition-all active:translate-y-1 active:border-b-2 shadow-xl group ${showApiSettings ? 'border-indigo-500 text-indigo-500 shadow-indigo-500/10' : 'border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-400 shadow-slate-200/30'}`}
              >
                <Settings className={`w-6 h-6 transition-transform duration-1000 ${showApiSettings ? 'rotate-180 scale-110' : 'group-hover:rotate-90'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Directory Popup (Remains mostly same but UI polished) */}
        <div className={`absolute inset-0 bg-white flex flex-col z-10 transition-transform duration-500 ease-in-out ${showUnitsPopup ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 border-b border-black/5 flex items-center justify-between shrink-0 bg-white shadow-sm">
            <button onClick={() => setShowUnitsPopup(false)} className="flex items-center gap-2 text-slate-500 hover:text-amber-600 transition-all group px-3 py-2 rounded-xl hover:bg-slate-50">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
            </button>
            <div className="px-4 py-1.5 bg-amber-500 text-white rounded-full text-[10px] font-black shadow-lg shadow-amber-600/30 border border-amber-400/30">{filteredNodes.length} UNITS</div>
          </div>

          <div className="p-6 space-y-4 shrink-0 bg-slate-50 border-b border-black/5">
             <div className="flex items-center bg-white rounded-2xl px-5 py-3.5 border border-slate-200 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all group shadow-sm">
                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-amber-600 shrink-0 transition-colors" />
                <input type="text" placeholder="검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent text-xs text-slate-800 outline-none w-full ml-3 font-bold placeholder:text-slate-400" />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-50/50">
            {filteredNodes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 space-y-3">
                <Search className="w-12 h-12 stroke-[1]" />
                <p className="text-[10px] font-black uppercase tracking-widest italic">No results found</p>
              </div>
            ) : (
              filteredNodes.map(node => {
                const metrics = nodeMetrics[node.id];
                const theme = themes[(metrics?.level || 0) % themes.length];
                return (
                  <button 
                    key={node.id} 
                    onClick={() => { onHighlightNode(node.id); setShowUnitsPopup(false); }} 
                    className={`relative w-full group flex flex-col items-start p-5 rounded-[2rem] bg-white text-left transition-all border-2 border-b-[6px] ${theme.border.replace('border-', 'border-opacity-40 border-')} ${theme.depth.replace('border-b-', 'border-b-opacity-60 border-b-')} hover:-translate-y-1 hover:shadow-xl active:translate-y-0.5 active:border-b-2 shadow-lg shadow-black/5`}
                  >
                    {metrics?.rank && (
                      <div className={`absolute top-4 right-5 ${theme.badge} text-white px-2.5 py-1 rounded-lg shadow-md border border-white/30 z-10 transition-all group-hover:scale-110`}>
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3 fill-white" />
                          <span className="text-[10px] font-black italic tracking-tighter uppercase">{metrics.rank}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-3 pr-20 w-full">
                      <div className={`w-3 h-3 rounded-full ${theme.dot} shadow-[0_0_10px_rgba(0,0,0,0.1)] shadow-${theme.dot.split('-')[1]}-500/30`}></div>
                      <span className="text-[13px] font-black text-slate-900 truncate uppercase tracking-tight group-hover:text-slate-900 transition-colors flex-1">{node.name}</span>
                      <div className="bg-slate-100 px-2 py-0.5 rounded-lg text-[9px] font-black text-slate-500">LV.{metrics?.level || 0}</div>
                    </div>
                    <div className="flex justify-between items-end w-full mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60 mb-0.5">Member ID</span>
                        <span className="text-[11px] text-slate-600 font-mono font-bold">{node.employeeId}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60 mb-0.5">Value</span>
                        <span className={`text-base font-black ${theme.text}`}>$ {node.value.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <ArrowUpRight className={`w-4 h-4 ${theme.text}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
          
          <div className="p-6 bg-white border-t border-black/5 shrink-0">
             <button 
               onClick={() => setShowUnitsPopup(false)} 
               className="w-full py-4.5 bg-amber-500 text-white text-[10px] font-black rounded-2xl hover:bg-amber-400 transition-all uppercase tracking-[0.2em] border-b-4 border-amber-700 active:translate-y-0.5 active:border-b-0 shadow-2xl hover:scale-[1.02]"
             >
               Close Directory
             </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
