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
    fetchData();
  }, []);

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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      router.push('/dashboard');
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const embedCode = `<!-- Visify 3D Configurator -->
<div id="visify-configurator"></div>
<script
  src="http://localhost:5173/src/index.js"
  data-api-key="${brand?.apiKey}"
  data-product-id="${id}"
  type="module">
</script>`;

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

      <div className="max-w-2xl mx-auto p-6">

        {/* Product Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">{product?.name}</h2>
            <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block
              ${product?.isActive ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
              {product?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <button
            onClick={handleDelete}
            className="text-sm text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 px-4 py-2 rounded-lg transition"
          >
            Delete
          </button>
        </div>

        {/* Variants */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <p className="text-gray-400 text-sm mb-4">Color Variants</p>
          <div className="flex gap-3 flex-wrap">
            {product?.variants.map((v) => (
              <div key={v._id} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full border-2 border-gray-700"
                  style={{ background: v.color }}
                />
                <span className="text-sm text-gray-300">{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Materials */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <p className="text-gray-400 text-sm mb-4">Materials</p>
          <div className="flex gap-2 flex-wrap">
            {product?.materials.map((m, i) => (
              <span
                key={i}
                className="bg-gray-800 text-gray-300 text-sm px-3 py-1 rounded-full"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Embed Code */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">Embed Code</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(embedCode);
                toast.success('Embed code copied!');
              }}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Copy Code
            </button>
          </div>
          <pre className="bg-gray-800 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
            {embedCode}
          </pre>
          <p className="text-gray-600 text-xs mt-3">
            Paste this code in your product page HTML where you want the 3D configurator to appear.
          </p>
        </div>

        {/* Model URL */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">3D Model URL</p>
          <code className="text-indigo-400 text-xs break-all">
            {product?.modelUrl}
          </code>
        </div>

      </div>
    </div>
  );
}