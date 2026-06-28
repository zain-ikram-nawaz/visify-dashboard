'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../../../../lib/api';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics');
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="vspin" />
      </div>
    );
  }

  const maxViews = data?.dailyViews?.length
    ? Math.max(...data.dailyViews.map((d) => d.count), 1)
    : 1;

  return (
    <div className="p-8 max-w-3xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-snow tracking-tight">Analytics</h1>
        <p className="text-muted text-sm mt-1">Track your configurator performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-surface border border-rim rounded-xl p-6">
          <p className="text-[11px] text-muted uppercase tracking-widest mb-3 font-medium">Total Views</p>
          <p className="text-5xl font-bold text-volt tabular-nums">{data?.totalViews ?? 0}</p>
        </div>
        <div className="bg-surface border border-rim rounded-xl p-6">
          <p className="text-[11px] text-muted uppercase tracking-widest mb-3 font-medium">Color Interactions</p>
          <p className="text-5xl font-bold text-volt tabular-nums">{data?.totalColorChanges ?? 0}</p>
        </div>
      </div>

      {/* Popular Colors */}
      <div className="bg-surface border border-rim rounded-xl p-6 mb-4">
        <h2 className="text-[11px] text-muted uppercase tracking-widest mb-5 font-medium">Most Popular Colors</h2>
        {!data?.popularVariants?.length ? (
          <p className="text-dim text-sm">No color interactions yet</p>
        ) : (
          <div className="space-y-3">
            {data.popularVariants.map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-dim text-xs tabular-nums w-5 text-right">{i + 1}</span>
                <div
                  className="w-6 h-6 rounded-full shrink-0"
                  style={{ background: v._id, border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <span className="text-muted text-sm flex-1 font-mono text-xs">{v._id}</span>
                <span className="text-glow font-semibold text-sm tabular-nums">
                  {v.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Views */}
      <div className="bg-surface border border-rim rounded-xl p-6">
        <h2 className="text-[11px] text-muted uppercase tracking-widest mb-5 font-medium">Last 7 Days</h2>
        {!data?.dailyViews?.length ? (
          <p className="text-dim text-sm">No views in the last 7 days</p>
        ) : (
          <div className="space-y-3">
            {data.dailyViews.map((day, i) => {
              const pct = Math.min((day.count / maxViews) * 100, 100);
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-muted text-xs w-20 shrink-0">{day._id}</span>
                  <div className="flex-1 bg-elevated rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-volt h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-glow font-semibold text-sm tabular-nums w-8 text-right">
                    {day.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
