"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";

export default function NuevaFamiliaPage() {
  const [nombreFamilia, setNombreFamilia] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function crearFamilia(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    const { data, error } = await (supabase as any)
      .from("FAMILIAS")
      .insert({
        Nombre_Familia: nombreFamilia,
        Observaciones: observaciones || null,
      })
      .select()
      .single();

    setGuardando(false);

    if (error) {
      setError(error.message);
      return;
    }

    window.location.href = `/familias/${(data as any).ID_Familia}`;
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/familias"
            className="mb-6 inline-block text-sm font-medium text-red-900 hover:text-red-950"
          >
            ← Volver a familias
          </Link>

          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <h1 className="text-2xl font-bold text-zinc-900">
                Crear nueva familia
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                Primero crea la familia. Después podrás añadir miembros desde su ficha.
              </p>
            </div>
          </section>

          {error && (
            <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Error: {error}
            </div>
          )}

          <form onSubmit={crearFamilia} className="border border-zinc-200 bg-white">
            <div className="bg-zinc-100 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Datos familia
              </h2>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
                  Nombre familia
                </label>

                <input
                  required
                  value={nombreFamilia}
                  onChange={(e) => setNombreFamilia(e.target.value)}
                  className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
                  Observaciones
                </label>

                <input
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-200 p-4">
              <Link
                href="/familias"
                className="border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={guardando}
                className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
              >
                {guardando ? "Creando..." : "Crear familia"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}