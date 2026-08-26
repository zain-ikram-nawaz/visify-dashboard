'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../../../../../lib/api';

const ENVS = ['studio', 'outdoor', 'showroom', 'dark'];

const inputClass =
  'w-full bg-elevated border border-rim rounded-lg px-4 py-3 text-snow placeholder:text-dim focus:outline-none focus:border-volt transition-colors text-sm';

const labelClass = 'block text-[11px] text-muted uppercase tracking-widest mb-2 font-medium';

export default function NewConfiguratorPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    baseModelUrl: '',
    baseModelName: 'Base',
    shopifyHandle: '',
    backgroundColor: '#0f0f0f',
    environmentLight: 'studio',
  });

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

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
      // Let the browser/Axios set the multipart boundary automatically.
      const res = await api.post('/upload/model', formData);
      set('baseModelUrl', res.data.modelUrl);
      toast.success('Model uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
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
      if (res.data.warning) toast.error(`Configurator created, but Shopify sync failed: ${res.data.warning}`);
      else toast.success('Configurator created');
      router.push(`/dashboard/configurator/${res.data.product._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create configurator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/configurator')}
          className="text-muted hover:text-snow text-sm mb-4 flex items-center gap-1.5 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-snow tracking-tight">New Configurator</h1>
        <p className="text-muted text-sm mt-1">Set up your base product and 3D model</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-surface border border-rim rounded-xl overflow-hidden mb-4">

          {/* Name */}
          <div className="p-5 border-b border-rim">
            <label className={labelClass}>Configurator Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Van Builder, Chair Studio"
              required
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div className="p-5 border-b border-rim">
            <label className={labelClass}>
              Description <span className="text-dim normal-case tracking-normal">— optional</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Short description of this configurator"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Base Model Upload */}
          <div className="p-5 border-b border-rim">
            <label className={labelClass}>Base 3D Model <span className="text-dim normal-case tracking-normal">— .glb or .gltf</span></label>
            {form.baseModelUrl ? (
              <div className="flex items-center gap-3 bg-ok/5 border border-ok/20 rounded-lg px-4 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-ok text-sm flex-1">Base model uploaded</span>
                <button
                  type="button"
                  onClick={() => set('baseModelUrl', '')}
                  className="text-muted hover:text-snow text-xs transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  uploading ? 'border-volt bg-volt/5' : 'border-rim hover:border-volt/50'
                }`}>
                  {uploading ? (
                    <>
                      <div className="vspin mx-auto mb-3" />
                      <p className="text-muted text-sm">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-volt/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B5CF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                      <p className="text-snow text-sm font-medium mb-1">Upload Base Model</p>
                      <p className="text-muted text-xs">The main product — parts will be layered on top</p>
                    </>
                  )}
                </div>
                <input type="file" accept=".glb,.gltf" onChange={handleModelUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>

          {/* Shopify Handle */}
          <div className="p-5 border-b border-rim">
            <label className={labelClass}>
              Shopify Handle <span className="text-dim normal-case tracking-normal">— optional</span>
            </label>
            <input
              type="text"
              value={form.shopifyHandle}
              onChange={(e) => set('shopifyHandle', e.target.value)}
              placeholder="e.g. custom-van-builder"
              className={inputClass}
            />
            <p className="text-dim text-xs mt-2">
              Shopify Admin → Products → your product → Search engine listing → Handle.
              Base price and featured image are pulled automatically from that
              product&apos;s Shopify data — you never type the base price by hand.
            </p>
          </div>

          {/* Environment Lighting */}
          <div className="p-5">
            <label className={labelClass}>Environment Lighting</label>
            <div className="grid grid-cols-4 gap-2">
              {ENVS.map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => set('environmentLight', env)}
                  className={`py-2.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    form.environmentLight === env
                      ? 'bg-volt text-white'
                      : 'bg-elevated text-muted hover:text-snow border border-rim'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-volt hover:bg-volt/90 disabled:opacity-40 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors"
        >
          {loading ? 'Creating...' : 'Create & Add Parts →'}
        </button>
      </form>
    </div>
  );
}
