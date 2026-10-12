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

export default function ImprimirNavidadPage() {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [ejercicioActivo, setEjercicioActivo] = useState<number | null>(null);
  const [configuracion, setConfiguracion] = useState<any>(null);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [movimientosEntregas, setMovimientosEntregas] = useState<any[]>([]);
  const [socios, setSocios] = useState<any[]>([]);
  const [pagosNavidad, setPagosNavidad] = useState<any[]>([]);

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
      { data: movimientosData, error: errorMovimientos },
      { data: sociosData, error: errorSocios },
      { data: pagosData, error: errorPagos },
    ] = await Promise.all([
      (supabase as any)
        .from("LOTERIA_NAVIDAD_CONFIGURACION")
        .select("*")
        .eq("Ejercicio", ejercicioActual)
        .eq("Sorteo", "Navidad")
        .maybeSingle(),

      (supabase as any)
        .from("LOTERIA_SORTEO_NAVIDAD")
        .select("*")
        .eq("Ejercicio", ejercicioActual)
        .eq("Sorteo", "Navidad")
        .order("FechaEntrega", { ascending: true }),

        (supabase as any)
  .from("LOTERIA_NAVIDAD_ENTREGAS_MOVIMIENTOS")
  .select("*")
  .eq("Ejercicio", ejercicioActual)
  .order("FechaEntrega", { ascending: true }),

      (supabase as any)
        .from("SOCIOS")
        .select("NUMCENS, Nombre, Apellidos"),

      (supabase as any)
  .from("LOTERIA_NAVIDAD_PAGOS")
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

    if (errorMovimientos) {
      alert(errorMovimientos.message);
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
    setMovimientosEntregas(movimientosData || []);
    setSocios(sociosData || []);
    setCargando(false);
    setPagosNavidad(pagosData || []);
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
    return pagosNavidad
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

  const filasBase = movimientosEntregas.map((movimiento: any) => {
    const principal =
      entregas.find(
        (fila: any) =>
          Number(fila.ID) === Number(movimiento.IDEntrega)
      ) || null;
  
    const papeletasFalla = Number(movimiento.PapeletasFalla || 0);
    const devueltasFalla = Number(movimiento.DevueltasFalla || 0);
    const vendidasFalla = Math.max(
      0,
      papeletasFalla - devueltasFalla
    );
  
    const papeletasVirgen = Number(movimiento.PapeletasVirgen || 0);
    const devueltasVirgen = Number(movimiento.DevueltasVirgen || 0);
    const vendidasVirgen = Math.max(
      0,
      papeletasVirgen - devueltasVirgen
    );
  
    const papeletas = papeletasFalla + papeletasVirgen;
    const devueltas = devueltasFalla + devueltasVirgen;
    const vendidas = vendidasFalla + vendidasVirgen;
  
    const importeTotal =
      vendidasFalla *
        Number(configuracion?.ImportePapeletaFalla || 0) +
      vendidasVirgen *
        Number(configuracion?.ImportePapeletaVirgen || 0);
  
    return {
      ...movimiento,
  
      IDMovimiento: movimiento.ID,
      IDPrincipal: principal?.ID || 0,
  
      NUMCENS: principal?.NUMCENS || null,
      NombreExterno: principal?.NombreExterno || "",
  
      nombre: principal ? nombreEntrega(principal) : "—",
  
      papeletasFalla,
      devueltasFalla,
      vendidasFalla,
  
      papeletasVirgen,
      devueltasVirgen,
      vendidasVirgen,
  
      papeletas,
      devueltas,
      vendidas,
  
      Serie:
        `F: ${movimiento.SerieFalla || "—"} / ` +
        `V: ${movimiento.SerieVirgen || "—"}`,
  
      importeTotal,
    };
  });
  
  const filas = filasBase.map((fila: any) => {
    const filasDelSocio = filasBase.filter(
      (otra: any) =>
        Number(otra.IDPrincipal) === Number(fila.IDPrincipal)
    );
  
    const ultimaFila =
      filasDelSocio[filasDelSocio.length - 1];
  
    const esUltimaEntrega =
      Number(ultimaFila?.IDMovimiento) ===
      Number(fila.IDMovimiento);
  
    const totalSocio = filasDelSocio.reduce(
      (suma: number, otra: any) =>
        suma + Number(otra.importeTotal || 0),
      0
    );
  
    const importePagado = esUltimaEntrega
      ? totalPagadoEntrega(fila.IDPrincipal)
      : 0;
  
    const pendiente = esUltimaEntrega
      ? Math.max(0, totalSocio - importePagado)
      : 0;
  
    return {
      ...fila,
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

  const gruposSocios = filasOrdenadas.reduce(
    (grupos: any[], fila: any) => {
      let grupo = grupos.find(
        (g: any) =>
          Number(g.IDPrincipal) === Number(fila.IDPrincipal)
      );
  
      if (!grupo) {
        grupo = {
          IDPrincipal: fila.IDPrincipal,
          nombre: fila.nombre,
          entregas: [],
        };
  
        grupos.push(grupo);
      }
  
      grupo.entregas.push(fila);
  
      return grupos;
    },
    []
  );

  const gruposSociosConTotales = gruposSocios.map((grupo: any) => {
    const total = grupo.entregas.reduce(
      (suma: number, entrega: any) =>
        suma + Number(entrega.importeTotal || 0),
      0
    );
  
    const pagado = totalPagadoEntrega(grupo.IDPrincipal);
  
    const pendiente = Math.max(0, total - pagado);
  
    return {
      ...grupo,
      total,
      pagado,
      pendiente,
    };
  });

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
          onClick={() => router.push("/loterias/navidad")}
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
            Lotería de Navidad
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
  <span className="font-semibold">Número Falla:</span>{" "}
  {configuracion?.NumeroFalla || "—"}
</p>

<p>
  <span className="font-semibold">Número Virgen:</span>{" "}
  {configuracion?.NumeroVirgen || "—"}
</p>

<p>
  <span className="font-semibold">Décimos Falla:</span>{" "}
  {Number(configuracion?.DecimosFalla || 0)}
</p>

<p>
  <span className="font-semibold">Décimos Virgen:</span>{" "}
  {Number(configuracion?.DecimosVirgen || 0)}
</p>

<p>
  <span className="font-semibold">Precio décimo Falla:</span>{" "}
  {euros(configuracion?.PrecioDecimoFalla || 0)}
</p>

<p>
  <span className="font-semibold">Precio décimo Virgen:</span>{" "}
  {euros(configuracion?.PrecioDecimoVirgen || 0)}
</p>

<p>
  <span className="font-semibold">Importe papeleta Falla:</span>{" "}
  {euros(configuracion?.ImportePapeletaFalla || 0)}
</p>

<p>
  <span className="font-semibold">Importe papeleta Virgen:</span>{" "}
  {euros(configuracion?.ImportePapeletaVirgen || 0)}
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
              gruposSociosConTotales.map((grupo: any) =>
                grupo.entregas.map((fila: any, index: number) => (
                  <tr key={fila.IDMovimiento}>
                    {index === 0 && (
                      <td
                        rowSpan={grupo.entregas.length}
                        className="border border-zinc-300 px-2 py-2 align-middle font-medium"
                      >
                        {grupo.nombre}
                      </td>
                    )}
              
                    <td className="border border-zinc-300 px-2 py-2 text-center">
                      {formatearFecha(fila.FechaEntrega)}
                    </td>
              
                    <td className="border border-zinc-300 px-2 py-2 text-center">
                      <div>F: {fila.SerieFalla || "—"}</div>
                      <div>V: {fila.SerieVirgen || "—"}</div>
                    </td>
              
                    <td className="border border-zinc-300 px-2 py-2 text-right">
                      <div>F: {fila.papeletasFalla}</div>
                      <div>V: {fila.papeletasVirgen}</div>
                    </td>
              
                    <td className="border border-zinc-300 px-2 py-2 text-right">
                      <div>F: {fila.devueltasFalla}</div>
                      <div>V: {fila.devueltasVirgen}</div>
                    </td>
              
                    <td className="border border-zinc-300 px-2 py-2 text-right">
                      <div>F: {fila.vendidasFalla}</div>
                      <div>V: {fila.vendidasVirgen}</div>
                    </td>
              
                    {index === 0 && (
                      <>
                        <td
                          rowSpan={grupo.entregas.length}
                          className="border border-zinc-300 px-2 py-2 text-right align-middle font-medium"
                        >
                          {euros(grupo.total)}
                        </td>
              
                        <td
                          rowSpan={grupo.entregas.length}
                          className="border border-zinc-300 px-2 py-2 text-right align-middle"
                        >
                          {euros(grupo.pagado)}
                        </td>
              
                        <td
                          rowSpan={grupo.entregas.length}
                          className="border border-zinc-300 px-2 py-2 text-right align-middle font-medium"
                        >
                          {euros(grupo.pendiente)}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )
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