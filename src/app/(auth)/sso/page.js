'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import api from '../../../../lib/api';

export default function SsoPage() {
  return (
    <Suspense fallback={<SsoScreen message="Signing you in…" />}>
      <SsoExchange />
    </Suspense>
  );
}

function SsoExchange() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ssoToken = searchParams.get('token');
  const [error, setError] = useState(null);
  const calledRef = useRef(false); // Prevents duplicate calls

  useEffect(() => {
    if (!ssoToken || calledRef.current) return;
    calledRef.current = true; // Mark as called immediately

    api
      .post('/auth/sso/consume', { ssoToken })
      .then((res) => {
        const { token } = res.data;
        Cookies.set('token', token, { expires: 7, path: '/', sameSite: 'Strict' });
        localStorage.setItem('token', token);
        router.push('/dashboard');
        router.refresh();
      })
      .catch((err) => {
        const message = err.response?.data?.message || 'Login link expired — go back to Shopify admin and try again.';
        setError(message);
        toast.error(message);
      });
  }, [ssoToken, router]);

  const displayError = error || (!ssoToken ? 'Missing login link. Go back to Shopify admin and try again.' : null);

  return <SsoScreen message={displayError || 'Signing you in…'} />;
}

function SsoScreen({ message }) {
  return (
    <main className="min-h-screen bg-void flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-2xl font-bold text-snow tracking-tight mb-4">
          VI<span className="text-volt">SI</span>FY
        </div>
        <p className="text-muted text-sm">{message}</p>
      </div>
    </main>
  );
}