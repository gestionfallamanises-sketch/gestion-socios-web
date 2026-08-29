"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { normalizarTexto } from "@/lib/texto";

function euros(valor: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(valor || 0));
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return "—";

  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

export default function ImprimirNinoPage() {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [ejercicioActivo, setEjercicioActivo] = useState<number | null>(null);
  const [configuracion, setConfiguracion] = useState<any>(null);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [socios, setSocios] = useState<any[]>([]);
  const [pagosNino, setPagosNino] = useState<any[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);

    const { data: ejercicioData, error: errorEjercicio } =
      await (supabase as any)
        .from("EJERCICIOS")
        .select("Ejercicio")
        .eq("Activo", true)
        .maybeSingle();

    if (errorEjercicio) {
      alert(errorEjercicio.message);
      setCargando(false);
      return;
    }

    const ejercicioActual = Number(ejercicioData?.Ejercicio || 0);

    if (!ejercicioActual) {
      alert("No se ha encontrado un ejercicio activo.");
      setCargando(false);
      return;
    }

    setEjercicioActivo(ejercicioActual);

    const [
      { data: configuracionData, error: errorConfiguracion },
      { data: entregasData, error: errorEntregas },
      { data: sociosData, error: errorSocios },
      { data: pagosData, error: errorPagos },
    ] = await Promise.all([
      (supabase as any)
        .from("LOTERIA_NINO_CONFIGURACION")
        .select("*")
        .eq("Ejercicio", ejercicioActual)
        .eq("Sorteo", "Niño")
        .maybeSingle(),

      (supabase as any)
        .from("LOTERIA_SORTEO_NINO")
        .select("*")
        .eq("Ejercicio", ejercicioActual)
        .eq("Sorteo", "Niño")
        .order("FechaEntrega", { ascending: true }),

      (supabase as any)
        .from("SOCIOS")
        .select("NUMCENS, Nombre, Apellidos"),

      (supabase as any)
  .from("LOTERIA_NINO_PAGOS")
  .select("*")
  .order("FechaPago", { ascending: true }),
    ]);

    if (errorConfiguracion) {
      alert(errorConfiguracion.message);
      setCargando(false);
      return;
    }

    if (errorEntregas) {
      alert(errorEntregas.message);
      setCargando(false);
      return;
    }

    if (errorSocios) {
      alert(errorSocios.message);
      setCargando(false);
      return;
    }

    if (errorPagos) {
      alert(errorPagos.message);
      setCargando(false);
      return;
    }

    setConfiguracion(configuracionData || null);
    setEntregas(entregasData || []);
    setSocios(sociosData || []);
    setCargando(false);
    setPagosNino(pagosData || []);
  }

  function nombreEntrega(fila: any) {
    if (fila.NombreExterno) {
      return fila.NombreExterno;
    }

    const socio = socios.find(
      (s: any) => Number(s.NUMCENS) === Number(fila.NUMCENS)
    );

    if (!socio) {
      return fila.NUMCENS ? `NUMCENS ${fila.NUMCENS}` : "—";
    }

    return `${socio.Apellidos || ""}, ${socio.Nombre || ""}`;
  }

  function totalPagadoEntrega(idEntrega: number) {
    return pagosNino
      .filter(
        (pago: any) =>
          Number(pago.IDEntrega) === Number(idEntrega)
      )
      .reduce(
        (total: number, pago: any) =>
          total + Number(pago.Importe || 0),
        0
      );
  }

  const filas = entregas.map((fila: any) => {
    const papeletas = Number(fila.Papeletas || 0);
    const devueltas = Number(fila.Devueltas || 0);
    const vendidas = Math.max(0, papeletas - devueltas);

    const importeTotal =
      vendidas * Number(configuracion?.ImportePapeleta || 0);

    const importePagado = totalPagadoEntrega(fila.ID);

    const pendiente = Math.max(
      0,
      importeTotal - importePagado
    );

    return {
      ...fila,
      nombre: nombreEntrega(fila),
      papeletas,
      devueltas,
      vendidas,
      importeTotal,
      importePagado,
      pendiente,
    };
  });

  const filasOrdenadas = [...filas].sort((a, b) =>
    normalizarTexto(a.nombre).localeCompare(
      normalizarTexto(b.nombre),
      "es"
    )
  );

  const resumen = {
    entregas: filas.length,
    papeletas: filas.reduce(
      (s, f) => s + f.papeletas,
      0
    ),
    devueltas: filas.reduce(
      (s, f) => s + f.devueltas,
      0
    ),
    vendidas: filas.reduce(
      (s, f) => s + f.vendidas,
      0
    ),
    total: filas.reduce(
      (s, f) => s + f.importeTotal,
      0
    ),
    pagado: filas.reduce(
      (s, f) => s + f.importePagado,
      0
    ),
    pendiente: filas.reduce(
      (s, f) => s + f.pendiente,
      0
    ),
  };

  const totales = filas.reduce(
    (acc, fila) => {
      acc.papeletas += fila.papeletas;
      acc.devueltas += fila.devueltas;
      acc.vendidas += fila.vendidas;
      acc.importeTotal += fila.importeTotal;
      acc.importePagado += fila.importePagado;
      acc.pendiente += fila.pendiente;
      return acc;
    },
    {
      papeletas: 0,
      devueltas: 0,
      vendidas: 0,
      importeTotal: 0,
      importePagado: 0,
      pendiente: 0,
    }
  );

  if (cargando) {
    return (
      <main className="p-8 text-sm text-zinc-500">
        Preparando impresión...
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={() => router.push("/loterias/nino")}
          className="rounded bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300"
        >
          ← Volver
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900"
        >
          🖨️ Imprimir
        </button>
      </div>

      <section className="mx-auto max-w-7xl bg-white">
        <div className="mb-6 border-b-2 border-zinc-900 pb-4">
          <h1 className="text-2xl font-bold text-zinc-900">
            Lotería del Niño
          </h1>

          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <p>
              <span className="font-semibold">Ejercicio:</span>{" "}
              {ejercicioActivo ?? "—"}
            </p>

            <p>
              <span className="font-semibold">Fecha sorteo:</span>{" "}
              {formatearFecha(configuracion?.FechaSorteo || null)}
            </p>

            <p>
              <span className="font-semibold">Número:</span>{" "}
              {configuracion?.Numero || "—"}
            </p>

            <p>
              <span className="font-semibold">Nº décimos:</span>{" "}
              {Number(configuracion?.Decimos || 0)}
            </p>

            <p>
              <span className="font-semibold">Precio décimo:</span>{" "}
              {euros(configuracion?.PrecioDecimo || 0)}
            </p>

            <p>
              <span className="font-semibold">Importe papeleta:</span>{" "}
              {euros(configuracion?.ImportePapeleta || 0)}
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4 text-sm">

<div>
  <div className="text-zinc-500">Entregas</div>
  <div className="font-semibold">{resumen.entregas}</div>
</div>

<div>
  <div className="text-zinc-500">Vendidas</div>
  <div className="font-semibold">{resumen.vendidas}</div>
</div>

<div>
  <div className="text-zinc-500">Cobrado</div>
  <div className="font-semibold">
    {euros(resumen.pagado)}
  </div>
</div>

<div>
  <div className="text-zinc-500">Pendiente</div>
  <div className="font-semibold text-red-700">
    {euros(resumen.pendiente)}
  </div>
</div>

</div>

        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-100">
              <th className="border border-zinc-300 px-2 py-2 text-left">
                Socio
              </th>
              <th className="border border-zinc-300 px-2 py-2 text-center">
                Fecha
              </th>
              <th className="border border-zinc-300 px-2 py-2 text-center">
                Serie
              </th>
              <th className="border border-zinc-300 px-2 py-2 text-right">
                Entregadas
              </th>
              <th className="border border-zinc-300 px-2 py-2 text-right">
                Devueltas
              </th>
              <th className="border border-zinc-300 px-2 py-2 text-right">
                Vendidas
              </th>
              <th className="border border-zinc-300 px-2 py-2 text-right">
                Total
              </th>
              <th className="border border-zinc-300 px-2 py-2 text-right">
                Pagado
              </th>
              <th className="border border-zinc-300 px-2 py-2 text-right">
                Pendiente
              </th>
            </tr>
          </thead>

          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="border border-zinc-300 px-3 py-8 text-center text-zinc-500"
                >
                  No hay entregas registradas.
                </td>
              </tr>
            ) : (
              filasOrdenadas.map((fila: any) => (
                <tr key={fila.ID}>
                  <td className="border border-zinc-300 px-2 py-2">
                    {fila.nombre}
                  </td>

                  <td className="border border-zinc-300 px-2 py-2 text-center">
                    {formatearFecha(fila.FechaEntrega)}
                  </td>

                  <td className="border border-zinc-300 px-2 py-2 text-center">
                    {fila.Serie || "—"}
                  </td>

                  <td className="border border-zinc-300 px-2 py-2 text-right">
                    {fila.papeletas}
                  </td>

                  <td className="border border-zinc-300 px-2 py-2 text-right">
                    {fila.devueltas}
                  </td>

                  <td className="border border-zinc-300 px-2 py-2 text-right">
                    {fila.vendidas}
                  </td>

                  <td className="border border-zinc-300 px-2 py-2 text-right">
                    {euros(fila.importeTotal)}
                  </td>

                  <td className="border border-zinc-300 px-2 py-2 text-right">
                    {euros(fila.importePagado)}
                  </td>

                  <td className="border border-zinc-300 px-2 py-2 text-right">
                    {euros(fila.pendiente)}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          <tfoot>
            <tr className="bg-zinc-100 font-bold">
              <td
                colSpan={3}
                className="border border-zinc-300 px-2 py-2 text-right"
              >
                Totales
              </td>

              <td className="border border-zinc-300 px-2 py-2 text-right">
                {totales.papeletas}
              </td>

              <td className="border border-zinc-300 px-2 py-2 text-right">
                {totales.devueltas}
              </td>

              <td className="border border-zinc-300 px-2 py-2 text-right">
                {totales.vendidas}
              </td>

              <td className="border border-zinc-300 px-2 py-2 text-right">
                {euros(totales.importeTotal)}
              </td>

              <td className="border border-zinc-300 px-2 py-2 text-right">
                {euros(totales.importePagado)}
              </td>

              <td className="border border-zinc-300 px-2 py-2 text-right">
                {euros(totales.pendiente)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>
    </main>
  );
}