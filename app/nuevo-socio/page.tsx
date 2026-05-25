"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import { useRouter } from "next/navigation";

export default function NuevoSocioPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    NUMCENS: "",
    Nombre: "",
    Apellidos: "",
    CODJCF: "",
    Comision: "MAY",
    SEXE: "H",
    Telefono1: "",
    Ciudad: "",
    Direccion: "",
    CodigoPostal: "",
    FechaNacimiento: "",
    NIF: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function crearSocio(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const { error } = await supabase.from("SOCIOS").insert({
      NUMCENS: Number(form.NUMCENS),
      Nombre: form.Nombre,
      Apellidos: form.Apellidos,
      CODJCF: form.CODJCF || null,
      Comision: form.Comision,
      SEXE: form.SEXE,
      "Teléfono 1": form.Telefono1 || null,
      Ciudad: form.Ciudad || null,
      Dirección: form.Direccion || null,
      "Código Postal": form.CodigoPostal || null,
      "FECHA de NACIMIENTO": form.FechaNacimiento || null,
      NIF: form.NIF || null,
    });

    setGuardando(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
  }

  const inputClass = "col-span-2 rounded-lg border px-3 py-1.5 text-sm";
  const labelClass = "text-sm font-medium text-zinc-700";

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <div className="flex-1 p-6">
        <main className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-lg">
          <h1 className="mb-1 text-2xl font-bold">Nuevo socio</h1>
          <p className="mb-5 text-sm text-zinc-500">
            Crear un nuevo socio
          </p>

          {error && (
            <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
              Error: {error}
            </p>
          )}

          <form onSubmit={crearSocio} className="space-y-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <label className={labelClass}>NUMCENS</label>
              <input
                required
                type="number"
                className={`${inputClass} font-semibold`}
                value={form.NUMCENS}
                onChange={(e) => setForm({ ...form, NUMCENS: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <label className={labelClass}>Nombre</label>
              <input
                required
                className={inputClass}
                value={form.Nombre}
                onChange={(e) => setForm({ ...form, Nombre: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <label className={labelClass}>Apellidos</label>
              <input
                required
                className={inputClass}
                value={form.Apellidos}
                onChange={(e) => setForm({ ...form, Apellidos: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <label className={labelClass}>Código JCF</label>
              <input
                className={inputClass}
                value={form.CODJCF}
                onChange={(e) => setForm({ ...form, CODJCF: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <label className={labelClass}>Comisión</label>
              <select
                className={inputClass}
                value={form.Comision}
                onChange={(e) => setForm({ ...form, Comision: e.target.value })}
              >
                <option value="MAY">MAY</option>
                <option value="INF">INF</option>
              </select>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <label className={labelClass}>Sexo</label>
              <select
                className={inputClass}
                value={form.SEXE}
                onChange={(e) => setForm({ ...form, SEXE: e.target.value })}
              >
                <option value="H">H</option>
                <option value="M">M</option>
              </select>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <label className={labelClass}>Fecha nacimiento</label>
              <input
                type="date"
                className={inputClass}
                value={form.FechaNacimiento}
                onChange={(e) =>
                  setForm({ ...form, FechaNacimiento: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <label className={labelClass}>Dirección</label>
              <input
                className={inputClass}
                value={form.Direccion}
                onChange={(e) => setForm({ ...form, Direccion: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <label className={labelClass}>Código postal</label>
              <input
                className={inputClass}
                value={form.CodigoPostal}
                onChange={(e) =>
                  setForm({ ...form, CodigoPostal: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <label className={labelClass}>Ciudad</label>
              <input
                className={inputClass}
                value={form.Ciudad}
                onChange={(e) => setForm({ ...form, Ciudad: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <label className={labelClass}>Teléfono</label>
              <input
                className={inputClass}
                value={form.Telefono1}
                onChange={(e) => setForm({ ...form, Telefono1: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <label className={labelClass}>NIF</label>
              <input
                className={inputClass}
                value={form.NIF}
                onChange={(e) => setForm({ ...form, NIF: e.target.value })}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Crear socio"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-lg border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold hover:bg-zinc-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}