"use client";

import Link from "next/link";
import Sidebar from "./components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { normalizarTexto } from "@/lib/texto";
import * as XLSX from "xlsx";

export default function Home() {
  const [socios, setSocios] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editandoTelefono, setEditandoTelefono] = useState<number | null>(null);
const [telefonoTemporal, setTelefonoTemporal] = useState("");
const [guardandoTelefono, setGuardandoTelefono] = useState(false);

  useEffect(() => {
    async function fetchSocios() {
      const { data, error } = await supabase
        .from("SOCIOS")
        .select("*")
        .order("Apellidos", { ascending: true });

      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setSocios(data || []);
      }
    }

    fetchSocios();
  }, []);

  function normalizar(texto: string) {
    return normalizarTexto(texto);
  }

  const sociosFiltrados = socios.filter((socio) =>
    normalizar(
      `${socio.Nombre || ""} ${socio.Apellidos || ""} ${socio.NUMCENS || ""}`
    ).includes(
      normalizar(busqueda)
    )
  );

  async function guardarTelefono(numcens: number) {
    setGuardandoTelefono(true);
  
    const { error } = await (supabase as any)
  .from("SOCIOS")
  .update({
    "Teléfono 1": telefonoTemporal.trim() || null,
  })
      .eq("NUMCENS", numcens);
  
    if (error) {
      console.error(error);
      setError(error.message);
      setGuardandoTelefono(false);
      return;
    }
  
    setSocios((anteriores) =>
      anteriores.map((socio) =>
        Number(socio.NUMCENS) === Number(numcens)
          ? {
              ...socio,
              "Teléfono 1": telefonoTemporal.trim() || null,
            }
          : socio
      )
    );
  
    setEditandoTelefono(null);
    setTelefonoTemporal("");
    setGuardandoTelefono(false);
  }

  async function cambiarComision(numcens: number, nuevaComision: string) {
    const { error } = await (supabase as any)
  .from("SOCIOS")
  .update({
    Comision: nuevaComision,
  })
      .eq("NUMCENS", numcens);
  
    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }
  
    setSocios((anteriores) =>
      anteriores.map((socio) =>
        Number(socio.NUMCENS) === Number(numcens)
          ? {
              ...socio,
              Comision: nuevaComision,
            }
          : socio
      )
    );
  }
  
  function exportarExcel() {
    const datos = sociosFiltrados.map((socio) => ({
      Socio: `${socio.Apellidos || ""}, ${socio.Nombre || ""}`,
      NUMCENS: socio.NUMCENS || "",
      Teléfono: socio["Teléfono 1"] || "",
      Comisión: socio.Comision || "",
      Estado: socio.Estado || "",
    }));
  
    const hoja = XLSX.utils.json_to_sheet(datos);
  
    hoja["!cols"] = [
      { wch: 40 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
    ];
  
    const libro = XLSX.utils.book_new();
  
    XLSX.utils.book_append_sheet(
      libro,
      hoja,
      "Socios"
    );
  
    XLSX.writeFile(libro, "Listado_socios.xlsx");
  }

  function imprimirListado() {
    const filas = sociosFiltrados
      .map(
        (socio) => `
          <tr>
            <td>${socio.Apellidos || ""}, ${socio.Nombre || ""}</td>
            <td>${socio.NUMCENS || "-"}</td>
            <td>${socio["Teléfono 1"] || "-"}</td>
            <td>${socio.Comision || "-"}</td>
            <td>${socio.Estado || "-"}</td>
          </tr>
        `
      )
      .join("");
  
    const ventana = window.open("", "_blank");
  
    if (!ventana) return;
  
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Listado de socios</title>
  
          <style>
            @page {
              size: A4;
              margin: 12mm;
            }
  
            body {
              font-family: Arial, sans-serif;
              color: #18181b;
              font-size: 11px;
            }
  
            h1 {
              font-size: 18px;
              margin: 0 0 4px 0;
            }
  
            p {
              margin: 0 0 15px 0;
              color: #52525b;
            }
  
            table {
              width: 100%;
              border-collapse: collapse;
            }
  
            th {
              background: #f4f4f5;
              text-align: left;
              font-size: 10px;
              text-transform: uppercase;
            }
  
            th,
            td {
              border: 1px solid #d4d4d8;
              padding: 6px 8px;
            }
  
            tr {
              page-break-inside: avoid;
            }
          </style>
        </head>
  
        <body>
          <h1>Listado de socios</h1>
          <p>${sociosFiltrados.length} socios</p>
  
          <table>
            <thead>
              <tr>
                <th>Socio</th>
                <th>NUMCENS</th>
                <th>Teléfono</th>
                <th>Comisión</th>
                <th>Estado</th>
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
          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900">
                    Gestión de Socios
                  </h1>

                  <p className="mt-2 text-sm text-zinc-600">
                    Listado general de socios registrados · {socios.length} socios
                  </p>
                </div>

                <div className="flex items-center gap-2">
  <button
    type="button"
    onClick={exportarExcel}
    className="border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
  >
    Excel
  </button>

  <button
  type="button"
  onClick={imprimirListado}
  className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
>
  Imprimir
</button>
</div>
              </div>
            </div>
          </section>

          {error && (
            <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Error: {error}
            </div>
          )}

          <section className="border border-zinc-200 bg-white">
          <div className="flex flex-col gap-3 bg-zinc-100 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
  <div>
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
      Listado de socios
    </h2>

    <p className="text-xs text-zinc-500">
      Mostrando {sociosFiltrados.length} de {socios.length} socios
    </p>
  </div>

  <div className="flex w-full gap-2 lg:w-auto">
    <input
      type="text"
      placeholder="Buscar por nombre, apellidos o NUMCENS..."
      className="w-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-900 lg:w-96"
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
    />

    <Link
      href="/nuevo-socio"
      className="whitespace-nowrap bg-red-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-red-950"
    >
      + Añadir socio
    </Link>
  </div>
</div>

            {sociosFiltrados.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500">
                No se encontraron socios.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                    <tr>
                      <th className="px-4 py-3">Socio</th>
                      <th className="px-4 py-3">NUMCENS</th>
                      <th className="px-4 py-3">Teléfono</th>
                      <th className="px-4 py-3">Comisión</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sociosFiltrados.map((socio) => (
                      <tr
                        key={socio.NUMCENS}
                        className="border-t border-zinc-200 hover:bg-red-50"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/socios/${socio.NUMCENS}`}
                            className="font-medium text-zinc-900 hover:text-red-900 hover:underline"
                          >
                            {socio.Apellidos}, {socio.Nombre}
                          </Link>
                        </td>

                        <td className="px-4 py-3 text-zinc-600">
                          {socio.NUMCENS || "-"}
                        </td>

                        <td className="px-4 py-3 text-zinc-600">
  {editandoTelefono === Number(socio.NUMCENS) ? (
    <input
      type="text"
      autoFocus
      value={telefonoTemporal}
      disabled={guardandoTelefono}
      onChange={(e) => setTelefonoTemporal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          guardarTelefono(Number(socio.NUMCENS));
        }

        if (e.key === "Escape") {
          setEditandoTelefono(null);
          setTelefonoTemporal("");
        }
      }}
      onBlur={() => {
        if (!guardandoTelefono) {
          guardarTelefono(Number(socio.NUMCENS));
        }
      }}
      className="w-36 border border-red-900 bg-white px-2 py-1 text-sm outline-none"
    />
  ) : (
    <button
      type="button"
      onClick={() => {
        setEditandoTelefono(Number(socio.NUMCENS));
        setTelefonoTemporal(socio["Teléfono 1"] || "");
      }}
      className="text-left text-zinc-600 hover:text-red-900 hover:underline"
      title="Editar teléfono"
    >
      {socio["Teléfono 1"] || "Añadir teléfono"}
    </button>
  )}
</td>

<td className="px-4 py-3">
  <select
    value={socio.Comision || ""}
    onChange={(e) =>
      cambiarComision(Number(socio.NUMCENS), e.target.value)
    }
    className="cursor-pointer bg-transparent py-1 text-sm text-zinc-600 outline-none hover:text-red-900"
    title="Cambiar comisión"
  >
    <option value="">-</option>
    <option value="MAY">MAY</option>
    <option value="INF">INF</option>
  </select>
</td>

                        <td className="px-4 py-3">
                          <span
                            className={
                              socio.Estado === "Activo"
                                ? "bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                                : "bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                            }
                          >
                            {socio.Estado || "Sin estado"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/socios/${socio.NUMCENS}`}
                            className="bg-red-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-950"
                          >
                            Ver ficha
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}