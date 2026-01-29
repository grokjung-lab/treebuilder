
import React, { useMemo, useState } from 'react';
import { Project, OrgNode } from '../types';
import { Table, ArrowUpRight, Award, TrendingUp, DollarSign, Users, Hash, UserPlus, Zap } from 'lucide-react';

interface RevenueReportProps {
  project: Project;
  onHighlightNode: (id: string) => void;
}

const RevenueReport: React.FC<RevenueReportProps> = ({ project, onHighlightNode }) => {
  const { nodes, rootNodeId } = project;
  
  // 채굴 요율 상태 추가 (기본값 0.7%)
  const [miningRate, setMiningRate] = useState(0.007);

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
    
    // 선택된 miningRate를 사용하여 채굴 보상 계산
    allNodes.forEach(node => {
      miningRewardsMap[node.id] = (node.value || 0) * miningRate;
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

      // 커뮤니티 보상도 선택된 miningRate 반영
      const communityReward = metric.childrenSum * miningRate * 0.1 * rankMultiplier;
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
  }, [nodes, nodeMetrics, miningRate]);

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
            <p className="text-xs font-bold text-red-400">
              S1~S8 직급 체계 반영 | 채굴({(miningRate * 100).toFixed(1)}%) | 추천(10%) | 커뮤니티(SubTotal × {(miningRate * 100).toFixed(1)}% × 10% × Rank)
            </p>
          </div>
          {/* 요약 박스 배경을 연한 주황색(bg-orange-100)으로 변경 */}
          <div className="bg-orange-100 px-8 py-5 rounded-[2rem] text-orange-950 shadow-2xl flex flex-col items-end border-b-[8px] border-orange-300">
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Total Rewards</span>
            <span className="text-3xl font-black">$ {totalSummary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {/* 강화된 3D 테이블 컨테이너 */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl border-2 border-slate-200 border-b-[12px] border-slate-300 overflow-hidden">
            <div className="p-6 px-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Table className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Reward Table</span>
              </div>
              
              {/* 채굴 요율 선택기 UI */}
              <div className="flex items-center gap-2 bg-slate-200/50 p-1.5 rounded-2xl border border-slate-300 shadow-inner">
                <div className="flex items-center gap-2 px-3 mr-1">
                  <Zap className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Mining Rate</span>
                </div>
                {[0.007, 0.008, 0.009].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setMiningRate(rate)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-b-2 active:translate-y-0.5 active:border-b-0 ${
                      miningRate === rate 
                        ? 'bg-orange-500 text-white border-orange-700 shadow-md scale-105' 
                        : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                    }`}
                  >
                    {(rate * 100).toFixed(1)}%
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-orange-100 text-orange-900">
                    <th className="p-6 py-4 text-[11px] font-black uppercase w-16">No.</th>
                    <th className="p-6 py-4 text-[11px] font-black uppercase">추천인</th>
                    <th className="p-6 py-4 text-[11px] font-black uppercase">이름</th>
                    <th className="p-6 py-4 text-[11px] font-black uppercase text-right">채굴({(miningRate * 100).toFixed(1)}%)</th>
                    <th className="p-6 py-4 text-[11px] font-black uppercase text-right">추천(10%)</th>
                    <th className="p-6 py-4 text-[11px] font-black uppercase text-right">커뮤니티</th>
                    <th className="p-6 py-4 text-[11px] font-black uppercase text-right bg-emerald-600 text-white">합계</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group cursor-pointer" onClick={() => onHighlightNode(item.id)}>
                      {/* 순번 색상을 검정색(text-black)으로 변경 */}
                      <td className="p-6 py-5 text-[11px] font-black text-black">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className="p-6 py-5">
                        <div className="flex items-center gap-2 text-orange-600 font-mono text-[11px] font-bold bg-orange-50 px-2 py-1 rounded w-fit uppercase border border-orange-100">
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
