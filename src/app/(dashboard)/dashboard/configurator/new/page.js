'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../../../../../lib/api';

export default function NewConfiguratorPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    baseModelUrl: '',
    baseModelName: 'Base',
    basePrice: 0,
    shopifyHandle: '',
    backgroundColor: '#0f0f0f',
    environmentLight: 'studio',
  });

  const handleModelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      toast.error('Only .glb or .gltf files allowed');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('model', file);
      const res = await api.post('/upload/model', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(prev => ({ ...prev, baseModelUrl: res.data.modelUrl }));
      toast.success('Base model uploaded!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.baseModelUrl) {
      toast.error('Please upload a base 3D model');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/configurator/products', form);
      toast.success('Configurator created!');
      router.push(`/dashboard/configurator/${res.data.product._id}`);
    } catch (err) {
      toast.error('Failed to create configurator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/configurator')} className="text-gray-400 hover:text-white">← Back</button>
        <h1 className="text-xl font-bold">VI<span className="text-indigo-500">SI</span>FY</h1>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-2">New Configurator</h2>
        <p className="text-gray-400 mb-8">Start by setting up your base product and 3D model</p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <label className="block text-sm text-gray-400 mb-2">Configurator Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Van Builder, Chair Studio"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <label className="block text-sm text-gray-400 mb-2">Description <span className="text-gray-600">(optional)</span></label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description of this configurator"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Base Model Upload */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <label className="block text-sm text-gray-400 mb-2">Base 3D Model <span className="text-gray-600">(.glb or .gltf)</span></label>
            {form.baseModelUrl ? (
              <div className="flex items-center gap-3 bg-green-900/30 border border-green-700 rounded-lg px-4 py-3">
                <span className="text-green-400">✓</span>
                <span className="text-green-400 text-sm">Base model uploaded</span>
                <button type="button" onClick={() => setForm({ ...form, baseModelUrl: '' })} className="ml-auto text-gray-500 hover:text-white text-sm">Remove</button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition ${uploading ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-700 hover:border-indigo-500'}`}>
                  {uploading ? (
                    <>
                      <div className="w-8 h-8 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-gray-400 text-sm">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <p className="text-4xl mb-3">📦</p>
                      <p className="text-gray-300 font-medium mb-1">Upload Base Model</p>
                      <p className="text-gray-500 text-sm">This is the main product — parts will be added on top</p>
                    </>
                  )}
                </div>
                <input type="file" accept=".glb,.gltf" onChange={handleModelUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>

          {/* Base Price */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <label className="block text-sm text-gray-400 mb-2">Base Price ($)</label>
            <input
              type="number"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              min="0"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Shopify Handle */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <label className="block text-sm text-gray-400 mb-2">
              Shopify Product Handle
              <span className="text-gray-600 ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={form.shopifyHandle}
              onChange={(e) => setForm({ ...form, shopifyHandle: e.target.value })}
              placeholder="e.g. custom-van-builder"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-gray-600 text-xs mt-2">Shopify Admin → Products → your product → Search engine listing → Handle</p>
          </div>

          {/* Environment */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <label className="block text-sm text-gray-400 mb-3">Environment Lighting</label>
            <div className="grid grid-cols-4 gap-2">
              {['studio', 'outdoor', 'showroom', 'dark'].map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => setForm({ ...form, environmentLight: env })}
                  className={`py-2 rounded-lg text-sm font-medium capitalize transition ${
                    form.environmentLight === env
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-xl font-semibold text-lg"
          >
            {loading ? 'Creating...' : 'Create & Add Parts →'}
          </button>

        </form>
      </div>
    </div>
  );
}