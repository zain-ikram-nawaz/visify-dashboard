'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../../../../../lib/api';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    modelUrl: '',
    materials: '',
  });
  const [variants, setVariants] = useState([
    { label: 'Default', color: '#4F46E5' },
  ]);

  // ── Model Upload ──────────────────────────────────────
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

      setForm((prev) => ({ ...prev, modelUrl: res.data.modelUrl }));
      toast.success('3D Model uploaded!');
    } catch (err) {
      toast.error('Upload failed — try again');
    } finally {
      setUploading(false);
    }
  };

  // ── Variants ──────────────────────────────────────────
  const addVariant = () => {
    setVariants([...variants, { label: '', color: '#ffffff' }]);
  };

  const updateVariant = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const removeVariant = (index) => {
    if (variants.length === 1) {
      toast.error('At least one variant required');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.modelUrl) {
      toast.error('Please upload a 3D model first');
      return;
    }

    if (variants.some((v) => !v.label)) {
      toast.error('All variants must have a label');
      return;
    }

    setLoading(true);
    try {
      await api.post('/products', {
        name: form.name,
        modelUrl: form.modelUrl,
        variants,
        materials: form.materials
          ? form.materials.split(',').map((m) => m.trim())
          : [],
      });

      toast.success('Product added successfully!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

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

      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-2">Add New Product</h2>
        <p className="text-gray-400 mb-8">Upload your 3D model and configure options</p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Product Name */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <label className="block text-sm text-gray-400 mb-2">Product Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Modern Lounge Chair"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* 3D Model Upload */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <label className="block text-sm text-gray-400 mb-2">3D Model File</label>

            {form.modelUrl ? (
              <div className="flex items-center gap-3 bg-green-900/30 border border-green-700 rounded-lg px-4 py-3">
                <span className="text-green-400">✓</span>
                <span className="text-green-400 text-sm">Model uploaded successfully</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, modelUrl: '' })}
                  className="ml-auto text-gray-500 hover:text-white text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="block">
                <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
                  ${uploading ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-700 hover:border-indigo-500'}`}>
                  {uploading ? (
                    <>
                      <div className="w-8 h-8 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-gray-400 text-sm">Uploading to Cloudinary...</p>
                    </>
                  ) : (
                    <>
                      <p className="text-4xl mb-3">📦</p>
                      <p className="text-gray-300 font-medium mb-1">Drop your .glb file here</p>
                      <p className="text-gray-500 text-sm">or click to browse</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleModelUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Color Variants */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm text-gray-400">Color Variants</label>
              <button
                type="button"
                onClick={addVariant}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition"
              >
                + Add Color
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={variant.color}
                    onChange={(e) => updateVariant(index, 'color', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={variant.label}
                    onChange={(e) => updateVariant(index, 'label', e.target.value)}
                    placeholder="Color name e.g. Red"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-gray-600 hover:text-red-400 transition text-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Materials */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <label className="block text-sm text-gray-400 mb-2">
              Materials
              <span className="text-gray-600 ml-2">(comma separated)</span>
            </label>
            <input
              type="text"
              value={form.materials}
              onChange={(e) => setForm({ ...form, materials: e.target.value })}
              placeholder="e.g. leather, fabric, wood"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-xl font-semibold text-lg transition"
          >
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>

        </form>
      </div>
    </div>
  );
}