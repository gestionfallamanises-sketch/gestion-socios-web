"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";

export default function EditarFamiliaPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [familia, setFamilia] = useState<any>(null);
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargarFamilia() {
      const { data } = await supabase
        .from("FAMILIAS")
        .select("*")
        .eq("ID_Familia", Number(id))
        .single();

      if (data) {
        setFamilia(data);
        setNombre(data.Nombre_Familia || "");
      }
    }

    cargarFamilia();
  }, [id]);

  async function guardarCambios(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setGuardando(true);

    await supabase
      .from("FAMILIAS")
      .update({
        Nombre_Familia: nombre,
      })
      .eq("ID_Familia", Number(id))

      await supabase.rpc("generar_actualizar_cuotas_completo", {
        p_ejercicio: 2027,
      });
      
    router.push(`/familias/${id}`);
  }

  if (!familia) {
    return (
      <div className="p-10">
        Cargando familia...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href={`/familias/${id}`}
            className="mb-6 inline-block text-sm font-medium text-red-900 hover:text-red-950"
          >
            ← Volver a familia
          </Link>

          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <h1 className="text-2xl font-bold text-zinc-900">
                Editar familia
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                ID familia {id}
              </p>
            </div>
          </section>

          <form
            onSubmit={guardarCambios}
            className="border border-zinc-200 bg-white"
          >
            <div className="bg-zinc-100 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Datos familia
              </h2>
            </div>

            <div className="p-4">
              <label className="mb-2 block text-xs font-medium uppercase text-zinc-500">
                Nombre familia
              </label>

              <input
                value={nombre}
                onChange={(e) =>
                  setNombre(e.target.value)
                }
                className="w-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-900"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-200 p-4">
              <Link
                href={`/familias/${id}`}
                className="border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={guardando}
                className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}