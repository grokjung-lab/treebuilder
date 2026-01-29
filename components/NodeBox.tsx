
import React, { useEffect, useRef } from 'react';
import { OrgNode } from '../types';
import { User, Hash, Coins, Plus, Trash2, Award, UserPlus } from 'lucide-react';

interface NodeBoxProps {
  node: OrgNode;
  totalValue: number;
  rank: string | null;
  onUpdate: (updates: Partial<OrgNode>) => void;
  onAddChild: () => void;
  onDelete: () => void;
  isRoot: boolean;
  level: number;
  isHighlighted?: boolean;
}

const NodeBox: React.FC<NodeBoxProps> = ({ 
  node, 
  totalValue, 
  rank,
  onUpdate, 
  onAddChild, 
  onDelete, 
  isRoot,
  level,
  isHighlighted
}) => {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHighlighted && boxRef.current) {
      boxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isHighlighted]);

  // 레벨별 색상 테마 정의 (3D 두께감을 위한 depth 색상 추가)
  const themes = [
    { border: 'border-indigo-500', depth: 'border-b-indigo-700', badge: 'bg-indigo-600', text: 'text-indigo-600', ring: 'ring-indigo-100', bg: 'bg-indigo-50/30', shadow: 'shadow-indigo-900/20' },
    { border: 'border-emerald-500', depth: 'border-b-emerald-700', badge: 'bg-emerald-600', text: 'text-emerald-600', ring: 'ring-emerald-100', bg: 'bg-emerald-50/30', shadow: 'shadow-emerald-900/20' },
    { border: 'border-amber-500', depth: 'border-b-amber-700', badge: 'bg-amber-600', text: 'text-amber-600', ring: 'ring-amber-100', bg: 'bg-amber-50/30', shadow: 'shadow-amber-900/20' },
    { border: 'border-rose-500', depth: 'border-b-rose-700', badge: 'bg-rose-600', text: 'text-rose-600', ring: 'ring-rose-100', bg: 'bg-rose-50/30', shadow: 'shadow-rose-900/20' }
  ];

  const currentTheme = themes[level % themes.length];

  // 입력 시 초기값 비우기 핸들러
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>, defaultValue: string | number) => {
    if (String(e.target.value) === String(defaultValue)) {
      e.target.value = '';
    }
  };

  return (
    <div 
      ref={boxRef}
      className={`relative w-64 transition-all duration-300 transform ${
        isHighlighted 
          ? 'scale-110 -translate-y-4 z-50' 
          : 'hover:-translate-y-2 active:translate-y-0'
      }`}
    >
      {/* 3D Depth Layer & Main Box Body */}
      <div className={`
        relative rounded-[2rem] border-2 border-b-[8px] transition-all duration-300
        ${isHighlighted ? 'border-yellow-500 border-b-yellow-700 shadow-2xl ring-4 ring-yellow-400/30' : `${currentTheme.border} ${currentTheme.depth} ${currentTheme.shadow} shadow-xl`}
        bg-white overflow-hidden
      `}>
        {/* Subtle Face Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-slate-50/50 pointer-events-none" />
        
        <div className="relative p-5 space-y-4">
          {/* Toolbar & Badge Section */}
          <div className="flex justify-between items-center">
            <div className={`flex items-center gap-1.5 ${currentTheme.badge} text-white px-3 py-1.5 rounded-xl shadow-lg transition-all duration-300`}>
              {rank ? (
                <>
                  <Award className="w-3.5 h-3.5 fill-white" />
                  <span className="text-[11px] font-black italic tracking-tighter uppercase">{rank}</span>
                </>
              ) : (
                <span className="text-[10px] font-black italic tracking-tighter uppercase">LV.{level} UNIT</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={onAddChild}
                className={`p-3 hover:bg-slate-100 rounded-2xl transition-all ${currentTheme.text} bg-slate-50 border-2 border-b-4 border-slate-200 border-b-slate-300 hover:border-amber-400 active:translate-y-0.5 active:border-b-2`}
                title="팀원 추가"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
              {!isRoot && (
                <button 
                  onClick={onDelete}
                  className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors bg-slate-50 border border-slate-100"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4 stroke-[3]" />
                </button>
              )}
            </div>
          </div>

          {/* Inputs Section */}
          <div className="space-y-3">
            {/* 1. Name Input */}
            <div className="flex items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:border-indigo-300 transition-all">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                className="w-full text-base font-black outline-none bg-transparent text-slate-800 placeholder:text-slate-300 uppercase tracking-tight"
                value={node.name}
                placeholder="이름 (Name)"
                onFocus={(e) => handleFocus(e, '새 팀원')}
                onChange={(e) => onUpdate({ name: e.target.value })}
              />
            </div>

            {/* 2. Recommender Input - Font size increased from text-sm to text-base */}
            <div className="flex items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:border-indigo-300 transition-all">
              <UserPlus className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                className="w-full text-base font-mono font-bold outline-none bg-transparent text-orange-600 placeholder:text-slate-300"
                value={node.employeeId}
                placeholder="추천인 (Recommender)"
                onFocus={(e) => handleFocus(e, node.employeeId.startsWith('ID-') ? node.employeeId : '')}
                onChange={(e) => onUpdate({ employeeId: e.target.value })}
              />
            </div>

            {/* 3. Value Input */}
            <div className={`flex items-center gap-3 p-3 rounded-2xl bg-white border-2 ${currentTheme.border} shadow-inner`}>
              <Coins className={`w-4 h-4 ${currentTheme.text}`} />
              <div className="flex items-center gap-1 w-full">
                <span className="text-sm font-black text-slate-400">$</span>
                <input
                  type="number"
                  className="w-full text-base outline-none font-black bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900"
                  value={node.value === 0 ? '' : node.value}
                  placeholder="0"
                  onFocus={(e) => handleFocus(e, 0)}
                  onChange={(e) => onUpdate({ value: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="pt-4 flex justify-between items-center border-t-2 border-dashed border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase leading-none tracking-widest">Sub Total</span>
              <span className="text-[9px] text-slate-300 font-bold">(Cumulative)</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-black text-slate-400">$</span>
              <span className="text-xl font-black text-slate-900 leading-none tracking-tighter">
                {totalValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Shine Effect */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-[2rem] pointer-events-none" />
    </div>
  );
};

export default NodeBox;
