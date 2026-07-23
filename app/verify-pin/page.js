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
      // MOCKED API CALL FOR PRESENTATION
      // Just immediately succeed and route to dashboard
      toast.success("PIN verified successfully");
      await updateSession({ pinVerified: true });
      
      setTimeout(() => {
        router.push(callbackUrl);
      }, 300);
    } catch (error) {
      toast.error("An error occurred while verifying PIN");
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
          <h2 className="text-2xl font-medium mb-2 text-black">Security PIN</h2>
          <p className="text-neutral-500 text-sm">
            Please enter your 6-digit access PIN to continue to the dashboard.
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
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
