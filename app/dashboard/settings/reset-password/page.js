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
import { Loader2, KeyRound } from "lucide-react";
import axios from "axios";

export default function ResetPasswordPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const API_URL = process.env.NEXT_PUBLIC_API;
  const userEmail = session?.user?.email || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill both password fields");
      return false;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Optional: Could add a confirmation dialog here if requested, 
    // but a direct submission matches standard settings flows better 
    // unless strictly required.
    
    setLoading(true);
    toast.info("Updating password…");

    try {
      const payload = {
        email: userEmail,
        password: newPassword,
      };
      
      const res = await axios.post(`${API_URL}/reset-password`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res?.data?.success || res.status === 200) {
        toast.success(
          res.data?.message ||
            "Congratulations! Your password has been updated successfully!"
        );
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res?.data?.message || "Failed to reset password");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Something went wrong while resetting your password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-4 sm:mx-0 shadow-lg border-neutral-200">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 text-neutral-700">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Reset Password
          </CardTitle>
          <p className="text-sm text-gray-500">
            Update your password securely for {userEmail}
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-1">
              <Label htmlFor="newPassword" className="text-gray-700 font-medium">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password (min 8 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Retype new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12"
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
                "Update Password"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
