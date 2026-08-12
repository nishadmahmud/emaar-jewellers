'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error);
        setLoading(false);
      } else {
        toast.success("Login successful");
        router.push(`/verify-pin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
    } catch (error) {
      toast.error("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-light tracking-widest mb-2 text-black">EMAAR</h1>
          <p className="text-sm tracking-widest text-neutral-500 uppercase">Jewellers</p>
        </div>

        <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-medium mb-6 text-center text-black">Sign In</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-black placeholder-neutral-400 outline-none"
                  placeholder="admin@emaarjewellers.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-black placeholder-neutral-400 outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-neutral-800 transition-colors mt-6 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? "Signing in..." : "Continue"}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-neutral-600">
            Don't have an account?{' '}
            <a href="/signup" className="text-black font-medium hover:underline">
              Sign up
            </a>
          </div>
        </div>
        
        <p className="text-center text-neutral-500 text-xs mt-8">
          &copy; {new Date().getFullYear()} Emaar Jewellers. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neutral-400" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
