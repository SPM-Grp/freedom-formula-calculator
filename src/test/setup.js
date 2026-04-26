import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// Mock Supabase env vars so supabase.js doesn't log warnings during tests.
import.meta.env.VITE_SUPABASE_URL = "https://test.supabase.co";
import.meta.env.VITE_SUPABASE_ANON_KEY = "test-anon-key";
