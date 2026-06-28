'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../../../../../lib/api';

export default function ProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, brandRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/auth/me'),
        ]);
        setProduct(productRes.data.product);
        setBrand(brandRes.data.brand);
      } catch (err) {
        toast.error('Product not found');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      router.push('/dashboard');
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="vspin" />
      </div>
    );
  }

  const embedCode = `<!-- Visify 3D Configurator -->
<div id="visify-configurator"></div>
<script
  src="https://viewer.visify.io/src/index.js"
  data-api-key="${brand?.apiKey}"
  data-product-id="${id}"
  type="module">
</script>`;

  return (
    <div className="p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-muted hover:text-snow text-sm mb-4 flex items-center gap-1.5 transition-colors"
        >
          ← Overview
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-snow tracking-tight">{product?.name}</h1>
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium mt-2 ${
              product?.isActive ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-bad'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${product?.isActive ? 'bg-ok' : 'bg-bad'}`} />
              {product?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <button
            onClick={handleDelete}
            className="text-sm text-muted hover:text-bad border border-rim hover:border-bad/40 px-4 py-2 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-4">

        {/* Color Variants */}
        <div className="bg-surface border border-rim rounded-xl p-5">
          <p className="text-[11px] text-muted uppercase tracking-widest mb-4 font-medium">Color Variants</p>
          <div className="flex gap-3 flex-wrap">
            {product?.variants.map((v) => (
              <div key={v._id} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full shrink-0"
                  style={{ background: v.color, border: '2px solid rgba(255,255,255,0.1)' }}
                />
                <span className="text-sm text-muted">{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Materials */}
        {product?.materials?.length > 0 && (
          <div className="bg-surface border border-rim rounded-xl p-5">
            <p className="text-[11px] text-muted uppercase tracking-widest mb-4 font-medium">Materials</p>
            <div className="flex gap-2 flex-wrap">
              {product.materials.map((m, i) => (
                <span
                  key={i}
                  className="bg-elevated border border-rim text-muted text-sm px-3 py-1 rounded-full capitalize"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Embed Code */}
        <div className="bg-surface border border-rim rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] text-muted uppercase tracking-widest font-medium">Embed Code</p>
            <button
              onClick={() => { navigator.clipboard.writeText(embedCode); toast.success('Embed code copied'); }}
              className="bg-volt hover:bg-volt/90 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              Copy Code
            </button>
          </div>
          <pre className="bg-elevated rounded-lg p-4 text-xs text-muted font-mono overflow-x-auto whitespace-pre">
            {embedCode}
          </pre>
          <p className="text-dim text-xs mt-3">
            Paste this into your Shopify product page theme where you want the 3D configurator to appear.
          </p>
        </div>

        {/* Model URL */}
        <div className="bg-surface border border-rim rounded-xl p-5">
          <p className="text-[11px] text-muted uppercase tracking-widest mb-3 font-medium">3D Model URL</p>
          <code className="text-glow text-xs break-all font-mono">{product?.modelUrl}</code>
        </div>
      </div>
    </div>
  );
}
