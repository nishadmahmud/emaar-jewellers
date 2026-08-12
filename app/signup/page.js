'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Phone, User, Store, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    outletName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!formData.outletName || !formData.ownerName) {
      toast.error('Please fill in all fields');
      return;
    }
    nextStep();
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.phone) {
      toast.error('Please fill in all fields');
      return;
    }
    nextStep();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill in password fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!formData.agreeTerms) {
      toast.error('You must agree to the Terms of Service');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        outletName: formData.outletName,
        ownerName: formData.ownerName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
      };

      const res = await fetch('https://www.outletexpense.xyz/api/user-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || 'Account created successfully!');
        router.push('/login');
      } else {
        toast.error(data.message || 'Failed to create account');
        setLoading(false);
      }
    } catch (error) {
      toast.error('Something went wrong');
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
          {step > 1 && (
            <button
              onClick={prevStep}
              className="text-neutral-500 hover:text-black mb-6 flex items-center text-sm transition-colors"
            >
              <ArrowLeft size={16} className="mr-1" /> Back
            </button>
          )}

          <h2 className="text-2xl font-medium mb-2 text-center text-black">
            {step === 1 && 'Create Account'}
            {step === 2 && 'Contact Information'}
            {step === 3 && 'Secure Your Account'}
          </h2>
          <p className="text-center text-neutral-500 text-sm mb-6">
            {step === 1 && 'Provide your store details to get started.'}
            {step === 2 && 'We will use this to contact you.'}
            {step === 3 && 'Set up a password for your new account.'}
          </p>

          <div className="flex justify-center mb-8 space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  step === i ? 'w-8 bg-black' : step > i ? 'w-4 bg-black/40' : 'w-4 bg-neutral-200'
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1.5" htmlFor="outletName">
                  Outlet Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Store size={18} />
                  </div>
                  <input
                    id="outletName"
                    name="outletName"
                    type="text"
                    value={formData.outletName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-black placeholder-neutral-400 outline-none"
                    placeholder="Emaar Main Branch"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1.5" htmlFor="ownerName">
                  Owner Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <User size={18} />
                  </div>
                  <input
                    id="ownerName"
                    name="ownerName"
                    type="text"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-black placeholder-neutral-400 outline-none"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-neutral-800 transition-colors mt-6 flex items-center justify-center"
              >
                Next
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNextStep2} className="space-y-5">
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
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-black placeholder-neutral-400 outline-none"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1.5" htmlFor="phone">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Phone size={18} />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-black placeholder-neutral-400 outline-none"
                    placeholder="01xxxxxxxxx"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-neutral-800 transition-colors mt-6 flex items-center justify-center"
              >
                Next
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-black placeholder-neutral-400 outline-none"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-black transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1.5" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock size={18} />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-black placeholder-neutral-400 outline-none"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-black transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-start mt-4">
                <div className="flex items-center h-5">
                  <input
                    id="agreeTerms"
                    name="agreeTerms"
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="w-4 h-4 border border-neutral-300 rounded bg-white checked:bg-black checked:border-black focus:ring-black focus:ring-2"
                  />
                </div>
                <label htmlFor="agreeTerms" className="ml-2 text-sm text-neutral-600">
                  By signing up, you agree to the Terms of Service and Privacy Policy
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-neutral-800 transition-colors mt-6 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </form>
          )}
          
          <div className="mt-6 text-center text-sm text-neutral-600">
            Already have an account?{' '}
            <a href="/login" className="text-black font-medium hover:underline">
              Sign in
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
