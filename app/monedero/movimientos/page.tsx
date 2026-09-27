"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../../lib/supabaseClient";
import * as XLSX from "xlsx";

export default function MovimientosMonederoPage() {

const [movimientos, setMovimientos] = useState<any[]>([]);
const [cargando, setCargando] = useState(true);
const [busqueda, setBusqueda] = useState("");
const [filtroTipo, setFiltroTipo] = useState<
  "todos" | "recargas" | "consumos" | "anulaciones"
>("todos");
const [fechaDesde, setFechaDesde] = useState("");
const [fechaHasta, setFechaHasta] = useState("");

useEffect(() => {
  cargarMovimientos();
}, []);

async function cargarMovimientos() {
  setCargando(true);

  const { data: movimientosData, error: movimientosError } =
    await (supabase as any)
      .from("MONEDEROS_MOVIMIENTOS")
      .select(`
        IDMovimiento,
        IDMonedero,
        Tipo,
        Importe,
        SaldoAnterior,
        SaldoPosterior,
        Concepto,
        Fecha,
        Anulado
      `)
      .order("Fecha", { ascending: false });

  if (movimientosError) {
    console.error("Error cargando movimientos:", movimientosError);
    setCargando(false);
    return;
  }

  const { data: monederosData, error: monederosError } =
    await (supabase as any)
      .from("MONEDEROS")
      .select("IDMonedero, NUMCENS");

  if (monederosError) {
    console.error("Error cargando monederos:", monederosError);
    setCargando(false);
    return;
  }

  const { data: sociosData, error: sociosError } =
    await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS, Nombre, Apellidos");

  if (sociosError) {
    console.error("Error cargando socios:", sociosError);
    setCargando(false);
    return;
  }

  const monederosPorId = new Map(
    (monederosData || []).map((monedero: any) => [
      String(monedero.IDMonedero),
      monedero,
    ])
  );

  const sociosPorNumcens = new Map(
    (sociosData || []).map((socio: any) => [
      String(socio.NUMCENS),
      socio,
    ])
  );

  const resultado = (movimientosData || []).map((movimiento: any) => {
    const monedero = monederosPorId.get(String(movimiento.IDMonedero));
    const socio = monedero
      ? sociosPorNumcens.get(String(monedero.NUMCENS))
      : null;

    return {
      ...movimiento,
      NUMCENS: monedero?.NUMCENS ?? null,
      Nombre: socio?.Nombre ?? "",
      Apellidos: socio?.Apellidos ?? "",
    };
  });

  setMovimientos(resultado);
  setCargando(false);
}

async function anularRecarga(idMovimiento: number, importe: number) {
  const confirmar = window.confirm(
    `¿Seguro que quieres anular esta recarga de ${importe.toFixed(
      2
    )} €?\n\nEl importe se descontará del saldo del monedero.`
  );

  if (!confirmar) return;

  const { data, error } = await (supabase as any).rpc(
    "anular_recarga_monedero",
    {
      p_id_movimiento: idMovimiento,
    }
  );

  if (error) {
    alert(error.message || "No se ha podido anular la recarga.");
    return;
  }

  alert(
    `Recarga anulada correctamente.\nNuevo saldo: ${Number(data).toFixed(
      2
    )} €`
  );

  await cargarMovimientos();
}

async function anularConsumo(idMovimiento: number, importe: number) {
  const confirmar = window.confirm(
    `¿Seguro que quieres anular este consumo de ${importe.toFixed(
      2
    )} €?\n\nEl importe volverá al saldo del monedero.`
  );

  if (!confirmar) return;

  const { data, error } = await (supabase as any).rpc(
    "anular_consumo_monedero",
    {
      p_id_movimiento: idMovimiento,
    }
  );

  if (error) {
    alert(error.message || "No se ha podido anular el consumo.");
    return;
  }

  alert(
    `Consumo anulado correctamente.\nNuevo saldo: ${Number(data).toFixed(
      2
    )} €`
  );

  await cargarMovimientos();
}

const movimientosFiltrados = useMemo(() => {
    const normalizar = (texto: string) =>
      texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
  
    const texto = normalizar(busqueda.trim());
  
    return movimientos.filter((movimiento) => {
      const nombreCompleto = normalizar(
        `${movimiento.Nombre || ""} ${movimiento.Apellidos || ""}`
      );
  
      const coincideBusqueda =
        !texto ||
        nombreCompleto.includes(texto) ||
        String(movimiento.NUMCENS || "").includes(texto);
  
      const coincideTipo =
        filtroTipo === "todos" ||
        (filtroTipo === "recargas" &&
          movimiento.Tipo === "RECARGA_EFECTIVO") ||
        (filtroTipo === "consumos" &&
          movimiento.Tipo === "CONSUMO") ||
        (filtroTipo === "anulaciones" &&
          (movimiento.Tipo === "ANULACION_RECARGA" ||
            movimiento.Tipo === "ANULACION_CONSUMO"));
            const fechaMovimiento = new Date(movimiento.Fecha);

            const coincideDesde =
              !fechaDesde ||
              fechaMovimiento >= new Date(`${fechaDesde}T00:00:00`);
            
            const coincideHasta =
              !fechaHasta ||
              fechaMovimiento <= new Date(`${fechaHasta}T23:59:59`);

      return (
  coincideBusqueda &&
  coincideTipo &&
  coincideDesde &&
  coincideHasta
);
    });
}, [movimientos, busqueda, filtroTipo, fechaDesde, fechaHasta]);

function exportarExcel() {
    const datos = movimientosFiltrados.map((movimiento) => {
      const esEntrada =
        movimiento.Tipo === "RECARGA_EFECTIVO" ||
        movimiento.Tipo === "ANULACION_CONSUMO";
  
      const esSalida =
        movimiento.Tipo === "CONSUMO" ||
        movimiento.Tipo === "ANULACION_RECARGA";
  
      const concepto =
        movimiento.Tipo === "RECARGA_EFECTIVO"
          ? "Recarga en efectivo"
          : movimiento.Tipo === "CONSUMO"
          ? "Consumo"
          : movimiento.Tipo === "ANULACION_RECARGA"
          ? "Anulación de recarga"
          : movimiento.Tipo === "ANULACION_CONSUMO"
          ? "Anulación de consumo"
          : movimiento.Tipo === "AJUSTE"
          ? "Ajuste"
          : movimiento.Concepto || movimiento.Tipo;
  
      return {
        Fecha: new Date(movimiento.Fecha).toLocaleString("es-ES"),
        NUMCENS: movimiento.NUMCENS ?? "",
        Socio: `${movimiento.Nombre || ""} ${
          movimiento.Apellidos || ""
        }`.trim(),
        Concepto: concepto,
        Importe: esEntrada
          ? Number(movimiento.Importe)
          : esSalida
          ? -Number(movimiento.Importe)
          : Number(movimiento.Importe),
        "Saldo anterior": Number(movimiento.SaldoAnterior),
        "Saldo posterior": Number(movimiento.SaldoPosterior),
      };
    });
  
    const hoja = XLSX.utils.json_to_sheet(datos);
  
    hoja["!cols"] = [
      { wch: 20 },
      { wch: 12 },
      { wch: 35 },
      { wch: 24 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
    ];
  
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Movimientos");
  
    XLSX.writeFile(libro, "movimientos-monedero.xlsx");
  }

  function imprimirMovimientos() {
    const filas = movimientosFiltrados
      .map((movimiento) => {
        const esEntrada =
          movimiento.Tipo === "RECARGA_EFECTIVO" ||
          movimiento.Tipo === "ANULACION_CONSUMO";
  
        const esSalida =
          movimiento.Tipo === "CONSUMO" ||
          movimiento.Tipo === "ANULACION_RECARGA";
  
        const concepto =
          movimiento.Tipo === "RECARGA_EFECTIVO"
            ? "Recarga en efectivo"
            : movimiento.Tipo === "CONSUMO"
            ? "Consumo"
            : movimiento.Tipo === "ANULACION_RECARGA"
            ? "Anulación de recarga"
            : movimiento.Tipo === "ANULACION_CONSUMO"
            ? "Anulación de consumo"
            : movimiento.Tipo === "AJUSTE"
            ? "Ajuste"
            : movimiento.Concepto || movimiento.Tipo;
  
        const signo = esEntrada ? "+" : esSalida ? "−" : "";
        const claseImporte = esEntrada
          ? "entrada"
          : esSalida
          ? "salida"
          : "";
  
        return `
          <tr>
            <td>${new Date(movimiento.Fecha).toLocaleString("es-ES")}</td>
            <td>${movimiento.NUMCENS ?? "—"}</td>
            <td>${`${movimiento.Nombre || ""} ${
              movimiento.Apellidos || ""
            }`.trim() || "—"}</td>
            <td>${concepto}</td>
            <td class="numero ${claseImporte}">
              ${signo}${Number(movimiento.Importe).toFixed(2)} €
            </td>
            <td class="numero">
              ${Number(movimiento.SaldoAnterior).toFixed(2)} €
            </td>
            <td class="numero">
              ${Number(movimiento.SaldoPosterior).toFixed(2)} €
            </td>
          </tr>
        `;
      })
      .join("");
  
    const ventana = window.open("", "_blank");
  
    if (!ventana) return;
  
    ventana.document.write(`
      <html>
        <head>
          <title>Movimientos de monederos</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 30px;
              color: #18181b;
            }
  
            h1 {
              font-size: 22px;
              margin-bottom: 20px;
            }
  
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
  
            th, td {
              border-bottom: 1px solid #d4d4d8;
              padding: 8px;
              text-align: left;
            }
  
            th {
              background: #f4f4f5;
            }
  
            .numero {
              text-align: right;
              white-space: nowrap;
            }
  
            .entrada {
              color: #15803d;
              font-weight: 600;
            }
  
            .salida {
              color: #b91c1c;
              font-weight: 600;
            }
          </style>
        </head>
  
        <body>
          <h1>Movimientos de monederos</h1>
  
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>NUMCENS</th>
                <th>Socio</th>
                <th>Concepto</th>
                <th>Importe</th>
                <th>Saldo anterior</th>
                <th>Saldo posterior</th>
              </tr>
            </thead>
  
            <tbody>
              ${filas}
            </tbody>
          </table>
  
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
  
    ventana.document.close();
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <section className="border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900">
                    Movimientos de monederos
                  </h1>

                  <p className="mt-2 text-sm text-zinc-600">
                    Consulta las recargas, consumos y anulaciones realizadas.
                  </p>
                </div>

                <div className="flex items-center gap-3">
  <button
  type="button"
  onClick={exportarExcel}
  className="bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300"
>
  Excel
</button>

<button
  type="button"
  onClick={imprimirMovimientos}
  className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
>
  Imprimir
</button>

<Link
  href="/monedero/gestion"
  className="text-sm font-medium text-red-900 hover:underline"
>
  ← Volver
</Link>
</div>
              </div>
            </div>
          </section>
          <section className="mt-6 border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-zinc-200 p-4">
  <div className="text-sm font-semibold text-zinc-900">
    MOVIMIENTOS
  </div>

  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => setFiltroTipo("todos")}
      className={`border px-3 py-2 text-sm ${
        filtroTipo === "todos"
          ? "border-red-900 bg-red-900 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      Todos
    </button>

    <button
      type="button"
      onClick={() => setFiltroTipo("recargas")}
      className={`border px-3 py-2 text-sm ${
        filtroTipo === "recargas"
          ? "border-red-900 bg-red-900 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      Recargas
    </button>

    <button
      type="button"
      onClick={() => setFiltroTipo("consumos")}
      className={`border px-3 py-2 text-sm ${
        filtroTipo === "consumos"
          ? "border-red-900 bg-red-900 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      Consumos
    </button>

    <button
      type="button"
      onClick={() => setFiltroTipo("anulaciones")}
      className={`border px-3 py-2 text-sm ${
        filtroTipo === "anulaciones"
          ? "border-red-900 bg-red-900 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      Anulaciones
    </button>

    <input
      type="text"
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
      placeholder="Buscar socio o NUMCENS..."
      className="w-72 border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
    />
  </div>
</div>

<div className="flex items-center justify-end gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
  <label className="flex items-center gap-2 text-sm text-zinc-600">
    Desde
    <input
      type="date"
      value={fechaDesde}
      onChange={(e) => setFechaDesde(e.target.value)}
      className="border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
    />
  </label>

  <label className="flex items-center gap-2 text-sm text-zinc-600">
    Hasta
    <input
      type="date"
      value={fechaHasta}
      onChange={(e) => setFechaHasta(e.target.value)}
      className="border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
    />
  </label>

  {(fechaDesde || fechaHasta) && (
    <button
      type="button"
      onClick={() => {
        setFechaDesde("");
        setFechaHasta("");
      }}
      className="text-sm font-medium text-red-900 hover:underline"
    >
      Limpiar fechas
    </button>
  )}
</div>

  {cargando ? (
    <div className="p-6 text-sm text-zinc-500">
      Cargando movimientos...
    </div>
  ) : (
    <table className="w-full text-sm">
      <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-600">
        <tr>
          <th className="px-4 py-3">Fecha</th>
          <th className="w-20 px-2 py-3">
  NUMCENS
</th>
          <th className="px-4 py-3">Socio</th>
          <th className="px-4 py-3">Concepto</th>
          <th className="px-4 py-3 text-right">Importe</th>
          <th className="px-4 py-3 text-right">Saldo anterior</th>
          <th className="px-4 py-3 text-right">Saldo posterior</th>
          <th className="w-20 px-2 py-3 text-right">
  Acciones
</th>
        </tr>
      </thead>

      <tbody>
        {movimientosFiltrados.map((movimiento) => (
          <tr
            key={movimiento.IDMovimiento}
            className="border-t border-zinc-200"
          >
            <td className="px-4 py-3">
              {new Date(movimiento.Fecha).toLocaleString("es-ES")}
            </td>

            <td className="w-20 whitespace-nowrap px-2 py-3">
  {movimiento.NUMCENS ?? "—"}
</td>

            <td className="px-4 py-3">
              {`${movimiento.Nombre || ""} ${
                movimiento.Apellidos || ""
              }`.trim() || "—"}
            </td>

            <td className="px-4 py-3">
  {movimiento.Tipo === "RECARGA_EFECTIVO"
    ? "Recarga en efectivo"
    : movimiento.Tipo === "CONSUMO"
    ? "Consumo"
    : movimiento.Tipo === "ANULACION_RECARGA"
    ? "Anulación de recarga"
    : movimiento.Tipo === "ANULACION_CONSUMO"
    ? "Anulación de consumo"
    : movimiento.Tipo === "AJUSTE"
    ? "Ajuste"
    : movimiento.Concepto || movimiento.Tipo}
</td>

<td
  className={`px-4 py-3 text-right font-semibold ${
    movimiento.Tipo === "RECARGA_EFECTIVO" ||
    movimiento.Tipo === "ANULACION_CONSUMO"
      ? "text-green-700"
      : movimiento.Tipo === "CONSUMO" ||
        movimiento.Tipo === "ANULACION_RECARGA"
      ? "text-red-700"
      : "text-zinc-700"
  }`}
>
  {movimiento.Tipo === "RECARGA_EFECTIVO" ||
  movimiento.Tipo === "ANULACION_CONSUMO"
    ? "+"
    : movimiento.Tipo === "CONSUMO" ||
      movimiento.Tipo === "ANULACION_RECARGA"
    ? "−"
    : ""}
  {Number(movimiento.Importe).toFixed(2)} €
</td>

            <td className="px-4 py-3 text-right">
              {Number(movimiento.SaldoAnterior).toFixed(2)} €
            </td>

            <td className="px-4 py-3 text-right">
              {Number(movimiento.SaldoPosterior).toFixed(2)} €
            </td>

            <td className="w-20 whitespace-nowrap px-2 py-3 text-right">
  {(movimiento.Tipo === "RECARGA_EFECTIVO" ||
    movimiento.Tipo === "CONSUMO") &&
    !movimiento.Anulado && (
      <button
        type="button"
        onClick={() => {
          if (movimiento.Tipo === "RECARGA_EFECTIVO") {
            anularRecarga(
              movimiento.IDMovimiento,
              Number(movimiento.Importe)
            );
          } else {
            anularConsumo(
              movimiento.IDMovimiento,
              Number(movimiento.Importe)
            );
          }
        }}
        className="text-xs font-medium text-red-800 hover:underline"
      >
        Anular
      </button>
    )}

  {(movimiento.Tipo === "RECARGA_EFECTIVO" ||
    movimiento.Tipo === "CONSUMO") &&
    movimiento.Anulado && (
      <span className="text-xs text-zinc-400">
        Anulado
      </span>
    )}
</td>
          </tr>
        ))}

{movimientosFiltrados.length === 0 && (
          <tr>
            <td
              colSpan={7}
              className="px-4 py-8 text-center text-zinc-500"
            >
              No hay movimientos registrados.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )}
</section>
        </div>
      </main>
    </div>
  );
}