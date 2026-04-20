import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const createServerClient = async () => {
  const cookieStore = await cookies();
  return createRouteHandlerClient({
    cookies: () =>
      ({
        get: (name: string) => cookieStore.get(name),
        set: (name: string, value: string, options: any) => cookieStore.set(name, value, options),
        remove: (name: string, options: any) =>
          cookieStore.set(name, "", { ...options, maxAge: 0 }),
      }) as any,
  });
};
