
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Project, OrgNode, User } from './types';
import SidebarComponent from './components/Sidebar';
import OrgChart from './components/OrgChart';
import Auth from './components/Auth';
import RevenueReport from './components/RevenueReport';
import { Plus, Layout, LogOut, Loader2, ZoomIn, ZoomOut, Maximize, ShieldCheck, ArrowLeftToLine, ArrowDownToLine, ArrowRightToLine, Menu, X, BarChart3, Share2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'chart' | 'report'>('chart');
  
  // 조직도 방향 상태
  const [orientation, setOrientation] = useState<'top-down' | 'left-to-right' | 'right-to-left'>('top-down');

  // Pan & Zoom State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('hierarchy_current_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        const localData = localStorage.getItem(`hierarchy_projects_${parsedUser.username}`);
        if (localData) {
          const parsedProjects = JSON.parse(localData);
          setProjects(parsedProjects);
          if (parsedProjects.length > 0) {
            setSelectedProjectId(parsedProjects[0].id);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load local data", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('hierarchy_current_user', JSON.stringify(user));
      const localData = localStorage.getItem(`hierarchy_projects_${user.username}`);
      if (localData) {
        setProjects(JSON.parse(localData));
      }
    } else {
      localStorage.removeItem('hierarchy_current_user');
      setProjects([]);
      setSelectedProjectId(null);
    }
  }, [user]);

  useEffect(() => {
    if (user && projects.length >= 0) {
      localStorage.setItem(`hierarchy_projects_${user.username}`, JSON.stringify(projects));
    }
  }, [projects, user]);

  const handleWheel = (e: React.WheelEvent) => {
    if (currentView !== 'chart') return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.2, Math.min(3, scale + delta));
      setScale(newScale);
    } else {
      setPosition(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentView !== 'chart') return;
    if ((e.target as HTMLElement).closest('button, input')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || currentView !== 'chart') return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleLogin = (newUser: User) => setUser(newUser);
  const handleLogout = () => confirm('로그아웃 하시겠습니까?') && setUser(null);

  const createProject = useCallback(() => {
    const rootId = crypto.randomUUID();
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: `신규 팀 ${projects.length + 1}`,
      createdAt: Date.now(),
      rootNodeId: rootId,
      nodes: {
        [rootId]: {
          id: rootId,
          name: '대표이사',
          employeeId: 'CEO-01',
          value: 0,
          children: [],
          parentId: null,
        }
      }
    };
    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    resetView();
    setCurrentView('chart');
    setIsSidebarOpen(false);
  }, [projects.length]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
  }, [selectedProjectId]);

  const renameProject = useCallback((id: string, newTitle: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, title: newTitle } : p));
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (isLoading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
      <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">System Booting...</p>
    </div>
  );

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 select-none text-slate-800">
      <SidebarComponent 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelect={(id) => { 
          setSelectedProjectId(id); 
          resetView(); 
          setIsSidebarOpen(false); 
          setCurrentView('chart');
        }}
        onCreate={createProject}
        onDelete={deleteProject}
        onRename={renameProject}
        onHighlightNode={(nodeId) => { 
          setHighlightedNodeId(nodeId); 
          setIsSidebarOpen(false); 
          setCurrentView('chart');
        }}
        onViewChange={(view) => {
          setCurrentView(view);
          setIsSidebarOpen(false);
        }}
      />

      <main className="flex-1 relative overflow-hidden flex flex-col">
        <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-3 md:px-6 shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            {/* 3D Tactile Menu Button - Amber/Gold themed */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 md:px-4 md:py-2.5 bg-white hover:bg-amber-50 border-2 border-b-4 border-slate-200 border-b-slate-300 rounded-xl transition-all text-amber-600 active:translate-y-0.5 active:border-b-2 flex items-center gap-2 group shadow-sm shrink-0"
            >
              <Menu className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <span className="hidden sm:inline text-xs font-black uppercase tracking-tighter">Menu</span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1 hidden xs:block"></div>
            
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
              <button
                onClick={() => setCurrentView('chart')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${currentView === 'chart' ? 'bg-white text-indigo-600 shadow-md border-b-2 border-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>조직도</span>
              </button>
              <button
                onClick={() => setCurrentView('report')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${currentView === 'report' ? 'bg-white text-emerald-600 shadow-md border-b-2 border-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>수익보고서</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {currentView === 'chart' && (
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                <button onClick={() => setOrientation('top-down')} className={`p-2 rounded-xl transition-all ${orientation === 'top-down' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`} title="상하"><ArrowDownToLine className="w-4 h-4" /></button>
                <button onClick={() => setOrientation('left-to-right')} className={`p-2 rounded-xl transition-all ${orientation === 'left-to-right' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`} title="좌우"><ArrowRightToLine className="w-4 h-4" /></button>
                <button onClick={() => setOrientation('right-to-left')} className={`p-2 rounded-xl transition-all ${orientation === 'right-to-left' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`} title="우좌"><ArrowLeftToLine className="w-4 h-4" /></button>
              </div>
            )}

            {/* 3D Logout Button */}
            <button 
              onClick={handleLogout} 
              className="p-2 sm:px-4 sm:py-2.5 bg-slate-900 hover:bg-red-600 text-white rounded-xl transition-all font-black text-xs border-b-4 border-black active:translate-y-0.5 active:border-b-2 shadow-lg group shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline ml-2 uppercase tracking-tighter">Logout</span>
            </button>
          </div>
        </header>

        <div 
          ref={containerRef}
          className={`flex-1 overflow-hidden relative bg-slate-50 ${currentView === 'chart' ? `cursor-${isDragging ? 'grabbing' : 'grab'}` : ''}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {selectedProject ? (
            currentView === 'chart' ? (
              <>
                <div 
                  className="absolute inset-0 transition-transform duration-75 ease-out"
                  style={{ 
                    transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                    transformOrigin: '0 0'
                  }}
                >
                  <OrgChart 
                    project={selectedProject} 
                    onUpdate={updateProject} 
                    highlightedNodeId={highlightedNodeId}
                    orientation={orientation}
                  />
                </div>

                <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-3 scale-90 sm:scale-100">
                  <div className="bg-white/80 backdrop-blur-md p-2 rounded-[2rem] shadow-2xl border-2 border-b-4 border-slate-200 border-b-slate-300 flex flex-col gap-2">
                    <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-3 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all"><ZoomIn className="w-5 h-5" /></button>
                    <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="p-3 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all"><ZoomOut className="w-5 h-5" /></button>
                    <button onClick={resetView} className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg border-b-4 border-indigo-800 active:translate-y-0.5 active:border-b-2 transition-all"><Maximize className="w-5 h-5" /></button>
                  </div>
                  <div className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-full text-center shadow-xl uppercase tracking-widest opacity-95 border-b-2 border-black">{Math.round(scale * 100)}%</div>
                </div>
              </>
            ) : (
              <RevenueReport project={selectedProject} onHighlightNode={(id) => { setHighlightedNodeId(id); setCurrentView('chart'); }} />
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6">
              <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center mb-8 shadow-2xl border-2 border-b-[8px] border-slate-100 border-b-slate-200"><Plus className="w-16 h-16 text-slate-200" /></div>
              <h2 className="text-3xl font-black text-slate-800 mb-4 uppercase tracking-tighter">Hierarchy Workspace</h2>
              <button 
                onClick={createProject} 
                className="px-12 py-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-black flex items-center gap-3 shadow-2xl border-b-[6px] border-indigo-800 active:translate-y-1 active:border-b-0 uppercase tracking-tighter text-lg"
              >
                신규 프로젝트 생성
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
