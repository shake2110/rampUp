"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";
import { nanoid } from "nanoid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // 2. Create a default organization for the user
        const orgId = nanoid();
        const { error: orgError } = await supabase.from("organization").insert({
          id: orgId,
          name: `${name}'s Organization`,
          plan: "free",
          allowed_responses_count: 10,
        });

        if (orgError) {
          throw orgError;
        }

        // 3. Create user record
        const { error: userError } = await supabase.from("user").insert({
          id: authData.user.id,
          email,
          organization_id: orgId,
        });

        if (userError) {
          throw userError;
        }

        toast.success("Account created successfully!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="bg-indigo-50 border-b-2 border-black">
          <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-bold uppercase tracking-wider">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-2 border-black focus-visible:ring-indigo-500 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
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
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm font-medium mt-4">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-indigo-600 underline font-bold">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
