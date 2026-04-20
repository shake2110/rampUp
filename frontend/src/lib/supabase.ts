import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export const createClient = () => {
  // We explicitly pass the URL and Key to satisfy the library's requirement at build time.
  // In production, these will be populated by Vercel environment variables.
  // During build, placeholders allow the static generation to complete without crashing.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

  try {
    return createClientComponentClient({
      supabaseUrl,
      supabaseKey,
    });
  } catch (e) {
    console.warn("Supabase client initialized with placeholders during build.");
    return createClientComponentClient({
      supabaseUrl,
      supabaseKey,
    });
  }
};
