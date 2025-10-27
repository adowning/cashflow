import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Context, MiddlewareHandler } from "hono";
import { env } from "hono/adapter";
import { setCookie } from "hono/cookie";
declare module "hono" {
  interface ContextVariableMap {
    supabase: SupabaseClient;
  }
}
export const getSupabase = (c: Context) => {
  return c.get("supabase");
};
const SUPABASE_URL = "https://crqbazcsrncvbnapuxcp.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycWJhemNzcm5jdmJuYXB1eGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDk1MDYsImV4cCI6MjA3Njg4NTUwNn0.AQdRVvPqeK8l8NtTwhZhXKnjPIIcv_4dRU-bSZkVPs8";
type SupabaseEnv = {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
};
export const getAllCookies = (c: Context) => {
  return parseCookieHeader(c.req.header("Cookie") ?? "");
};

export const setAllCookies = (
  c: Context,
  cookiesToSet: Array<{ name: string; value: string; options?: any }>
) => {
  cookiesToSet.forEach(({ name, value, options }) =>
    setCookie(c, name, value, options)
  );
};

export const supabaseMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const supabaseEnv = env<SupabaseEnv>(c);
    const supabaseUrl = supabaseEnv.SUPABASE_URL;
    const supabaseAnonKey = supabaseEnv.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase URL or Anon Key missing in environment variables!"
      );
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return parseCookieHeader(c.req.header("Cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            setCookie(c, name, value, options)
          );
        },
        // You might also need a deleteAll function for complete cookie management
      },
    });

    c.set("supabase", supabase); // Make the Supabase client available in the Hono context
    await next();
  };
};
