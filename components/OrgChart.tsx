
import React, { useCallback, useMemo } from 'react';
import { Project, OrgNode } from '../types';
import NodeBox from './NodeBox';

interface OrgChartProps {
  project: Project;
  onUpdate: (project: Project) => void;
  highlightedNodeId?: string | null;
  orientation?: 'top-down' | 'left-to-right' | 'right-to-left';
}

interface NodeMetrics {
  totalWithSelf: number;
  childrenTotal: number;
  rank: string | null;
  maxRankInSubtree: number; // 0~8 (S1=1, S2=2...)
}

const OrgChart: React.FC<OrgChartProps> = ({ 
  project, 
  onUpdate, 
  highlightedNodeId,
  orientation = 'top-down'
}) => {
  const { nodes, rootNodeId } = project;

  const isHorizontal = orientation === 'left-to-right' || orientation === 'right-to-left';
  const isRTL = orientation === 'right-to-left';
  const isLTR = orientation === 'left-to-right';
  const isTopDown = orientation === 'top-down';

  const themeColors = [
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500'
  ];

  const allMetrics = useMemo(() => {
    const metricsMap: Record<string, NodeMetrics> = {};

    const calculate = (nodeId: string): NodeMetrics => {
      const node = nodes[nodeId];
      if (!node) return { totalWithSelf: 0, childrenTotal: 0, rank: null, maxRankInSubtree: 0 };

      let childrenSum = 0;
      const childMaxRanks: number[] = [];

      for (const childId of node.children) {
        const childMetric = calculate(childId);
        childrenSum += childMetric.totalWithSelf;
        childMaxRanks.push(childMetric.maxRankInSubtree);
      }

      const totalWithSelf = (node.value || 0) + childrenSum;
      let rank: string | null = null;
      let rankLevel = 0;

      const countBranchesWithRank = (targetLevel: number) => 
        childMaxRanks.filter(lvl => lvl >= targetLevel).length;

      if (childrenSum >= 15000000 && countBranchesWithRank(7) >= 2) { rank = 'S8'; rankLevel = 8; }
      else if (childrenSum >= 5000000 && countBranchesWithRank(6) >= 2) { rank = 'S7'; rankLevel = 7; }
      else if (childrenSum >= 1500000 && countBranchesWithRank(5) >= 2) { rank = 'S6'; rankLevel = 6; }
      else if (childrenSum >= 500000 && countBranchesWithRank(4) >= 2) { rank = 'S5'; rankLevel = 5; }
      else if (childrenSum >= 150000 && countBranchesWithRank(3) >= 2) { rank = 'S4'; rankLevel = 4; }
      else if (childrenSum >= 50000 && countBranchesWithRank(2) >= 2) { rank = 'S3'; rankLevel = 3; }
      else if (childrenSum >= 15000 && countBranchesWithRank(1) >= 2) { rank = 'S2'; rankLevel = 2; }
      else if (childrenSum >= 5000) { rank = 'S1'; rankLevel = 1; }

      const maxRankInSubtree = Math.max(rankLevel, ...childMaxRanks);
      const result = { totalWithSelf, childrenTotal: childrenSum, rank, maxRankInSubtree };
      metricsMap[nodeId] = result;
      return result;
    };

    if (rootNodeId) calculate(rootNodeId);
    return metricsMap;
  }, [nodes, rootNodeId]);

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<OrgNode>) => {
    onUpdate({
      ...project,
      nodes: { ...nodes, [nodeId]: { ...nodes[nodeId], ...updates } }
    });
  }, [nodes, onUpdate, project]);

  const handleAddChild = useCallback((parentId: string) => {
    const newId = crypto.randomUUID();
    const newNode: OrgNode = {
      id: newId,
      name: '새 팀원',
      employeeId: 'ID-' + Math.floor(Math.random() * 1000),
      value: 0,
      children: [],
      parentId: parentId,
    };
    onUpdate({
      ...project,
      nodes: {
        ...nodes,
        [newId]: newNode,
        [parentId]: { ...nodes[parentId], children: [...nodes[parentId].children, newId] }
      }
    });
  }, [nodes, onUpdate, project]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (nodeId === rootNodeId) return;
    const parentId = nodes[nodeId].parentId;
    if (!parentId) return;
    const newNodes = { ...nodes };
    const removeRecursive = (id: string) => {
      newNodes[id].children.forEach(childId => removeRecursive(childId));
      delete newNodes[id];
    };
    removeRecursive(nodeId);
    newNodes[parentId] = { ...newNodes[parentId], children: newNodes[parentId].children.filter(id => id !== nodeId) };
    onUpdate({ ...project, nodes: newNodes });
  }, [nodes, onUpdate, rootNodeId]);

  const renderTree = (nodeId: string, level: number = 0) => {
    const node = nodes[nodeId];
    if (!node) return null;

    const metrics = allMetrics[nodeId] || { childrenTotal: 0, rank: null };
    const hasChildren = node.children.length > 0;

    const treeContainerClass = `flex items-center ${
      isTopDown ? 'flex-col' : isLTR ? 'flex-row' : 'flex-row-reverse'
    }`;

    const currentLineColor = themeColors[level % themeColors.length];

    return (
      <div key={nodeId} className={`${treeContainerClass} flex-1 px-2 sm:px-6`}>
        <NodeBox 
          node={node}
          totalValue={metrics.childrenTotal}
          rank={metrics.rank}
          onUpdate={(updates) => handleUpdateNode(nodeId, updates)}
          onAddChild={() => handleAddChild(nodeId)}
          onDelete={() => handleDeleteNode(nodeId)}
          isRoot={nodeId === rootNodeId}
          level={level}
          isHighlighted={highlightedNodeId === nodeId}
        />
        
        {hasChildren && (
          <div className={treeContainerClass}>
            {/* 부모에서 뻗어나오는 선 (두께 증가: 3px -> 6px) */}
            <div className={`${currentLineColor} shrink-0 opacity-80 ${isHorizontal ? 'w-12 h-[6px]' : 'h-8 w-[6px]'}`}></div>
            
            <div className={`flex ${
              isHorizontal 
                ? (isLTR ? 'flex-col-reverse gap-y-4' : 'flex-col gap-y-4') 
                : 'flex-row gap-x-4'
              } items-stretch w-full relative`}>
              {node.children.map((childId, index) => {
                const isFirst = index === 0;
                const isLast = index === node.children.length - 1;
                const isOnly = node.children.length === 1;

                return (
                  <div key={childId} className={`flex-1 flex flex-col items-center relative ${isHorizontal ? 'min-h-[200px] py-2' : 'min-w-[280px] px-2'}`}>
                    {!isOnly && (
                      <div className={`absolute ${currentLineColor} opacity-80 ${
                        isHorizontal 
                          ? `w-[6px] ${isLTR ? 'left-0' : 'right-0'} ${
                              isLTR 
                                ? (isLast ? 'top-1/2 h-1/2' : isFirst ? 'top-0 h-1/2' : 'top-0 h-full')
                                : (isFirst ? 'top-1/2 h-1/2' : isLast ? 'top-0 h-1/2' : 'top-0 h-full')
                            }`
                          : `h-[6px] top-0 ${isFirst ? 'left-1/2 w-1/2' : isLast ? 'right-1/2 w-1/2' : 'left-0 w-full'}`
                      }`}></div>
                    )}
                    
                    <div className={`flex items-center justify-center w-full h-full ${
                      isHorizontal ? (isRTL ? 'flex-row-reverse' : 'flex-row') : 'flex-col'
                    }`}>
                      {/* 자식 노드로 들어가는 선 (두께 증가: 3px -> 6px) */}
                      <div className={`${currentLineColor} shrink-0 opacity-80 ${isHorizontal ? 'w-12 h-[6px]' : 'h-8 w-[6px]'}`}></div>
                      {renderTree(childId, level + 1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-w-max flex justify-center py-80 px-80">
      <div className="relative flex items-center justify-center">
        {renderTree(rootNodeId)}
      </div>
    </div>
  );
};

export default OrgChart;
