"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      if (response.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to sign in");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-zinc-400 outline-none transition focus:border-red-500 focus:bg-white/15";

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-bold text-zinc-200" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={fieldClass} placeholder="admin@example.com" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-zinc-200" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            required
            minLength={8}
            autoComplete="current-password"
            className={`${fieldClass} pr-12`}
            placeholder="Your password"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute inset-y-0 right-0 px-4 text-zinc-300 hover:text-white"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="border border-red-900 bg-red-950/60 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
      <button
        disabled={loading}
        className="flex w-full items-center justify-between bg-red-600 px-5 py-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          <LockKeyhole size={17} />
          {loading ? "Signing in…" : "Secure sign in"}
        </span>
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
