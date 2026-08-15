'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api, { API_BASE_URL } from '../../../../../../lib/api';

const inputClass =
  'w-full bg-elevated border border-rim rounded-lg px-4 py-3 text-snow placeholder:text-dim focus:outline-none focus:border-volt transition-colors text-sm';
const labelClass = 'block text-[11px] text-muted uppercase tracking-widest mb-2 font-medium';

const CATEGORIES = ['general', 'exterior', 'interior', 'wheels', 'accessories'];

/* ── Icons ───────────────────────────────────────────────────────────────── */
function IconCube() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
function IconCode() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function ConfiguratorBuilderPage() {
  const router = useRouter();
  const { id } = useParams();
  const previewRef = useRef(null);
  const viewerInjectedRef = useRef(false);

  const [product, setProduct] = useState(null);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerReady, setViewerReady] = useState(false);

  const [activeTab, setActiveTab] = useState('parts');

  const [showAddPart, setShowAddPart] = useState(false);
  const [showAddVariant, setShowAddVariant] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingTexture, setUploadingTexture] = useState(false);

  const [partForm, setPartForm] = useState({
    name: '', description: '', modelUrl: '', category: 'general',
    basePrice: 0, isDefault: false, isRequired: false,
  });
  const [variantForm, setVariantForm] = useState({
    label: '', type: 'color', value: '#ffffff', priceModifier: 0,
  });

  const [syncingPrice, setSyncingPrice] = useState(false);

  useEffect(() => { fetchProduct(); }, []);

  useEffect(() => {
    if (!product || !brand || !previewRef.current || viewerInjectedRef.current) return;

    viewerInjectedRef.current = true;

    const viewerBaseUrl = (process.env.NEXT_PUBLIC_VIEWER_URL || 'https://viewer.zingcalc.com').replace(/\/$/, '');
    const viewerScriptPath =
      viewerBaseUrl.includes('localhost') || viewerBaseUrl.includes('127.0.0.1')
        ? '/src/index.js'
        : '/embed.iife.js';

    window.VISIFY_API_URL = API_BASE_URL;
    window.VISIFY_API_KEY = brand.apiKey;
    window.VISIFY_SHOP_DOMAIN = brand.shopDomain || '';
    window.VISIFY_PRODUCT_ID = product.shopifyHandle || id;
    window.VISIFY_CONFIGURATOR_ID = id;

    const script = document.createElement('script');
    script.src = `${viewerBaseUrl}${viewerScriptPath}`;
    script.type = 'module';
    script.onload = () => setViewerReady(true);
    script.onerror = () => setViewerReady(false);
    document.body.appendChild(script);

    return () => {
      script.remove();
      viewerInjectedRef.current = false;
    };
  }, [product, brand, id]);

  const fetchProduct = async () => {
    try {
      const [productRes, brandRes] = await Promise.all([
        api.get(`/configurator/products/${id}`),
        api.get('/auth/me'),
      ]);
      setProduct(productRes.data.product);
      setBrand(brandRes.data.brand);
    } catch {
      toast.error('Failed to load configurator');
      router.push('/dashboard/configurator');
    } finally {
      setLoading(false);
    }
  };

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
      const res = await api.post('/upload/model', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPartForm((prev) => ({ ...prev, modelUrl: res.data.modelUrl }));
      toast.success('Part model uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleVariantTextureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingTexture(true);
    try {
      const formData = new FormData();
      formData.append('texture', file);
      const res = await api.post('/upload/texture', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setVariantForm((prev) => ({ ...prev, value: res.data.textureUrl }));
      toast.success('Texture uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingTexture(false);
    }
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!partForm.modelUrl) { toast.error('Please upload a 3D model for this part'); return; }
    try {
      await api.post(`/configurator/products/${id}/parts`, partForm);
      toast.success('Part added');
      setShowAddPart(false);
      setPartForm({ name: '', description: '', modelUrl: '', category: 'general', basePrice: 0, isDefault: false, isRequired: false });
      fetchProduct();
    } catch { toast.error('Failed to add part'); }
  };

  const handleDeletePart = async (partId) => {
    if (!confirm('Delete this part?')) return;
    try {
      await api.delete(`/configurator/products/${id}/parts/${partId}`);
      toast.success('Part deleted');
      fetchProduct();
    } catch { toast.error('Failed to delete part'); }
  };

  const handleAddVariant = async (e, partId) => {
    e.preventDefault();
    try {
      await api.post(`/configurator/products/${id}/parts/${partId}/variants`, variantForm);
      toast.success('Variant added');
      setShowAddVariant(null);
      setVariantForm({ label: '', type: 'color', value: '#ffffff', priceModifier: 0 });
      fetchProduct();
    } catch { toast.error('Failed to add variant'); }
  };

  const handleDeleteVariant = async (partId, variantId) => {
    try {
      await api.delete(`/configurator/products/${id}/parts/${partId}/variants/${variantId}`);
      toast.success('Variant deleted');
      fetchProduct();
    } catch { toast.error('Failed to delete variant'); }
  };

  const handleSyncPrice = async () => {
    setSyncingPrice(true);
    try {
      await api.post(`/configurator/products/${id}/sync-price`);
      toast.success('Price synced from Shopify');
      fetchProduct();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync price');
    } finally {
      setSyncingPrice(false);
    }
  };

  const handlePublishToggle = async () => {
    try {
      await api.put(`/configurator/products/${id}`, { isPublished: !product.isPublished });
      toast.success(product.isPublished ? 'Unpublished' : 'Published');
      fetchProduct();
    } catch { toast.error('Failed to update'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="vspin" />
      </div>
    );
  }

  const embedCode = `<div id="visify-configurator"></div>\n<script>\n  window.VISIFY_API_KEY = '${brand?.apiKey || '...'}' ;\n  window.VISIFY_PRODUCT_ID = '{{ product.handle }}';\n<\/script>\n<script type="module" src="${process.env.NEXT_PUBLIC_VIEWER_URL || 'https://viewer.zingcalc.com'}/src/index.js"><\/script>`;

  const tabs = ['parts', 'embed'];

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Left: 3D preview ────────────────────────────────────────────── */}
      <div className="flex-1 relative bg-void flex flex-col">

        {/* Preview top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-rim bg-void shrink-0">
          <button
            onClick={() => router.push('/dashboard/configurator')}
            className="text-muted hover:text-snow text-xs flex items-center gap-1.5 transition-colors"
          >
            ← Configurators
          </button>
          <span className="text-xs text-dim font-medium tracking-wide uppercase">Live Preview</span>
          <button
            onClick={() => window.open(`/view/${id}?key=${brand?.apiKey}`, '_blank')}
            className="text-xs text-volt hover:text-glow transition-colors flex items-center gap-1"
          >
            Open full ↗
          </button>
        </div>

        {/* 3D canvas area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {/* Ambient glow */}
          <div
            className="absolute w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(123,92,245,0.08) 0%, transparent 70%)' }}
          />

          {/* Viewer mount */}
          <div
            id="visify-configurator"
            ref={previewRef}
            className="w-full h-full"
            data-api-key={brand?.apiKey}
            data-product-id={id}
          />

          {/* Placeholder when no viewer loaded */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300 ${viewerReady ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-20 h-20 rounded-2xl bg-surface border border-rim flex items-center justify-center mb-5 opacity-40">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7B5CF5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" opacity="0.5"/><line x1="12" y1="22.08" x2="12" y2="12" opacity="0.5"/>
              </svg>
            </div>
            <p className="text-dim text-xs font-medium tracking-widest uppercase">3D Preview</p>
            <p className="text-[#1A1A2E] text-[11px] mt-1">{product.baseModelName}</p>
          </div>

          {/* Drag hint */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-2 bg-surface/70 border border-rim rounded-full text-[11px] text-dim backdrop-blur-sm">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Drag to rotate · Scroll to zoom
          </div>
        </div>

        {/* Bottom info strip */}
        <div className="border-t border-rim px-6 py-3 flex items-center justify-between bg-void shrink-0">
          <div>
            <span className="text-snow font-semibold text-sm">{product.name}</span>
            <span className="text-dim text-xs ml-2">${product.basePrice} base</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              product.isPublished ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'
            }`}>
              {product.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Right: management panel ──────────────────────────────────────── */}
      <aside className="w-[400px] shrink-0 flex flex-col bg-surface border-l border-rim overflow-hidden">

        {/* Panel header */}
        <div className="px-6 pt-5 pb-4 border-b border-rim shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-base font-bold text-snow leading-tight">{product.name}</h1>
              {product.description && (
                <p className="text-muted text-xs mt-0.5 leading-relaxed">{product.description}</p>
              )}
            </div>
            <button
              onClick={handlePublishToggle}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ml-3 ${
                product.isPublished
                  ? 'border border-rim hover:border-muted text-muted hover:text-snow'
                  : 'bg-ok hover:bg-ok/90 text-void'
              }`}
            >
              {product.isPublished ? 'Unpublish' : 'Publish'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-elevated rounded-lg p-1">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                  activeTab === t
                    ? 'bg-surface text-snow shadow-sm'
                    : 'text-muted hover:text-snow'
                }`}
              >
                {t === 'parts' ? `Parts (${product.parts.length})` : 'Embed'}
              </button>
            ))}
          </div>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Parts tab ── */}
          {activeTab === 'parts' && (
            <div className="p-5 space-y-3">

              {/* Add part button */}
              <button
                onClick={() => setShowAddPart(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-rim hover:border-volt/50 rounded-xl text-muted hover:text-glow text-sm font-medium transition-colors"
              >
                <IconPlus />
                Add Part
              </button>

              {/* Parts list */}
              {product.parts.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-dim text-xs">No parts yet. Add a part to start building.</p>
                </div>
              ) : (
                product.parts.map((part) => (
                  <PartCard
                    key={part._id}
                    part={part}
                    showAddVariant={showAddVariant}
                    setShowAddVariant={setShowAddVariant}
                    variantForm={variantForm}
                    setVariantForm={setVariantForm}
                    onDeletePart={handleDeletePart}
                    onAddVariant={handleAddVariant}
                    onDeleteVariant={handleDeleteVariant}
                    inputClass={inputClass}
                    labelClass={labelClass}
                    uploadingTexture={uploadingTexture}
                    onVariantTextureUpload={handleVariantTextureUpload}
                  />
                ))
              )}
            </div>
          )}

          {/* ── Embed tab ── */}
          {activeTab === 'embed' && (
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className={labelClass}>Base Price</p>
                  {product.shopifyHandle && (
                    <button
                      onClick={handleSyncPrice}
                      disabled={syncingPrice}
                      className="text-[11px] text-volt hover:text-glow disabled:opacity-40 transition-colors"
                    >
                      {syncingPrice ? 'Syncing...' : 'Re-sync from Shopify'}
                    </button>
                  )}
                </div>
                <div className="bg-elevated border border-rim rounded-lg px-4 py-3">
                  <span className="text-snow text-sm font-semibold">${(product.basePrice || 0).toFixed(2)}</span>
                  <p className="text-dim text-xs mt-1">
                    {product.shopifyHandle
                      ? 'Synced from this product’s real Shopify price — updates automatically when it changes in Shopify admin.'
                      : 'Set a Shopify Handle below to auto-sync this from the real product price.'}
                  </p>
                </div>
              </div>

              <div>
                <p className={labelClass}>Base Model</p>
                <div className="flex items-center gap-3 bg-elevated border border-rim rounded-lg px-4 py-3">
                  <div className="w-8 h-8 bg-volt/10 rounded-lg flex items-center justify-center shrink-0">
                    <IconCube />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-snow text-sm font-medium truncate">{product.baseModelName}</p>
                    <p className="text-dim text-xs truncate mt-0.5">{product.baseModelUrl}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className={labelClass}>Shopify Embed Code</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(embedCode); toast.success('Copied'); }}
                    className="flex items-center gap-1.5 bg-volt hover:bg-volt/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <IconCode />
                    Copy
                  </button>
                </div>
                <pre className="bg-elevated border border-rim rounded-xl p-4 text-[11px] text-muted font-mono overflow-x-auto whitespace-pre leading-relaxed">
                  {embedCode}
                </pre>
                {product.shopifyHandle ? (
                  <p className="text-dim text-xs mt-2">
                    Handle: <span className="text-glow">{product.shopifyHandle}</span>
                  </p>
                ) : (
                  <p className="text-warn text-xs mt-2">No Shopify handle set yet</p>
                )}
              </div>

              <div className="bg-elevated border border-rim rounded-xl p-4">
                <p className={labelClass}>API Key</p>
                <code className="text-glow text-xs font-mono break-all">{brand?.apiKey}</code>
              </div>

              <div className="bg-elevated border border-rim rounded-xl p-4">
                <p className={labelClass}>Customer Preview URL</p>
                <code className="text-volt text-xs font-mono break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/view/{id}?key={brand?.apiKey}
                </code>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Add Part Modal ─────────────────────────────────────────────────── */}
      {showAddPart && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-rim rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-rim">
              <h3 className="text-sm font-semibold text-snow">Add Part</h3>
              <button onClick={() => setShowAddPart(false)} className="text-muted hover:text-snow text-xl leading-none transition-colors">×</button>
            </div>

            <form onSubmit={handleAddPart} className="p-5 space-y-4">
              <div>
                <label className={labelClass}>Part Name</label>
                <input type="text" value={partForm.name} onChange={(e) => setPartForm({ ...partForm, name: e.target.value })}
                  placeholder="e.g. Wheels, Bumper, Roof Rack" required className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Description <span className="text-dim normal-case tracking-normal">— optional</span></label>
                <input type="text" value={partForm.description} onChange={(e) => setPartForm({ ...partForm, description: e.target.value })}
                  placeholder="Short description" className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Category</label>
                  <select value={partForm.category} onChange={(e) => setPartForm({ ...partForm, category: e.target.value })}
                    className={`${inputClass} cursor-pointer`}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Base Price ($)</label>
                  <input type="number" value={partForm.basePrice}
                    onChange={(e) => setPartForm({ ...partForm, basePrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0" min="0" className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Part 3D Model</label>
                {partForm.modelUrl ? (
                  <div className="flex items-center gap-3 bg-ok/5 border border-ok/20 rounded-lg px-4 py-3">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="text-ok text-sm flex-1">Model uploaded</span>
                    <button type="button" onClick={() => setPartForm({ ...partForm, modelUrl: '' })} className="text-muted hover:text-snow text-xs transition-colors">Remove</button>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      uploading ? 'border-volt bg-volt/5' : 'border-rim hover:border-volt/40'
                    }`}>
                      {uploading ? (
                        <div className="vspin mx-auto" />
                      ) : (
                        <>
                          <div className="w-9 h-9 bg-elevated rounded-xl flex items-center justify-center mx-auto mb-3">
                            <IconCube />
                          </div>
                          <p className="text-snow text-sm font-medium mb-0.5">Upload .glb or .gltf</p>
                          <p className="text-dim text-xs">Click to browse files</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept=".glb,.gltf" onChange={handlePartModelUpload} className="hidden" disabled={uploading} />
                  </label>
                )}
              </div>

              <div className="flex gap-5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={partForm.isDefault}
                    onChange={(e) => setPartForm({ ...partForm, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded accent-volt" />
                  <span className="text-sm text-muted">Default selected</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={partForm.isRequired}
                    onChange={(e) => setPartForm({ ...partForm, isRequired: e.target.checked })}
                    className="w-4 h-4 rounded accent-volt" />
                  <span className="text-sm text-muted">Required</span>
                </label>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={uploading}
                  className="flex-1 bg-volt hover:bg-volt/90 disabled:opacity-40 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
                  Add Part
                </button>
                <button type="button" onClick={() => setShowAddPart(false)}
                  className="px-5 border border-rim hover:border-muted text-muted hover:text-snow rounded-xl text-sm transition-colors">
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

/* ── Part Card ────────────────────────────────────────────────────────────── */
function PartCard({ part, showAddVariant, setShowAddVariant, variantForm, setVariantForm,
  onDeletePart, onAddVariant, onDeleteVariant, inputClass, labelClass,
  uploadingTexture, onVariantTextureUpload }) {
  return (
    <div className="bg-elevated border border-rim rounded-xl overflow-hidden">

      {/* Part header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="font-semibold text-snow text-sm">{part.name}</h3>
            {part.isDefault && (
              <span className="text-[10px] bg-volt/10 text-volt px-1.5 py-0.5 rounded font-medium">Default</span>
            )}
            {part.isRequired && (
              <span className="text-[10px] bg-bad/10 text-bad px-1.5 py-0.5 rounded font-medium">Required</span>
            )}
          </div>
          <div className="flex gap-2.5 text-[11px] text-dim">
            <span className="capitalize">{part.category}</span>
            {part.basePrice > 0 && <><span>·</span><span>+${part.basePrice}</span></>}
            <span>·</span>
            <span>{part.variants.length} variants</span>
          </div>
        </div>
        <button onClick={() => onDeletePart(part._id)}
          className="text-dim hover:text-bad p-1.5 rounded-lg hover:bg-bad/10 transition-colors ml-2 shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </button>
      </div>

      {/* Variants */}
      <div className="border-t border-rim/60 px-4 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] text-dim uppercase tracking-widest font-medium">Variants</span>
          <button onClick={() => setShowAddVariant(part._id)}
            className="text-[11px] text-volt hover:text-glow transition-colors flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add
          </button>
        </div>

        {part.variants.length === 0 ? (
          <p className="text-dim text-[11px]">No variants yet</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {part.variants.map((v) => (
              <div key={v._id}
                className="flex items-center gap-1.5 bg-surface border border-rim rounded-md px-2 py-1">
                {v.type === 'color' ? (
                  <div className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: v.value, border: '1px solid rgba(255,255,255,0.12)' }} />
                ) : (
                  <div className="w-3 h-3 rounded-full shrink-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${v.value})`, border: '1px solid rgba(255,255,255,0.12)' }} />
                )}
                <span className="text-[11px] text-muted">{v.label}</span>
                {v.priceModifier !== 0 && (
                  <span className="text-[10px] text-ok">+${v.priceModifier}</span>
                )}
                <button onClick={() => onDeleteVariant(part._id, v._id)}
                  className="text-dim hover:text-bad text-xs ml-0.5 transition-colors leading-none">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Inline add variant form */}
        {showAddVariant === part._id && (
          <form onSubmit={(e) => onAddVariant(e, part._id)} className="mt-4 pt-4 border-t border-rim space-y-3">
            <p className={labelClass}>New Variant</p>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={variantForm.label}
                onChange={(e) => setVariantForm({ ...variantForm, label: e.target.value })}
                placeholder="Label e.g. Red, Oak" required className={inputClass} />
              <select value={variantForm.type}
                onChange={(e) => setVariantForm({
                  ...variantForm,
                  type: e.target.value,
                  value: e.target.value === 'color' ? '#ffffff' : '',
                })}
                className={`${inputClass} cursor-pointer`}>
                <option value="color">Color</option>
                <option value="texture">Texture Image</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {variantForm.type === 'color' ? (
                <div className="flex items-center gap-2.5 bg-elevated border border-rim rounded-lg px-3 py-2.5">
                  <input type="color" value={variantForm.value}
                    onChange={(e) => setVariantForm({ ...variantForm, value: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
                  <span className="text-xs text-muted font-mono">{variantForm.value}</span>
                </div>
              ) : variantForm.value ? (
                <div className="flex items-center gap-2 bg-elevated border border-rim rounded-lg px-3 py-2">
                  <div className="w-6 h-6 rounded shrink-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${variantForm.value})` }} />
                  <span className="text-xs text-muted flex-1 truncate">Image uploaded</span>
                  <button type="button" onClick={() => setVariantForm({ ...variantForm, value: '' })}
                    className="text-dim hover:text-bad text-xs shrink-0 transition-colors">Remove</button>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className={`border border-dashed rounded-lg px-3 py-2.5 text-center transition-colors ${
                    uploadingTexture ? 'border-volt bg-volt/5' : 'border-rim hover:border-volt/40'
                  }`}>
                    {uploadingTexture ? (
                      <div className="vspin mx-auto" style={{ width: 14, height: 14 }} />
                    ) : (
                      <span className="text-dim text-xs">Upload texture image</span>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={onVariantTextureUpload}
                    className="hidden" disabled={uploadingTexture} />
                </label>
              )}
              <input type="number" value={variantForm.priceModifier}
                onChange={(e) => setVariantForm({ ...variantForm, priceModifier: parseFloat(e.target.value) || 0 })}
                placeholder="+$0" className={inputClass} />
            </div>
            <div className="flex gap-2">
              <button type="submit"
                className="bg-volt hover:bg-volt/90 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors">
                Add
              </button>
              <button type="button" onClick={() => setShowAddVariant(null)}
                className="border border-rim hover:border-muted text-muted hover:text-snow px-4 py-2 rounded-lg text-xs transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
