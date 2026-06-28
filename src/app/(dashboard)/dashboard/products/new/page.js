'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../../../../../lib/api';

const inputClass =
  'w-full bg-elevated border border-rim rounded-lg px-4 py-3 text-snow placeholder:text-dim focus:outline-none focus:border-volt transition-colors text-sm';
const labelClass = 'block text-[11px] text-muted uppercase tracking-widest mb-2 font-medium';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', modelUrl: '', materials: '', shopifyHandle: '' });
  const [variants, setVariants] = useState([{ label: 'Default', color: '#7B5CF5' }]);

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
      const res = await api.post('/upload/model', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set('modelUrl', res.data.modelUrl);
      toast.success('3D model uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addVariant = () => setVariants([...variants, { label: '', color: '#ffffff' }]);

  const updateVariant = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const removeVariant = (index) => {
    if (variants.length === 1) { toast.error('At least one variant required'); return; }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.modelUrl) { toast.error('Please upload a 3D model first'); return; }
    if (variants.some((v) => !v.label)) { toast.error('All variants must have a label'); return; }
    setLoading(true);
    try {
      await api.post('/products', {
        name: form.name,
        modelUrl: form.modelUrl,
        variants,
        materials: form.materials ? form.materials.split(',').map((m) => m.trim()) : [],
        shopifyHandle: form.shopifyHandle || null,
      });
      toast.success('Product added');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-muted hover:text-snow text-sm mb-4 flex items-center gap-1.5 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-snow tracking-tight">Add Product</h1>
        <p className="text-muted text-sm mt-1">Upload your 3D model and configure options</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-surface border border-rim rounded-xl overflow-hidden mb-4">

          {/* Product Name */}
          <div className="p-5 border-b border-rim">
            <label className={labelClass}>Product Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Modern Lounge Chair"
              required
              className={inputClass}
            />
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
              placeholder="e.g. modern-lounge-chair"
              className={inputClass}
            />
            <p className="text-dim text-xs mt-2">
              Shopify Admin → Products → your product → Search engine listing → Handle
            </p>
          </div>

          {/* 3D Model Upload */}
          <div className="p-5 border-b border-rim">
            <label className={labelClass}>3D Model File</label>
            {form.modelUrl ? (
              <div className="flex items-center gap-3 bg-ok/5 border border-ok/20 rounded-lg px-4 py-3">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-ok text-sm flex-1">Model uploaded successfully</span>
                <button
                  type="button"
                  onClick={() => set('modelUrl', '')}
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
                      <p className="text-muted text-sm">Uploading to cloud...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-volt/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B5CF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                      <p className="text-snow text-sm font-medium mb-1">Drop your .glb file here</p>
                      <p className="text-muted text-xs">or click to browse</p>
                    </>
                  )}
                </div>
                <input type="file" accept=".glb,.gltf" onChange={handleModelUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>

          {/* Color Variants */}
          <div className="p-5 border-b border-rim">
            <div className="flex items-center justify-between mb-3">
              <label className={labelClass} style={{ marginBottom: 0 }}>Color Variants</label>
              <button
                type="button"
                onClick={addVariant}
                className="text-xs text-volt hover:text-glow transition-colors"
              >
                + Add Color
              </button>
            </div>

            <div className="space-y-2.5 mt-3">
              {variants.map((variant, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-rim">
                    <input
                      type="color"
                      value={variant.color}
                      onChange={(e) => updateVariant(index, 'color', e.target.value)}
                      className="w-full h-full cursor-pointer border-0 p-0 scale-110"
                    />
                  </div>
                  <input
                    type="text"
                    value={variant.label}
                    onChange={(e) => updateVariant(index, 'label', e.target.value)}
                    placeholder="Color name e.g. Midnight Blue"
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-muted hover:text-bad text-lg leading-none shrink-0 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Materials */}
          <div className="p-5">
            <label className={labelClass}>
              Materials <span className="text-dim normal-case tracking-normal">— comma separated</span>
            </label>
            <input
              type="text"
              value={form.materials}
              onChange={(e) => set('materials', e.target.value)}
              placeholder="e.g. leather, fabric, wood"
              className={inputClass}
            />
          </div>
        </div>

        {/* <button
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-volt hover:bg-volt/90 disabled:opacity-40 text-white py-3.5 px-3 rounded-xl font-semibold text-sm transition-colors"
        >
          {loading ? 'Adding Product...' : 'Add Product'}
        </button> */}
      </form>
    </div>
  );
}
