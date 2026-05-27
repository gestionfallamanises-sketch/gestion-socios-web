"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";

export default function AltaSocioPage() {
  const params = useParams();
  const router = useRouter();
  const numcens = params.numcens as string;
  const [guardando, setGuardando] = useState(false);

  async function confirmarAlta() {
    const confirmar = confirm("¿Seguro que quieres dar de alta este socio?");
    if (!confirmar) return;

    setGuardando(true);

    const { error } = await (supabase as any)
      .from("SOCIOS")
      .update({
        Estado: "Activo",
      })
      .eq("NUMCENS", Number(numcens));

    setGuardando(false);

    if (error) {
      alert(error.message);
      return;
    }

    await (supabase as any).rpc("generar_actualizar_cuotas_completo", {
      p_ejercicio: 2027,
    });

    router.push(`/socios/${numcens}`);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/socios/${numcens}`}
            className="mb-6 inline-block text-sm font-medium text-red-900 hover:text-red-950"
          >
            ← Volver a ficha socio
          </Link>

          <section className="border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-green-700 px-6 py-5">
              <h1 className="text-2xl font-bold text-zinc-900">
                Dar de alta socio
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                NUMCENS {numcens}
              </p>
            </div>

            <div className="p-6 text-sm text-zinc-700">
              Esta acción cambiará el estado del socio a <strong>Activo</strong>.
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-200 p-4">
              <Link
                href={`/socios/${numcens}`}
                className="border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancelar
              </Link>

              <button
                onClick={confirmarAlta}
                disabled={guardando}
                className="bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Confirmar alta"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}