'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../../../lib/api'; // Axios instance jisme withCredentials: true hai
import { logoutUser } from '../../../../lib/auth';
export default function DashboardPage() {
    const router = useRouter();
    const [brand, setBrand] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Data fetch karne ka function
    const fetchData = async () => {
        try {
            const [brandRes, productsRes] = await Promise.all([
                api.get('/auth/me'),
                api.get('/products'),
            ]);
            setBrand(brandRes.data.brand);
            setProducts(productsRes.data.products);
        } catch (err) {
            // Agar cookie invalid ya expire ho chuki ho
            toast.error('Session expired — please login again');
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
    }, []);

    // Loading State UI
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">

            {/* Navbar */}
            <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold">
                    VI<span className="text-indigo-500">SI</span>FY
                </h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">{brand?.email}</span>
                    <button
                        onClick={() => logoutUser(router)}
                        className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-lg transition"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto p-6">

                {/* Welcome */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold">Welcome, {brand?.name} 👋</h2>
                    <p className="text-gray-400 mt-1">Manage your 3D product configurators</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <p className="text-gray-400 text-sm mb-1">Total Products</p>
                        <p className="text-3xl font-bold">{products.length}</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <p className="text-gray-400 text-sm mb-1">Current Plan</p>
                        <p className="text-3xl font-bold capitalize">{brand?.plan}</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <p className="text-gray-400 text-sm mb-1">Status</p>
                        <p className={`text-3xl font-bold capitalize ${brand?.subscriptionStatus === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                            {brand?.subscriptionStatus || 'active'}
                        </p>
                    </div>
                </div>
                {/* Analytics Link */}
                <div
                    className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition"
                    onClick={() => router.push('/dashboard/analytics')}
                >
                    <div>
                        <p className="font-semibold">View Analytics</p>
                        <p className="text-gray-400 text-sm mt-1">Track views, colors, interactions</p>
                    </div>
                    <span className="text-indigo-400 text-xl">→</span>
                </div>
                {/* API Key */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
                    <p className="text-gray-400 text-sm mb-2">Your API Key</p>
                    <div className="flex items-center gap-3">
                        <code className="bg-gray-800 px-4 py-2 rounded-lg text-indigo-400 text-sm flex-1 overflow-x-auto">
                            {brand?.apiKey}
                        </code>
                        <button
                            onClick={() => {
                                if (brand?.apiKey) {
                                    navigator.clipboard.writeText(brand.apiKey);
                                    toast.success('API Key copied!');
                                }
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                            Copy
                        </button>
                    </div>
                </div>

                {/* Products */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Your Products</h3>
                    <button
                        onClick={() => router.push('/dashboard/products/new')}
                        className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        + Add Product
                    </button>
                </div>

                {products.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-12 text-center">
                        <p className="text-4xl mb-4">📦</p>
                        <p className="text-gray-400 mb-4">No products yet — add your first 3D product</p>
                        <button
                            onClick={() => router.push('/dashboard/products/new')}
                            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-medium transition"
                        >
                            Add First Product
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((product) => (
                            <div
                                key={product._id}
                                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-500 transition cursor-pointer"
                                onClick={() => router.push(`/dashboard/products/${product._id}`)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-semibold">{product.name}</h4>
                                    <span className={`text-xs px-2 py-1 rounded-full ${product.isActive ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                                        {product.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex gap-2 mb-3">
                                    {product.variants?.map((v) => (
                                        <div
                                            key={v._id}
                                            className="w-5 h-5 rounded-full border border-gray-700"
                                            style={{ background: v.color }}
                                            title={v.label}
                                        />
                                    ))}
                                </div>
                                <p className="text-gray-500 text-xs">
                                    {product.variants?.length || 0} variants • {product.materials?.length || 0} materials
                                </p>
                            </div>
                        ))}
                    </div>
                )}

            </div>

        </div>
    );
}