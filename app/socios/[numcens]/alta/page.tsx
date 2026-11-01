
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";

function fechaLocalHoy() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

export default function AltaSocioPage() {
  const params = useParams();
  const router = useRouter();
  const numcens = params.numcens as string;
  const numeroSocio = Number(numcens);

  const [guardando, setGuardando] = useState(false);
  const [fechaAlta, setFechaAlta] = useState(fechaLocalHoy());

  async function confirmarAlta() {
    if (guardando) return;

    if (
      !Number.isSafeInteger(numeroSocio) ||
      numeroSocio <= 0
    ) {
      alert("El número de socio no es válido.");
      return;
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fechaAlta) ||
      Number.isNaN(
        new Date(`${fechaAlta}T12:00:00`).getTime()
      )
    ) {
      alert("Selecciona una fecha de alta válida.");
      return;
    }

    setGuardando(true);

    try {
      // 1. Consultar el socio antes de modificarlo.
      const { data: socio, error: errorSocio } =
        await (supabase as any)
          .from("SOCIOS")
          .select(
            "NUMCENS, Estado, FechaPrimerAlta"
          )
          .eq("NUMCENS", numeroSocio)
          .maybeSingle();

      if (errorSocio) throw errorSocio;

      if (!socio) {
        alert("No se ha encontrado este socio.");
        return;
      }

      if (socio.Estado === "Activo") {
        alert("Este socio ya está activo.");
        return;
      }

      // 2. Calcular el ejercicio histórico
      // manteniendo el criterio existente.
      const [anio, mes] = fechaAlta
        .split("-")
        .map(Number);

      const ejercicioHistorial =
        mes >= 4 ? anio + 1 : anio;

      const confirmar = window.confirm(
        "¿Seguro que quieres dar de alta este socio?\n\n" +
        "Se conservarán sus datos anteriores, " +
        "incluidos su fecha de primera alta, " +
        "pagador, cuotas y pagos registrados."
      );

      if (!confirmar) return;

      // 3. Reactivar al socio.
      // Solo establecer FechaPrimerAlta si
      // todavía no tiene ninguna.
      const cambios: Record<string, any> = {
        Estado: "Activo",
      };

      if (!socio.FechaPrimerAlta) {
        cambios.FechaPrimerAlta = fechaAlta;
      }

      const { data: actualizado, error: errorAlta } =
        await (supabase as any)
          .from("SOCIOS")
          .update(cambios)
          .eq("NUMCENS", numeroSocio)
          .neq("Estado", "Activo")
          .select("NUMCENS")
          .maybeSingle();

      if (errorAlta) throw errorAlta;

      if (!actualizado) {
        alert(
          "No se ha podido confirmar el alta. " +
          "Comprueba si el estado del socio ha cambiado."
        );
        return;
      }

      // 4. Registrar el alta en el historial.
      // Conservamos por ahora el sistema
      // de historial que utiliza la aplicación.
      const { error: errorHistorial } =
        await (supabase as any)
          .from("HISTORIAL_SOCIOS")
          .upsert(
            {
              NUMCENS: numeroSocio,
              Ejercicio: ejercicioHistorial,
              Fecha_Alta_Baja: fechaAlta,
              Estado: "Alta",
            },
            {
              onConflict: "NUMCENS,Ejercicio",
            }
          );

      if (errorHistorial) {
        alert(
          "El socio se ha reactivado, pero " +
          "no se ha podido actualizar su historial.\n\n" +
          errorHistorial.message +
          "\n\nNo repitas el alta. " +
          "Revisa el historial de este socio."
        );

        router.push(`/socios/${numcens}`);
        router.refresh();
        return;
      }

      // No regeneramos todas las cuotas.
      // Conservamos importes, plazos,
      // pagos anteriores y remesas.
      router.push(`/socios/${numcens}`);
      router.refresh();

    } catch (error: any) {
      alert(
        "Error al dar de alta al socio: " +
        (error?.message || "Error desconocido")
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
            <div className="border-l-4 border-green-700 px-6 py-5">
              <h1 className="text-2xl font-bold text-zinc-900">
                Dar de alta socio
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                NUMCENS {numcens}
              </p>
            </div>

            <div className="p-6 text-sm text-zinc-700">
              Esta acción cambiará el estado del
              socio a <strong>Activo</strong>.

              <p className="mt-3 text-sm text-zinc-500">
                Se conservará su fecha original de
                primera alta y no se modificarán los
                pagos ni las remesas anteriores.
              </p>
            </div>

            <div className="border-t border-zinc-200 p-6">
              <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
                Fecha de alta
              </label>

              <input
                type="date"
                value={fechaAlta}
                onChange={(e) =>
                  setFechaAlta(e.target.value)
                }
                disabled={guardando}
                className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-700"
              />

              <p className="mt-2 text-xs text-zinc-500">
                Por defecto se utiliza la fecha de hoy.
                Puedes cambiarla si el reingreso
                corresponde a otra fecha.
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
                onClick={confirmarAlta}
                disabled={guardando}
                className="bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
              >
                {guardando
                  ? "Guardando..."
                  : "Confirmar alta"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
