'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../../lib/api';
import toast from 'react-hot-toast';

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
console.log(products,"conf")
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">← Back</button>
          <h1 className="text-xl font-bold">VI<span className="text-indigo-500">SI</span>FY</h1>
        </div>
        <button
          onClick={() => router.push('/dashboard/configurator/new')}
          className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium"
        >
          + New Configurator
        </button>

      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-2">3D Configurators</h2>
        <p className="text-gray-400 mb-8">Build advanced product configurators with parts and variants</p>

        {products.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-16 text-center">
            <p className="text-5xl mb-4">⚙️</p>
            <p className="text-gray-400 mb-6">No configurators yet</p>
            <button
              onClick={() => router.push('/dashboard/configurator/new')}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-medium"
            >
              Create First Configurator
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => (
              <div key={p._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-500 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{p.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{p.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.isPublished ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>
                      {p.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 text-xs text-gray-500 mb-4">
                  <span>🧩 {p.parts.length} parts</span>
                  <span>•</span>
                  <span>💰 Base ${p.basePrice}</span>
                  {p.shopifyHandle && (
                    <>
                      <span>•</span>
                      <span>🔗 {p.shopifyHandle}</span>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/configurator/${p._id}`)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg text-sm font-medium"
                  >
                    Edit & Build
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="px-4 py-2 border border-red-900 hover:border-red-700 text-red-400 rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}