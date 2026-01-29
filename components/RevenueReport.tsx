
import React, { useMemo } from 'react';
import { Project, OrgNode } from '../types';
import { Table, ArrowUpRight, Award, TrendingUp, DollarSign, Users, Hash, UserPlus } from 'lucide-react';

interface RevenueReportProps {
  project: Project;
  onHighlightNode: (id: string) => void;
}

const RevenueReport: React.FC<RevenueReportProps> = ({ project, onHighlightNode }) => {
  const { nodes, rootNodeId } = project;

  const nodeMetrics = useMemo(() => {
    const metrics: Record<string, { level: number; rank: string | null; totalWithSelf: number; childrenSum: number; maxRankInSubtree: number }> = {};
    
    const calculate = (nodeId: string, level: number = 0): any => {
      const node = nodes[nodeId];
      if (!node) return { totalWithSelf: 0, childrenSum: 0, maxRankInSubtree: 0 };

      let childrenSum = 0;
      const childMaxRanks: number[] = [];

      for (const childId of node.children) {
        const childResult = calculate(childId, level + 1);
        childrenSum += childResult.totalWithSelf;
        childMaxRanks.push(childResult.maxRankInSubtree);
      }

      const totalWithSelf = (node.value || 0) + childrenSum;
      let rank: string | null = null;
      let rankLevel = 0;
      const countBranchesWithRank = (targetLevel: number) => 
        childMaxRanks.filter(lvl => lvl >= targetLevel).length;

      // 직급 판정 로직 동기화
      if (childrenSum >= 15000000 && countBranchesWithRank(7) >= 2) { rank = 'S8'; rankLevel = 8; }
      else if (childrenSum >= 5000000 && countBranchesWithRank(6) >= 2) { rank = 'S7'; rankLevel = 7; }
      else if (childrenSum >= 1500000 && countBranchesWithRank(5) >= 2) { rank = 'S6'; rankLevel = 6; }
      else if (childrenSum >= 500000 && countBranchesWithRank(4) >= 2) { rank = 'S5'; rankLevel = 5; }
      else if (childrenSum >= 150000 && countBranchesWithRank(3) >= 2) { rank = 'S4'; rankLevel = 4; }
      else if (childrenSum >= 50000 && countBranchesWithRank(2) >= 2) { rank = 'S3'; rankLevel = 3; }
      else if (childrenSum >= 15000 && countBranchesWithRank(1) >= 2) { rank = 'S2'; rankLevel = 2; }
      else if (childrenSum >= 5000) { rank = 'S1'; rankLevel = 1; }

      const maxRankInSubtree = Math.max(rankLevel, ...childMaxRanks);
      metrics[nodeId] = { level, rank, totalWithSelf, childrenSum, maxRankInSubtree };
      return { totalWithSelf, childrenSum, maxRankInSubtree };
    };

    if (rootNodeId) calculate(rootNodeId);
    return metrics;
  }, [nodes, rootNodeId]);

  const reportData = useMemo(() => {
    const allNodes = Object.values(nodes) as OrgNode[];
    const miningRewardsMap: Record<string, number> = {};
    allNodes.forEach(node => {
      miningRewardsMap[node.id] = (node.value || 0) * 0.007;
    });

    return allNodes.map(currentNode => {
      const metric = nodeMetrics[currentNode.id] || { level: 0, rank: null, totalWithSelf: 0, childrenSum: 0 };
      const miningReward = miningRewardsMap[currentNode.id];
      
      const myRecruits = allNodes.filter(targetNode => {
        const targetRecommender = targetNode.employeeId.trim().toLowerCase();
        const currentName = currentNode.name.trim().toLowerCase();
        return targetRecommender === currentName && targetNode.id !== currentNode.id;
      });

      let referralBaseSum = 0;
      myRecruits.forEach(recruit => {
        referralBaseSum += miningRewardsMap[recruit.id] || 0;
      });
      const referralReward = referralBaseSum * 0.1;
      
      let rankMultiplier = 0;
      if (metric.rank) {
        rankMultiplier = parseInt(metric.rank.substring(1));
      }

      const communityReward = metric.childrenSum * 0.007 * 0.1 * rankMultiplier;
      const totalSum = miningReward + referralReward + communityReward;

      return {
        id: currentNode.id,
        recommender: currentNode.employeeId,
        name: currentNode.name,
        level: metric.level,
        rank: metric.rank,
        mining: miningReward,
        referral: referralReward,
        community: communityReward,
        total: totalSum
      };
    }).sort((a, b) => a.level - b.level);
  }, [nodes, nodeMetrics]);

  const totalSummary = useMemo(() => {
    return reportData.reduce((acc, curr) => acc + curr.total, 0);
  }, [reportData]);

  return (
    <div className="h-full flex flex-col bg-slate-50 animate-in fade-in duration-500">
      <div className="p-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Financial Audit Report</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{project.title} 수당 리포트</h1>
            <p className="text-xs font-bold text-slate-400">
              S1~S8 직급 체계 반영 | 채굴(0.7%) | 추천(10%) | 커뮤니티(SubTotal × 0.7% × 10% × Rank)
            </p>
          </div>
          <div className="bg-slate-900 px-8 py-5 rounded-[2rem] text-white shadow-2xl flex flex-col items-end">
            <span className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest mb-1">Total Rewards</span>
            <span className="text-3xl font-black">$ {totalSummary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 px-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Table className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Reward Table</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-orange-100 text-orange-900">
                    <th className="p-6 py-4 text-[11px] font-black uppercase w-16">No.</th>
                    <th className="p-6 py-4 text-[11px] font-black uppercase">추천인</th>
                    <th className="p-6 py-4 text-[11px] font-black uppercase">이름</th>
                    <th className="p-6 py-4 text-[11px] font-black uppercase text-right">채굴(0.7%)</th>
                    <th className="p-6 py-4 text-[11px] font-black uppercase text-right">추천(10%)</th>
                    <th className="p-6 py-4 text-[11px] font-black uppercase text-right">커뮤니티</th>
                    <th className="p-6 py-4 text-[11px] font-black uppercase text-right bg-emerald-600 text-white">합계</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group cursor-pointer" onClick={() => onHighlightNode(item.id)}>
                      <td className="p-6 py-5 text-[11px] font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className="p-6 py-5">
                        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] font-bold bg-slate-100 px-2 py-1 rounded w-fit uppercase">
                          {item.recommender || '-'}
                        </div>
                      </td>
                      <td className="p-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-slate-800 uppercase tracking-tight">{item.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold text-slate-400">LV.{item.level}</span>
                            {item.rank && (
                              <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">
                                <Award className="w-2.5 h-2.5" />
                                <span className="text-[9px] font-black italic">{item.rank}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-6 py-5 text-right text-[13px] font-bold text-slate-600">$ {item.mining.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-6 py-5 text-right text-[13px] font-bold text-slate-600">$ {item.referral.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-6 py-5 text-right text-[13px] font-bold text-slate-600">$ {item.community.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-6 py-5 text-right text-[14px] font-black text-emerald-600 bg-emerald-50/50 group-hover:bg-emerald-100/50">$ {item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueReport;
