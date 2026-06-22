"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { supabase } from "@/lib/supabaseClient";

export default function FamiliasPage() {
  const [familias, setFamilias] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cargarFamilias() {
    const { data, error } = await (supabase as any)
      .from("FAMILIAS")
      .select("*")
      .order("Nombre_Familia", { ascending: true });

    if (error) setError(error.message);
    else setFamilias((data as any[]) || []);
  }

  useEffect(() => {
    cargarFamilias();
  }, []);

  async function actualizarFamilia(idFamilia: number, campo: string, valor: string) {
    const { error } = await (supabase as any)
      .from("FAMILIAS")
      .update({ [campo]: valor || null })
      .eq("ID_Familia", idFamilia);

    if (error) {
      setError(error.message);
      return;
    }

    await cargarFamilias();
  }

  const familiasFiltradas = familias.filter((familia) =>
    `${familia.ID_Familia} ${familia.Nombre_Familia || ""} ${familia.Observaciones || ""}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  async function eliminarFamilia(familia: any) {
    const { data: miembros, error: errorMiembros } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS")
      .eq("ID_Familia", familia.ID_Familia)
  
    if (errorMiembros) {
      alert("Error comprobando miembros: " + errorMiembros.message);
      return;
    }
  
    if (miembros && miembros.length > 0) {
      alert(
        "No se puede eliminar esta familia porque todavía tiene socios asignados. Traslada primero los miembros a otra familia."
      );
      return;
    }
  
    const confirmar = confirm(
      `La familia está vacía. ¿Quieres eliminarla definitivamente?`
    );
  
    if (!confirmar) return;
  
    const { error } = await (supabase as any)
      .from("FAMILIAS")
      .delete()
.eq("ID_Familia", familia.ID_Familia)
  
    if (error) {
      alert("Error eliminando familia: " + error.message);
      return;
    }
  
    alert("Familia eliminada correctamente");
    cargarFamilias();
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <section className="no-print mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900">Familias</h1>
                  <p className="mt-2 text-sm text-zinc-600">
                    Consultar familias de socios · {familias.length} familias
                  </p>
                </div>

                <Link
                  href="/familias/nueva"
                  className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
                >
                  + Crear familia
                </Link>
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
                  Listado de familias
                </h2>
                <p className="text-xs text-zinc-500">
                  Mostrando {familiasFiltradas.length} familias
                </p>
              </div>

              <div className="no-print flex items-center gap-3">
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar familia..."
                  className="w-80 border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
                />

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Imprimir
                </button>

                <button
                  type="button"
                  onClick={() => window.open("/familias/imprimir-miembros", "_blank")}
                  className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
                >
                  Imprimir/Exportar fam_miem
                </button>
              </div>
            </div>

            {familias.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500">No hay familias creadas.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Familia</th>
                      <th className="px-4 py-3">Observaciones</th>
                      <th className="no-print px-4 py-3 text-center">Editar</th>
                      <th className="no-print px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {familiasFiltradas.map((familia) => (
                      <tr
                        key={familia.ID_Familia}
                        className="border-t border-zinc-200 hover:bg-red-50"
                      >
                        <td className="px-4 py-3 text-zinc-600">#{familia.ID_Familia}</td>

                        <td className="px-4 py-3">
                          <Link
                            href={`/familias/${familia.ID_Familia}`}
                            className="font-medium text-zinc-900 hover:text-red-900 hover:underline"
                          >
                            {familia.Nombre_Familia || `Familia ${familia.ID_Familia}`}
                          </Link>
                        </td>

                        <td className="px-4 py-3 text-zinc-600">
                          {familia.Observaciones || "-"}
                        </td>

                        <td className="no-print px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={async () => {
                              const nuevoNombre = prompt(
                                "Nombre familia",
                                familia.Nombre_Familia || ""
                              );

                              if (nuevoNombre === null) return;

                              const nuevasObservaciones = prompt(
                                "Observaciones",
                                familia.Observaciones || ""
                              );

                              await actualizarFamilia(
                                familia.ID_Familia,
                                "Nombre_Familia",
                                nuevoNombre
                              );

                              await actualizarFamilia(
                                familia.ID_Familia,
                                "Observaciones",
                                nuevasObservaciones || ""
                              );
                            }}
                            className="text-zinc-500 hover:text-red-900"
                          >
                            ✏️
                          </button>
                        </td>

                        <td className="no-print px-4 py-3 text-right">
                          <Link
                            href={`/familias/${familia.ID_Familia}`}
                            className="bg-red-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-950"
                          >
                            Ver familia
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