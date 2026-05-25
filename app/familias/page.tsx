"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { supabase } from "@/lib/supabaseClient";

export default function FamiliasPage() {
  const [familias, setFamilias] = useState<any[]>([]);
const [busqueda, setBusqueda] = useState("");
const [nombreFamilia, setNombreFamilia] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cargarFamilias() {
    const { data, error } = await supabase
      .from("FAMILIAS")
      .select("*")
      .order("Nombre_Familia", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setFamilias(data || []);
    }
  }

  useEffect(() => {
    cargarFamilias();
  }, []);

  async function crearFamilia(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
  
    const { data, error } = await supabase
      .from("FAMILIAS")
      .insert({
        Nombre_Familia: nombreFamilia,
        Observaciones: observaciones || null,
      })
      .select()
      .single();
  
    if (error) {
      setError(error.message);
      return;
    }
  
    window.location.href = `/familias/${data.ID_Familia}`;
  }

  async function actualizarFamilia(
    idFamilia: number,
    campo: string,
    valor: string
  ) {
    const { error } = await supabase
      .from("FAMILIAS")
      .update({
        [campo]: valor || null,
      })
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

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">
        <section className="no-print mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900">
                    Familias
                  </h1>

                  <p className="mt-2 text-sm text-zinc-600">
                    Crear y consultar familias de socios · {familias.length} familias
                  </p>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Error: {error}
            </div>
          )}

<section className="no-print mb-8 border border-zinc-200 bg-white">
            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Nueva familia
                </h2>

                <p className="text-xs text-zinc-500">
                  Crea una nueva unidad familiar
                </p>
              </div>
            </div>

            <form onSubmit={crearFamilia} className="p-4">
  <div className="grid items-end gap-4 lg:grid-cols-[1fr_1fr_auto]">
    <div>
      <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
        Nombre familia
      </label>

      <input
        required
        className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
        value={nombreFamilia}
        onChange={(e) => setNombreFamilia(e.target.value)}
      />
    </div>

    <div>
      <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
        Observaciones
      </label>

      <input
        className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
      />
    </div>

    <div>
      <button
        type="submit"
        className="h-[38px] bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
      >
        Crear familia
      </button>
    </div>
  </div>
</form>
          </section>

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
  onClick={() =>
    window.open("/familias/imprimir-miembros", "_blank")
  }
  className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
>
  Imprimir/Exportar fam_miem
</button>
  </div>
</div>

            {familias.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500">
                No hay familias creadas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Familia</th>
                      <th className="px-4 py-3">Observaciones</th>
                      <th className="no-print px-4 py-3 text-center">
  Editar
</th>
                      <th className="no-print px-4 py-3 text-right">
  Acción
</th>
                    </tr>
                  </thead>

                  <tbody>
                    {familiasFiltradas.map((familia) => (
                      <tr
                        key={familia.ID_Familia}
                        className="border-t border-zinc-200 hover:bg-red-50"
                      >
                        <td className="px-4 py-3 text-zinc-600">
                          #{familia.ID_Familia}
                        </td>

                        <td className="px-4 py-3">
  {familia.Nombre_Familia}
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