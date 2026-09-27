"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../../lib/supabaseClient";
import MonederoSocioDesplegable from "../../components/MonederoSocioDesplegable";

export default function GestionMonederosPage() {
  const [socios, setSocios] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroMonedero, setFiltroMonedero] = useState<
  "todos" | "con" | "sin"
>("todos");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarSocios();
  }, []);

  async function cargarSocios() {
    setCargando(true);
  
    const { data: sociosData, error: sociosError } = await (supabase as any)
  .from("SOCIOS")
  .select("NUMCENS, Nombre, Apellidos, Estado")
  .eq("Estado", "Activo")
  .order("Apellidos", { ascending: true })
  .order("Nombre", { ascending: true });
  
    if (sociosError) {
      console.error("Error cargando socios:", sociosError);
      setCargando(false);
      return;
    }
  
    const { data: monederosData, error: monederosError } = await (supabase as any)
      .from("MONEDEROS")
      .select("IDMonedero, NUMCENS, TokenQR, Saldo, Activo");
  
    if (monederosError) {
      console.error("Error cargando monederos:", monederosError);
      setCargando(false);
      return;
    }
  
    const monederosPorSocio = new Map(
  (monederosData || []).map((monedero: any) => [
    String(monedero.NUMCENS).trim(),
    monedero,
  ])
);

const resultado = (sociosData || []).map((socio: any) => ({
  ...socio,
  monedero:
    monederosPorSocio.get(String(socio.NUMCENS).trim()) || null,
}));
  
    setSocios(resultado);
    setCargando(false);
  }

  const sociosFiltrados = useMemo(() => {
    const normalizar = (texto: string) =>
      texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
  
    const texto = normalizar(busqueda.trim());
  
    return socios.filter((socio) => {
      const nombreCompleto = normalizar(
        `${socio.Nombre || ""} ${socio.Apellidos || ""}`
      );
  
      const coincideBusqueda =
        !texto ||
        nombreCompleto.includes(texto) ||
        String(socio.NUMCENS).includes(texto);
  
      const coincideMonedero =
        filtroMonedero === "todos" ||
        (filtroMonedero === "con" && Boolean(socio.monedero)) ||
        (filtroMonedero === "sin" && !socio.monedero);
  
      return coincideBusqueda && coincideMonedero;
    });
  }, [socios, busqueda, filtroMonedero]);

  const resumenMonederos = useMemo(() => {
    const conMonedero = sociosFiltrados.filter(
      (socio) => Boolean(socio.monedero)
    );
  
    const saldoTotal = conMonedero.reduce(
      (total, socio) => total + Number(socio.monedero?.Saldo || 0),
      0
    );
  
    return {
      cantidad: conMonedero.length,
      saldoTotal,
    };
  }, [sociosFiltrados]);

  function exportarExcel() {
    const datos = sociosFiltrados.map((socio) => ({
      NUMCENS: socio.NUMCENS,
      Socio: `${socio.Nombre || ""} ${socio.Apellidos || ""}`.trim(),
      "Tiene monedero": socio.monedero ? "Sí" : "No",
      Saldo: socio.monedero
        ? Number(socio.monedero.Saldo || 0)
        : "",
    }));
  
    const hoja = XLSX.utils.json_to_sheet(datos);
  
    hoja["!cols"] = [
        { wch: 12 },
        { wch: 35 },
        { wch: 18 },
        { wch: 14 },
      ];
  
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Monederos");
  
    XLSX.writeFile(libro, "monederos.xlsx");
  }
  
  function imprimirMonederos() {
    const filas = sociosFiltrados
      .map(
        (socio) => `
          <tr>
            <td>${socio.NUMCENS}</td>
            <td>${`${socio.Nombre || ""} ${socio.Apellidos || ""}`.trim()}</td>
            <td>
              ${
                socio.monedero
                  ? `${Number(socio.monedero.Saldo || 0).toFixed(2)} €`
                  : "—"
              }
            </td>
            <td>${socio.monedero ? "Sí" : "No"}</td>
          </tr>
        `
      )
      .join("");
  
    const ventana = window.open("", "_blank");
  
    if (!ventana) return;
  
    ventana.document.write(`
      <html>
        <head>
          <title>Gestión de monederos</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 30px;
              color: #18181b;
            }
  
            h1 {
              font-size: 22px;
              margin-bottom: 6px;
            }
  
            .resumen {
              margin-bottom: 20px;
              font-size: 14px;
            }
  
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }
  
            th, td {
              border-bottom: 1px solid #d4d4d8;
              padding: 8px;
              text-align: left;
            }
  
            th {
              background: #f4f4f5;
            }
          </style>
        </head>
  
        <body>
          <h1>Gestión de monederos</h1>
  
          <div class="resumen">
            Monederos: ${resumenMonederos.cantidad}
            &nbsp;&nbsp;·&nbsp;&nbsp;
            Saldo total: ${resumenMonederos.saldoTotal.toFixed(2)} €
          </div>
  
          <table>
            <thead>
              <tr>
                <th>NUMCENS</th>
                <th>Socio</th>
                <th>Saldo</th>
                <th>Monedero</th>
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
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">
                Gestión de monederos
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                Activa, consulta y gestiona los monederos de los socios.
              </p>
            </div>

            <div className="flex items-center gap-3">
  
            <Link
  href="/monedero/movimientos"
  className="border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
>
  Movimientos
</Link>

<button
    type="button"
    onClick={exportarExcel}
    className="bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300"
  >
    Excel
  </button>

  <button
  type="button"
  onClick={imprimirMonederos}
  className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
>
  Imprimir
</button>

  <Link
    href="/monedero"
    className="text-sm font-medium text-red-900 hover:underline"
  >
    ← Volver
  </Link>
</div>
          </div>

          <div className="border border-zinc-200 bg-white">
          <div className="flex items-center gap-6 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
  <div>
    <span className="text-zinc-500">Monederos: </span>
    <span className="font-semibold text-zinc-900">
      {resumenMonederos.cantidad}
    </span>
  </div>

  <div>
    <span className="text-zinc-500">Saldo total: </span>
    <span className="font-semibold text-zinc-900">
      {resumenMonederos.saldoTotal.toFixed(2)} €
    </span>
  </div>
</div>
          <div className="flex items-center justify-between gap-4 border-b border-zinc-200 p-4">
  <div className="text-sm font-semibold text-zinc-900">
    SOCIOS
  </div>

  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => setFiltroMonedero("todos")}
      className={`border px-3 py-2 text-sm ${
        filtroMonedero === "todos"
          ? "border-red-900 bg-red-900 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      Todos
    </button>

    <button
      type="button"
      onClick={() => setFiltroMonedero("con")}
      className={`border px-3 py-2 text-sm ${
        filtroMonedero === "con"
          ? "border-red-900 bg-red-900 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      Con monedero
    </button>

    <button
      type="button"
      onClick={() => setFiltroMonedero("sin")}
      className={`border px-3 py-2 text-sm ${
        filtroMonedero === "sin"
          ? "border-red-900 bg-red-900 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      Sin monedero
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

            {cargando ? (
              <div className="p-6 text-sm text-zinc-500">
                Cargando socios...
              </div>
            ) : (
                <div className="overflow-visible">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-600">
                    <tr>
                    <th className="px-4 py-3">NUMCENS</th>
<th className="px-4 py-3">Socio</th>
<th className="px-4 py-3">Saldo</th>
<th className="px-4 py-3">Monedero</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sociosFiltrados.map((socio) => (
                      <tr
                        key={socio.NUMCENS}
                        className="border-t border-zinc-200"
                      >
                        <td className="px-4 py-3">
                          {socio.NUMCENS}
                        </td>

                        <td className="px-4 py-3 font-medium text-zinc-900">
                          {socio.Nombre} {socio.Apellidos}
                        </td>

                        <td className="px-4 py-3 font-medium">
  {socio.monedero
    ? `${Number(socio.monedero.Saldo || 0).toFixed(2)} €`
    : "—"}
</td>

                        <td className="px-4 py-3">
  <MonederoSocioDesplegable
    numcens={Number(socio.NUMCENS)}
    nombre={socio.Nombre || ""}
    apellidos={socio.Apellidos || ""}
    monederoId={socio.monedero?.IDMonedero ?? null}
    tokenQR={socio.monedero?.TokenQR ?? null}
    tieneMonedero={Boolean(socio.monedero)}
    saldo={Number(socio.monedero?.Saldo || 0)}
    activo={Boolean(socio.monedero?.Activo)}
    compacto
  />
</td>
                      </tr>
                    ))}

                    {sociosFiltrados.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-zinc-500"
                        >
                          No se han encontrado socios.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}