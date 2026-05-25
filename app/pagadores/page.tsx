"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";

export default function PagadoresPage() {
  const [pagadores, setPagadores] = useState<any[]>([]);
  const [form, setForm] = useState({
    Nombre: "",
    Apellidos: "",
    NIF: "",
    IBAN: "",
  });

  async function cargarPagadores() {
    const { data } = await supabase
      .from("PAGADORES_EXTERNOS")
      .select("*")
      .eq("Activo", true)
      .order("Apellidos", { ascending: true });

    setPagadores(data || []);
  }

  useEffect(() => {
    cargarPagadores();
  }, []);

  async function crearPagador(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await (supabase as any)
      .from("PAGADORES_EXTERNOS")
      .insert({
        Nombre: form.Nombre,
        Apellidos: form.Apellidos || null,
        NIF: form.NIF || null,
        IBAN: form.IBAN || null,
        Activo: true,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setForm({
      Nombre: "",
      Apellidos: "",
      NIF: "",
      IBAN: "",
    });

    cargarPagadores();
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-6xl">
          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <h1 className="text-2xl font-bold text-zinc-900">
                Pagadores externos
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                Personas que pagan cuotas pero no son socios.
              </p>
            </div>
          </section>

          <section className="mb-8 border border-zinc-200 bg-white">
            <div className="bg-zinc-100 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Nuevo pagador externo
              </h2>
            </div>

            <form onSubmit={crearPagador} className="grid gap-4 p-4 md:grid-cols-4">
              <input
                required
                placeholder="Nombre"
                value={form.Nombre}
                onChange={(e) =>
                  setForm({ ...form, Nombre: e.target.value })
                }
                className="border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
              />

              <input
                placeholder="Apellidos"
                value={form.Apellidos}
                onChange={(e) =>
                  setForm({ ...form, Apellidos: e.target.value })
                }
                className="border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
              />

              <input
                placeholder="NIF"
                value={form.NIF}
                onChange={(e) =>
                  setForm({ ...form, NIF: e.target.value })
                }
                className="border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
              />

              <input
                placeholder="IBAN"
                value={form.IBAN}
                onChange={(e) =>
                  setForm({ ...form, IBAN: e.target.value })
                }
                className="border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
              />

              <div className="md:col-span-4">
                <button
                  type="submit"
                  className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
                >
                  Crear pagador
                </button>
              </div>
            </form>
          </section>

          <section className="border border-zinc-200 bg-white">
            <div className="bg-zinc-100 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Listado
              </h2>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">NIF</th>
                  <th className="px-4 py-3">IBAN</th>
                </tr>
              </thead>

              <tbody>
                {pagadores.map((p) => (
                  <tr key={p.IDPagadorExterno} className="border-t border-zinc-200">
                    <td className="px-4 py-3 font-medium">
                      {p.Apellidos}, {p.Nombre}
                    </td>
                    <td className="px-4 py-3">{p.NIF || "-"}</td>
                    <td className="px-4 py-3">{p.IBAN || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}