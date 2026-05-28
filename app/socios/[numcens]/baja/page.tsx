"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabase";

export default function BajaSocioPage() {
  const params = useParams();
  const router = useRouter();
  const numcens = params.numcens as string;

  const [guardando, setGuardando] = useState(false);
  const [fechaBaja, setFechaBaja] = useState(
    new Date().toISOString().slice(0, 10)
  );

  async function confirmarBaja() {
    const confirmar = confirm("¿Seguro que quieres dar de baja este socio?");
    if (!confirmar) return;
  
    setGuardando(true);
  
    const fecha = fechaBaja || new Date().toISOString().slice(0, 10);
    const fechaObj = new Date(fecha);
  
    const ejercicioActual =
      fechaObj.getMonth() >= 3
        ? fechaObj.getFullYear() + 1
        : fechaObj.getFullYear();
  
    const { error } = await (supabase as any)
      .from("SOCIOS")
      .update({
        Estado: "Baja",
      })
      .eq("NUMCENS", Number(numcens));
  
    if (error) {
      alert(error.message);
      setGuardando(false);
      return;
    }
  
    const { data: historialActualizado, error: errorHistorial } = await (
      supabase as any
    )
      .from("HISTORIAL_SOCIOS")
      .update({
        Fecha_Alta_Baja: fecha,
        Estado: "Baja",
      })
      .eq("NUMCENS", Number(numcens))
      .eq("Ejercicio", ejercicioActual)
      .select();
  
    if (errorHistorial) {
      alert(errorHistorial.message);
      setGuardando(false);
      return;
    }
  
    if (!historialActualizado || historialActualizado.length === 0) {
      const { error: errorInsertHistorial } = await (supabase as any)
        .from("HISTORIAL_SOCIOS")
        .insert({
          NUMCENS: Number(numcens),
          Ejercicio: ejercicioActual,
          Fecha_Alta_Baja: fecha,
          Estado: "Baja",
        });
  
      if (errorInsertHistorial) {
        alert(errorInsertHistorial.message);
        setGuardando(false);
        return;
      }
    }
  
    setGuardando(false);
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
            <div className="border-l-4 border-red-900 px-6 py-5">
              <h1 className="text-2xl font-bold text-zinc-900">
                Dar de baja socio
              </h1>

              <p className="mt-2 text-sm text-zinc-600">NUMCENS {numcens}</p>
            </div>

            <div className="p-6 text-sm text-zinc-700">
              Esta acción cambiará el estado del socio a <strong>Baja</strong>.
            </div>

            <div className="border-t border-zinc-200 p-6">
              <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
                Fecha de baja
              </label>

              <input
                type="date"
                value={fechaBaja}
                onChange={(e) => setFechaBaja(e.target.value)}
                className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
              />

              <p className="mt-2 text-xs text-zinc-500">
                Por defecto se usa la fecha de hoy, pero puedes cambiarla si la baja corresponde a otro día.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-200 p-4">
              <Link
                href={`/socios/${numcens}`}
                className="border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancelar
              </Link>

              <button
                onClick={confirmarBaja}
                disabled={guardando}
                className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Confirmar baja"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}