'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import api from '../../../../lib/api';

const inputClass =
  'w-full bg-elevated border border-rim rounded-lg px-4 py-3 text-snow placeholder:text-dim focus:outline-none focus:border-volt transition-colors text-sm';
const labelClass = 'block text-[11px] text-muted uppercase tracking-widest mb-2 font-medium';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const { token } = res.data;
      Cookies.set('token', token, { expires: 7, path: '/', sameSite: 'Strict' });
      localStorage.setItem('token', token);
      toast.success('Welcome back');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-void flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-snow tracking-tight mb-2">
            VI<span className="text-volt">SI</span>FY
          </div>
          <p className="text-muted text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-rim rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="brand@example.com"
                required
                autoComplete="email"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-volt hover:bg-volt/90 disabled:opacity-40 text-white py-3 rounded-lg font-semibold text-sm transition-colors mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-muted text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-glow hover:text-volt transition-colors">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
