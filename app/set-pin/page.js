'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { toast } from 'sonner';

function SetPinContent() {
  const router = useRouter();
  const [pin, setPin] = useState(['', '', '', '', '', '']); // 6 digits
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
        'https://www.outletexpense.xyz/api/set-pin',
        { pin: fullPin },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = res.data;

      if (data.success || data.status === 200) {
        toast.success(data?.message || "PIN set successfully");
        await updateSession({ pinVerified: true });
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 300);
      } else {
        toast.error(data?.message || "Failed to set PIN");
        setLoading(false);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "An error occurred while setting PIN"
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border border-neutral-200 shadow-sm mb-4">
            <KeyRound size={28} className="text-black" />
          </div>
          <h2 className="text-2xl font-medium mb-2 text-black">Set Security PIN</h2>
          <p className="text-neutral-500 text-sm">
            Please set a 6-digit access PIN for your new account to secure it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-xl flex flex-col items-center">
          <div className="flex gap-2 mb-8 justify-center w-full">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-medium bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-black outline-none"
                required
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || pin.join('').length !== 6}
            className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {loading ? "Setting PIN..." : "Set PIN & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SetPinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neutral-400" /></div>}>
      <SetPinContent />
    </Suspense>
  );
}
