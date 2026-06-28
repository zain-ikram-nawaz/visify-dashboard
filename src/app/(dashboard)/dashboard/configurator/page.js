'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../../../../lib/api';

export default function ConfiguratorPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/configurator/products');
      setProducts(res.data.products);
    } catch (err) {
      toast.error('Failed to load configurators');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this configurator?')) return;
    try {
      await api.delete(`/configurator/products/${id}`);
      toast.success('Deleted');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="vspin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-snow tracking-tight">Configurators</h1>
          <p className="text-muted text-sm mt-1">Build 3D product configurators with parts and variants</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/configurator/new')}
          className="bg-volt hover:bg-volt/90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          + New Configurator
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-surface border border-rim border-dashed rounded-xl p-16 text-center">
          <div className="w-12 h-12 bg-volt/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7B5CF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <p className="text-snow font-semibold mb-1">No configurators yet</p>
          <p className="text-muted text-sm mb-6">Create your first 3D configurator to get started</p>
          <button
            onClick={() => router.push('/dashboard/configurator/new')}
            className="bg-volt hover:bg-volt/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Create first configurator
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div key={p._id} className="bg-surface border border-rim rounded-xl p-5 glow-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-snow text-[15px] leading-snug truncate">{p.name}</h3>
                  {p.description && (
                    <p className="text-muted text-xs mt-1 truncate">{p.description}</p>
                  )}
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ml-3 shrink-0 ${
                  p.isPublished ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'
                }`}>
                  {p.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="flex gap-4 text-xs text-dim mb-4">
                <span>{p.parts.length} parts</span>
                <span>·</span>
                <span>${p.basePrice} base</span>
                {p.shopifyHandle && (
                  <>
                    <span>·</span>
                    <span className="truncate">{p.shopifyHandle}</span>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/dashboard/configurator/${p._id}`)}
                  className="flex-1 bg-volt hover:bg-volt/90 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Edit & Build
                </button>
                <button
                  onClick={() => handleDelete(p._id)}
                  className="px-4 py-2 border border-rim hover:border-bad/50 text-muted hover:text-bad rounded-lg text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
