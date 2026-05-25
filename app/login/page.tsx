"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Usuario o contraseña incorrectos");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100">
      <form onSubmit={login} className="w-full max-w-sm border bg-white p-6">
        <h1 className="mb-6 text-2xl font-bold">Acceso gestión socios</h1>

        {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="mb-3 w-full border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="mb-4 w-full border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-red-900 px-4 py-2 text-white">
          Entrar
        </button>
      </form>
    </main>
  );
}