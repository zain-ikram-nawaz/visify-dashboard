'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../../../lib/api';

const inputClass =
  'w-full bg-elevated border border-rim rounded-lg px-4 py-3 text-snow placeholder:text-dim focus:outline-none focus:border-volt transition-colors text-sm';
const labelClass = 'block text-[11px] text-muted uppercase tracking-widest mb-2 font-medium';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      toast.success('Account created');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
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
          <p className="text-muted text-sm">Create your free account</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-rim rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className={labelClass}>Brand Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your Store Name"
                required
                autoComplete="organization"
                className={inputClass}
              />
            </div>

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
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-volt hover:bg-volt/90 disabled:opacity-40 text-white py-3 rounded-lg font-semibold text-sm transition-colors mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-muted text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-glow hover:text-volt transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
