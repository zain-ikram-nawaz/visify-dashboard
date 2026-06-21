'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../../../../../lib/api';

export default function ConfiguratorBuilderPage() {
  const router = useRouter();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddPart, setShowAddPart] = useState(false);
  const [showAddVariant, setShowAddVariant] = useState(null); // partId
  const [uploading, setUploading] = useState(false);

  const [partForm, setPartForm] = useState({
    name: '',
    description: '',
    modelUrl: '',
    category: 'general',
    basePrice: 0,
    isDefault: false,
    isRequired: false,
  });
  const [variantForm, setVariantForm] = useState({
    label: '',
    type: 'color',
    value: '#ffffff',
    priceModifier: 0,
  });

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const [productRes, brandRes] = await Promise.all([
        api.get(`/configurator/products/${id}`),
        api.get('/auth/me'),
      ]);
      setProduct(productRes.data.product);
      setBrand(brandRes.data.brand);
    } catch (err) {
      toast.error('Failed to load configurator');
      router.push('/dashboard/configurator');
    } finally {
      setLoading(false);
    }
  };

  // ── Part Model Upload ──
  const handlePartModelUpload = async (e) => {
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
      setPartForm(prev => ({ ...prev, modelUrl: res.data.modelUrl }));
      toast.success('Part model uploaded!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Add Part ──
  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!partForm.modelUrl) {
      toast.error('Please upload a 3D model for this part');
      return;
    }
    try {
      await api.post(`/configurator/products/${id}/parts`, partForm);
      toast.success('Part added!');
      setShowAddPart(false);
      setPartForm({ name: '', description: '', modelUrl: '', category: 'general', basePrice: 0, isDefault: false, isRequired: false });
      fetchProduct();
    } catch (err) {
      toast.error('Failed to add part');
    }
  };

  // ── Delete Part ──
  const handleDeletePart = async (partId) => {
    if (!confirm('Delete this part?')) return;
    try {
      await api.delete(`/configurator/products/${id}/parts/${partId}`);
      toast.success('Part deleted');
      fetchProduct();
    } catch (err) {
      toast.error('Failed to delete part');
    }
  };

  // ── Add Variant ──
  const handleAddVariant = async (e, partId) => {
    e.preventDefault();
    try {
      await api.post(`/configurator/products/${id}/parts/${partId}/variants`, variantForm);
      toast.success('Variant added!');
      setShowAddVariant(null);
      setVariantForm({ label: '', type: 'color', value: '#ffffff', priceModifier: 0 });
      fetchProduct();
    } catch (err) {
      toast.error('Failed to add variant');
    }
  };

  // ── Delete Variant ──
  const handleDeleteVariant = async (partId, variantId) => {
    try {
      await api.delete(`/configurator/products/${id}/parts/${partId}/variants/${variantId}`);
      toast.success('Variant deleted');
      fetchProduct();
    } catch (err) {
      toast.error('Failed to delete variant');
    }
  };

  // ── Publish Toggle ──
  const handlePublishToggle = async () => {
    try {
      await api.put(`/configurator/products/${id}`, {
        isPublished: !product.isPublished,
      });
      toast.success(product.isPublished ? 'Unpublished' : 'Published!');
      fetchProduct();
    } catch (err) {
      toast.error('Failed to update');
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
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/configurator')} className="text-gray-400 hover:text-white">← Back</button>
          <h1 className="text-xl font-bold">VI<span className="text-indigo-500">SI</span>FY</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1 rounded-full ${product.isPublished ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>
            {product.isPublished ? 'Published' : 'Draft'}
          </span>
          <button
            onClick={handlePublishToggle}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              product.isPublished
                ? 'border border-gray-700 hover:border-gray-500 text-gray-300'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {product.isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <p className="text-gray-400 mt-1">{product.description || 'No description'}</p>
          <div className="flex gap-4 mt-3 text-sm text-gray-500">
            <span>💰 Base price: ${product.basePrice}</span>
            {product.shopifyHandle && <span>🔗 {product.shopifyHandle}</span>}
            <span>🧩 {product.parts.length} parts</span>
          </div>
        </div>

        {/* Base Model */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Base Model</p>
              <p className="font-semibold">{product.baseModelName}</p>
              <p className="text-gray-500 text-xs mt-1 break-all">{product.baseModelUrl}</p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </div>

        {/* Shopify Embed Code */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Shopify Embed Code</p>
              <p className="text-gray-400 text-xs">
                Apne Shopify product page ki theme file mein paste karo
              </p>
            </div>
            <button
              onClick={() => {
                const code = `<div id="visify-configurator"></div>\n<script>\n  window.VISIFY_API_KEY = '${brand?.apiKey}';\n  window.VISIFY_PRODUCT_ID = '{{ product.handle }}';\n<\/script>\n<script type="module" src="${process.env.NEXT_PUBLIC_VIEWER_URL || 'https://viewer.visify.io'}/src/index.js"><\/script>`;
                navigator.clipboard.writeText(code);
                toast.success('Embed code copied!');
              }}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
            >
              Copy Code
            </button>
          </div>
          <pre className="bg-gray-800 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre">
{`<div id="visify-configurator"></div>
<script>
  window.VISIFY_API_KEY = '${brand?.apiKey || 'loading...'}';
  window.VISIFY_PRODUCT_ID = '{{ product.handle }}';
</script>
<script type="module" src="YOUR_VIEWER_URL/src/index.js"></script>`}
          </pre>
          {product?.shopifyHandle && (
            <p className="text-gray-600 text-xs mt-2">
              Linked Shopify handle: <span className="text-indigo-400">{product.shopifyHandle}</span>
            </p>
          )}
          {!product?.shopifyHandle && (
            <p className="text-yellow-600 text-xs mt-2">
              ⚠ Shopify handle set nahi hua — configurator create/edit karte waqt handle daalo
            </p>
          )}
        </div>

        {/* Parts Section */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Parts</h3>
          <button
            onClick={() => setShowAddPart(true)}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Part
          </button>
        </div>

        {/* Parts List */}
        {product.parts.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-10 text-center mb-6">
            <p className="text-3xl mb-3">🧩</p>
            <p className="text-gray-400 mb-4">No parts yet — add wheels, bumpers, accessories</p>
            <button
              onClick={() => setShowAddPart(true)}
              className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg text-sm font-medium"
            >
              Add First Part
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {product.parts.map((part) => (
              <div key={part._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">

                {/* Part Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{part.name}</h4>
                      {part.isDefault && <span className="text-xs bg-blue-900 text-blue-400 px-2 py-0.5 rounded-full">Default</span>}
                      {part.isRequired && <span className="text-xs bg-red-900 text-red-400 px-2 py-0.5 rounded-full">Required</span>}
                    </div>
                    <p className="text-gray-500 text-xs">{part.description || 'No description'}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-600">
                      <span>Category: {part.category}</span>
                      <span>Price: +${part.basePrice}</span>
                      <span>{part.variants.length} variants</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePart(part._id)}
                    className="text-red-400 hover:text-red-300 text-sm border border-red-900 hover:border-red-700 px-3 py-1 rounded-lg"
                  >
                    Delete
                  </button>
                </div>

                {/* Variants */}
                <div className="border-t border-gray-800 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Variants</p>
                    <button
                      onClick={() => setShowAddVariant(part._id)}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      + Add Variant
                    </button>
                  </div>

                  {part.variants.length === 0 ? (
                    <p className="text-gray-600 text-xs">No variants — add colors or textures</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {part.variants.map((v) => (
                        <div key={v._id} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
                          {v.type === 'color' && (
                            <div className="w-4 h-4 rounded-full border border-gray-600" style={{ background: v.value }} />
                          )}
                          <span className="text-xs text-gray-300">{v.label}</span>
                          {v.priceModifier !== 0 && (
                            <span className="text-xs text-green-400">+${v.priceModifier}</span>
                          )}
                          <button
                            onClick={() => handleDeleteVariant(part._id, v._id)}
                            className="text-gray-600 hover:text-red-400 text-xs ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Variant Form */}
                {showAddVariant === part._id && (
                  <div className="border-t border-gray-800 pt-4 mt-3">
                    <form onSubmit={(e) => handleAddVariant(e, part._id)} className="space-y-3">
                      <p className="text-sm font-medium text-gray-300">Add Variant</p>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={variantForm.label}
                          onChange={(e) => setVariantForm({ ...variantForm, label: e.target.value })}
                          placeholder="Label e.g. Red, Oak"
                          required
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                        <select
                          value={variantForm.type}
                          onChange={(e) => setVariantForm({ ...variantForm, type: e.target.value })}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                        >
                          <option value="color">Color</option>
                          <option value="texture">Texture URL</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {variantForm.type === 'color' ? (
                          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                            <input
                              type="color"
                              value={variantForm.value}
                              onChange={(e) => setVariantForm({ ...variantForm, value: e.target.value })}
                              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                            />
                            <span className="text-sm text-gray-400">{variantForm.value}</span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={variantForm.value}
                            onChange={(e) => setVariantForm({ ...variantForm, value: e.target.value })}
                            placeholder="Texture URL"
                            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                          />
                        )}
                        <input
                          type="number"
                          value={variantForm.priceModifier}
                          onChange={(e) => setVariantForm({ ...variantForm, priceModifier: parseFloat(e.target.value) || 0 })}
                          placeholder="Price modifier e.g. 50"
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
                          Add Variant
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddVariant(null)}
                          className="border border-gray-700 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Part Modal */}
      {showAddPart && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Add Part</h3>
              <button onClick={() => setShowAddPart(false)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>

            <form onSubmit={handleAddPart} className="space-y-4">

              <div>
                <label className="block text-sm text-gray-400 mb-2">Part Name</label>
                <input
                  type="text"
                  value={partForm.name}
                  onChange={(e) => setPartForm({ ...partForm, name: e.target.value })}
                  placeholder="e.g. Wheels, Bumper, Roof Rack"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description <span className="text-gray-600">(optional)</span></label>
                <input
                  type="text"
                  value={partForm.description}
                  onChange={(e) => setPartForm({ ...partForm, description: e.target.value })}
                  placeholder="Short description"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Category</label>
                <select
                  value={partForm.category}
                  onChange={(e) => setPartForm({ ...partForm, category: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="general">General</option>
                  <option value="exterior">Exterior</option>
                  <option value="interior">Interior</option>
                  <option value="wheels">Wheels</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Part 3D Model</label>
                {partForm.modelUrl ? (
                  <div className="flex items-center gap-3 bg-green-900/30 border border-green-700 rounded-lg px-4 py-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-green-400 text-sm">Model uploaded</span>
                    <button type="button" onClick={() => setPartForm({ ...partForm, modelUrl: '' })} className="ml-auto text-gray-500 hover:text-white text-sm">Remove</button>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition ${uploading ? 'border-indigo-500' : 'border-gray-700 hover:border-indigo-500'}`}>
                      {uploading ? (
                        <div className="w-6 h-6 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                      ) : (
                        <>
                          <p className="text-2xl mb-2">🧩</p>
                          <p className="text-gray-400 text-sm">Upload part .glb file</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept=".glb,.gltf" onChange={handlePartModelUpload} className="hidden" disabled={uploading} />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Base Price ($)</label>
                <input
                  type="number"
                  value={partForm.basePrice}
                  onChange={(e) => setPartForm({ ...partForm, basePrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={partForm.isDefault}
                    onChange={(e) => setPartForm({ ...partForm, isDefault: e.target.checked })}
                    className="w-4 h-4 accent-indigo-500"
                  />
                  <span className="text-sm text-gray-400">Default selected</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={partForm.isRequired}
                    onChange={(e) => setPartForm({ ...partForm, isRequired: e.target.checked })}
                    className="w-4 h-4 accent-indigo-500"
                  />
                  <span className="text-sm text-gray-400">Required part</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-3 rounded-xl font-semibold"
                >
                  Add Part
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPart(false)}
                  className="px-6 border border-gray-700 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}