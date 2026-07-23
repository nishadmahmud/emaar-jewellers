'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { toast } from 'sonner';

export default function VerifyPinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [pin, setPin] = useState(['', '', '', '', '', '']); // Changed to 6 digits as per Commeriva API
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [loading, setLoading] = useState(false);
  const { data: session, update: updateSession } = useSession();

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Allow only numbers
    if (value && !/^\d+$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullPin = pin.join('');
    if (fullPin.length !== 6) return;

    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/verify-pin`,
        { pin: fullPin },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = res.data;

      if (data.status === 200) {
        toast.success(data?.message || "PIN verified successfully");
        await updateSession({ pinVerified: true });
        
        setTimeout(() => {
          router.push(callbackUrl);
        }, 300);
      } else {
        toast.error(data?.message || "PIN verification failed");
        setLoading(false);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "An error occurred while verifying PIN"
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 mb-6">
            <KeyRound size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-medium mb-2">Verify Access</h2>
          <p className="text-neutral-400 text-sm">Enter your 6-digit security PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <div className="flex gap-3 mb-10">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="password"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl bg-neutral-900 border border-neutral-800 rounded-xl focus:ring-1 focus:ring-white focus:border-white transition-colors text-white outline-none"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={pin.join('').length !== 6 || loading}
            className="w-full max-w-[280px] bg-white text-black font-medium py-3 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
