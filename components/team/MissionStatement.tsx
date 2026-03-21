import React from 'react';
import { Card } from '../ui/Card';
import { Target, Shield, Zap } from 'lucide-react';

export function MissionStatement() {
  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 border-indigo-500/20">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Mission Statement</h2>
          <p className="text-slate-400 leading-relaxed">
            Build scalable income-generating systems through disciplined execution, 
            ethical AI automation, and strategic trading — while honoring faith, family, 
            and long-term sustainability over short-term gains.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 lg:gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Focus</p>
              <p className="text-xs text-slate-500">High-ROI priorities</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Integrity</p>
              <p className="text-xs text-slate-500">Ethical boundaries</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-fuchsia-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-fuchsia-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Execution</p>
              <p className="text-xs text-slate-500">Disciplined action</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
