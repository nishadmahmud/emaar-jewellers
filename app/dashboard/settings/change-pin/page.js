"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import axios from "axios";

export default function ChangePinPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;
  const currentPinFromSession = Number(session?.user?.pin) || 0;

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const sanitize = (v) => v.replace(/\D/g, "").slice(0, 6);

  const validateInputs = () => {
    const curr = Number(currentPin);
    const newP = Number(newPin);
    const conf = Number(confirmPin);

    // If a current PIN exists on the session, it's required
    if (currentPinFromSession > 0 && !currentPin) {
      toast.error("Please enter your current PIN");
      return false;
    }

    if (!newPin || !confirmPin) {
      toast.error("Please fill all PIN fields");
      return false;
    }

    if (currentPinFromSession > 0 && curr !== currentPinFromSession) {
      toast.error("Current PIN does not match");
      return false;
    }

    if (!/^[0-9]{6}$/.test(newPin)) {
      toast.error("New PIN must be exactly 6 digits");
      return false;
    }

    if (newP !== conf) {
      toast.error("New PIN and confirmation do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setLoading(true);
    toast.info("Updating PIN…");

    try {
      const res = await axios.post(`${API_URL}/set-pin`, { pin: Number(newPin) }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res?.data?.success || res.status === 200) {
        toast.success(
          res.data?.message ||
            "Congratulations! Your PIN has been saved successfully!"
        );
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
      } else {
        toast.error(res?.data?.message || "Failed to update PIN");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Something went wrong while setting PIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-4 sm:mx-0 shadow-lg border-neutral-200">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 text-neutral-700">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Change PIN
          </CardTitle>
          <p className="text-sm text-gray-500">
            Secure your account with a hidden 6‑digit PIN
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {currentPinFromSession > 0 && (
              <div className="space-y-1">
                <Label htmlFor="currentPin" className="text-gray-700 font-medium">
                  Current PIN
                </Label>
                <Input
                  id="currentPin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="Enter current PIN"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(sanitize(e.target.value))}
                  className="text-center tracking-widest text-lg h-12"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="newPin" className="text-gray-700 font-medium">
                New PIN
              </Label>
              <Input
                id="newPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter new 6‑digit PIN"
                value={newPin}
                onChange={(e) => setNewPin(sanitize(e.target.value))}
                className="text-center tracking-widest text-lg h-12"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPin" className="text-gray-700 font-medium">
                Confirm New PIN
              </Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Confirm new PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(sanitize(e.target.value))}
                className="text-center tracking-widest text-lg h-12"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-center">
            <Button
              type="submit"
              className="bg-black hover:bg-neutral-800 text-white w-full font-medium h-12 text-md"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Updating…
                </>
              ) : (
                "Update PIN"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
