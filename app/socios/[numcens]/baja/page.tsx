
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";

export default function BajaSocioPage() {
  const params = useParams();
  const router = useRouter();

  const numcens = params.numcens as string;
  const numeroSocio = Number(numcens);

  const [guardando, setGuardando] = useState(false);
  const [fechaBaja, setFechaBaja] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  async function confirmarBaja() {
    if (guardando) return;

    if (!Number.isSafeInteger(numeroSocio) || numeroSocio <= 0) {
      alert("El número de socio no es válido.");
      return;
    }

    if (!fechaBaja) {
      alert("Selecciona una fecha de baja.");
      return;
    }

    setGuardando(true);

    try {
      // Comprobar que el socio existe.
      const { data: socio, error: errorSocio } =
        await (supabase as any)
          .from("SOCIOS")
          .select("NUMCENS, Estado")
          .eq("NUMCENS", numeroSocio)
          .maybeSingle();

      if (errorSocio) throw errorSocio;

      if (!socio) {
        alert("No se ha encontrado este socio.");
        return;
      }

      if (socio.Estado === "Baja") {
        alert("Este socio ya está dado de baja.");
        return;
      }

      // Comprobar si es titular de alguna familia.
      const { data: familias, error: errorFamilias } =
        await (supabase as any)
          .from("FAMILIAS")
          .select("ID_Familia")
          .eq("Titular_NUMCENS", numeroSocio)
          .limit(1);

      if (errorFamilias) throw errorFamilias;

      if (familias && familias.length > 0) {
        alert(
          "No se puede dar de baja a este socio porque " +
          "es el titular de una familia.\n\n" +
          "Primero debes entrar en Familias y " +
          "designar a otro titular activo."
        );
        return;
      }

      const confirmar = window.confirm(
        "¿Seguro que quieres dar de baja este socio?"
      );

      if (!confirmar) return;

      // Mantener el criterio actual para
      // calcular el ejercicio histórico.
      const [anio, mes] = fechaBaja
        .split("-")
        .map(Number);

      const ejercicioActual =
        mes >= 4 ? anio + 1 : anio;

      // Cambiar únicamente el estado.
      // El trigger de Supabase volverá a comprobar
      // que el socio no sea titular.
      const { data: actualizado, error: errorBaja } =
        await (supabase as any)
          .from("SOCIOS")
          .update({
            Estado: "Baja",
          })
          .eq("NUMCENS", numeroSocio)
          .neq("Estado", "Baja")
          .select("NUMCENS")
          .maybeSingle();

      if (errorBaja) throw errorBaja;

      if (!actualizado) {
        alert(
          "No se ha podido completar la baja. " +
          "Actualiza la ficha y comprueba el estado."
        );
        return;
      }

      // Registrar el movimiento en el historial.
      const { error: errorHistorial } =
        await (supabase as any)
          .from("HISTORIAL_SOCIOS")
          .upsert(
            {
              NUMCENS: numeroSocio,
              Ejercicio: ejercicioActual,
              Fecha_Alta_Baja: fechaBaja,
              Estado: "Baja",
            },
            {
              onConflict: "NUMCENS,Ejercicio",
            }
          );

      if (errorHistorial) {
        alert(
          "El socio se ha dado de baja, pero " +
          "no se ha podido registrar el historial.\n\n" +
          errorHistorial.message +
          "\n\nNo repitas la baja. Revisa el historial."
        );
        router.push(`/socios/${numcens}`);
        router.refresh();
        return;
      }

      router.push(`/socios/${numcens}`);
      router.refresh();

    } catch (error: any) {
      alert(
        error?.message ||
        "No se ha podido completar la baja."
      );
    } finally {
      setGuardando(false);
    }
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

              <p className="mt-2 text-sm text-zinc-600">
                NUMCENS {numcens}
              </p>
            </div>

            <div className="p-6 text-sm text-zinc-700">
              Esta acción cambiará el estado del socio a{" "}
              <strong>Baja</strong>.

              <p className="mt-3 text-sm text-amber-800">
                Si este socio es titular de una familia,
                primero deberás asignar otro titular.
              </p>
            </div>

            <div className="border-t border-zinc-200 p-6">
              <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
                Fecha de baja
              </label>

              <input
                type="date"
                value={fechaBaja}
                onChange={(e) => setFechaBaja(e.target.value)}
                disabled={guardando}
                className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
              />

              <p className="mt-2 text-xs text-zinc-500">
                Por defecto se usa la fecha de hoy, pero
                puedes cambiarla si la baja corresponde
                a otro día.
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
                type="button"
                onClick={confirmarBaja}
                disabled={guardando}
                className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
              >
                {guardando
                  ? "Guardando..."
                  : "Confirmar baja"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
