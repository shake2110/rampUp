"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
    setLoading(false);
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Magic link sent to your email!");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="bg-indigo-50 border-b-2 border-black">
          <CardTitle className="text-2xl font-bold text-center">
            Sign In to Ramp<span className="text-indigo-600">UP</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-bold uppercase tracking-wider">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-2 border-black focus-visible:ring-indigo-500 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-bold uppercase tracking-wider">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-2 border-black focus-visible:ring-indigo-500 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
            >
              {loading ? "Processing..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-black" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-black font-bold">Or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleMagicLink}
            disabled={loading}
            className="w-full border-2 border-black font-bold py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            Send Magic Link
          </Button>

          <p className="text-center text-sm font-medium mt-4">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-indigo-600 underline font-bold">
              Sign Up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
