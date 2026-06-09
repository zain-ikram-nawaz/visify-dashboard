'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../../lib/api';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-400 hover:text-white transition"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold">
          VI<span className="text-indigo-500">SI</span>FY
        </h1>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-2">Analytics</h2>
        <p className="text-gray-400 mb-8">Track your configurator performance</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Total Configurator Views</p>
            <p className="text-4xl font-bold text-indigo-400">{data?.totalViews}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Total Color Changes</p>
            <p className="text-4xl font-bold text-indigo-400">{data?.totalColorChanges}</p>
          </div>
        </div>

        {/* Popular Variants */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Most Popular Colors</h3>
          {data?.popularVariants.length === 0 ? (
            <p className="text-gray-500 text-sm">No color interactions yet</p>
          ) : (
            <div className="space-y-3">
              {data?.popularVariants.map((v, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-4">{i + 1}</span>
                  <div
                    className="w-6 h-6 rounded-full border border-gray-700"
                    style={{ background: v._id }}
                  />
                  <span className="text-gray-300 text-sm flex-1">{v._id}</span>
                  <span className="text-indigo-400 font-semibold text-sm">
                    {v.count} times
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Views */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Last 7 Days Views</h3>
          {data?.dailyViews.length === 0 ? (
            <p className="text-gray-500 text-sm">No views in last 7 days</p>
          ) : (
            <div className="space-y-3">
              {data?.dailyViews.map((day, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm w-24">{day._id}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (day.count / Math.max(...data.dailyViews.map(d => d.count))) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                  <span className="text-indigo-400 font-semibold text-sm w-8">
                    {day.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}