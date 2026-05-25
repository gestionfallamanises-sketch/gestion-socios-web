"use client";

import Link from "next/link";
import Sidebar from "./components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [socios, setSocios] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  const sociosFiltrados = socios.filter((socio) =>
    normalizar(
      `${socio.Nombre || ""} ${socio.Apellidos || ""} ${socio.NUMCENS || ""}`
    ).includes(
      normalizar(busqueda)
    )
  );

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

                <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellidos o NUMCENS..."
                    className="w-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-900 lg:w-96"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />

                  <Link
                    href="/nuevo-socio"
                    className="bg-red-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-red-950"
                  >
                    + Añadir socio
                  </Link>
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
            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Listado de socios
                </h2>

                <p className="text-xs text-zinc-500">
                  Mostrando {sociosFiltrados.length} de {socios.length} socios
                </p>
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
                          {socio["Teléfono 1"] || "-"}
                        </td>

                        <td className="px-4 py-3 text-zinc-600">
                          {socio.Comision || "-"}
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