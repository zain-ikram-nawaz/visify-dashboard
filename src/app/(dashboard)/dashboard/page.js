'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../../../lib/api';

function CubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B5CF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandRes, productsRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/products'),
        ]);
        setBrand(brandRes.data.brand);
        setProducts(productsRes.data.products);
      } catch (err) {
        toast.error('Session expired — please log in again');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="vspin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-snow tracking-tight">Overview</h1>
          <p className="text-muted text-sm mt-1">Welcome back, {brand?.name}</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/products/new')}
          className="bg-volt hover:bg-volt/90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          + Add Product
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-rim rounded-xl p-5">
          <p className="text-[11px] text-muted uppercase tracking-widest mb-3 font-medium">Total Products</p>
          <p className="text-4xl font-bold text-snow tabular-nums">{products.length}</p>
        </div>
        <div className="bg-surface border border-rim rounded-xl p-5">
          <p className="text-[11px] text-muted uppercase tracking-widest mb-3 font-medium">Current Plan</p>
          <p className="text-4xl font-bold text-snow capitalize">{brand?.plan || '—'}</p>
        </div>
        <div className="bg-surface border border-rim rounded-xl p-5">
          <p className="text-[11px] text-muted uppercase tracking-widest mb-3 font-medium">Status</p>
          <div className="flex items-center gap-2.5 mt-1">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${brand?.subscriptionStatus === 'active' ? 'bg-ok' : 'bg-bad'}`} />
            <p className={`text-2xl font-bold capitalize ${brand?.subscriptionStatus === 'active' ? 'text-ok' : 'text-bad'}`}>
              {brand?.subscriptionStatus || 'active'}
            </p>
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="bg-surface border border-rim rounded-xl p-5 mb-8">
        <p className="text-[11px] text-muted uppercase tracking-widest mb-3 font-medium">API Key</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 bg-elevated px-4 py-2.5 rounded-lg text-glow text-[13px] font-mono overflow-x-auto">
            {brand?.apiKey}
          </code>
          <button
            onClick={() => {
              if (brand?.apiKey) {
                navigator.clipboard.writeText(brand.apiKey);
                toast.success('Copied to clipboard');
              }
            }}
            className="shrink-0 bg-volt hover:bg-volt/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Products section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-snow">
          Products
          <span className="text-muted font-normal ml-2 text-sm">{products.length}</span>
        </h2>
      </div>

      {products.length === 0 ? (
        <div className="bg-surface border border-rim border-dashed rounded-xl p-12 text-center">
          <div className="w-10 h-10 bg-volt/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CubeIcon />
          </div>
          <p className="text-snow font-semibold mb-1">No products yet</p>
          <p className="text-muted text-sm mb-5">Upload your first 3D model to get started</p>
          <button
            onClick={() => router.push('/dashboard/products/new')}
            className="bg-volt hover:bg-volt/90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Add first product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-surface border border-rim rounded-xl p-5 glow-card cursor-pointer"
              onClick={() => router.push(`/dashboard/products/${product._id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-snow text-[14px] leading-snug">{product.name}</h3>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 ${
                  product.isActive ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-bad'
                }`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {product.variants?.length > 0 && (
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {product.variants.slice(0, 10).map((v) => (
                    <div
                      key={v._id}
                      className="w-4 h-4 rounded-full border border-rim shrink-0"
                      style={{ background: v.color }}
                      title={v.label}
                    />
                  ))}
                </div>
              )}

              <p className="text-dim text-xs">
                {product.variants?.length || 0} variants · {product.materials?.length || 0} materials
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
