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
    FechaPrimerAlta: new Date().toISOString().slice(0, 10),
    NIF: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function crearSocio(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const { error } = await supabase.from("SOCIOS").insert({
      id: Number(form.NUMCENS),
      NUMCENS: Number(form.NUMCENS),
      Estado: "Activo",
      FechaPrimerAlta: form.FechaPrimerAlta,
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
      console.log("ERROR INSERT SOCIOS:", error);
      setError(error.message);
      return;
    }

    router.push(`/socios/${form.NUMCENS}/editar`);
  }

  const inputClass =
    "w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900";
  const labelClass =
    "mb-1 block text-xs font-medium uppercase text-zinc-500";

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <div className="flex-1 p-6">
        <main className="mx-auto max-w-6xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-l-4 border-red-900 px-6 py-5">
            <h1 className="text-2xl font-bold text-zinc-900">Nuevo socio</h1>
            <p className="mt-2 text-sm text-zinc-600">Crear un nuevo socio</p>
          </div>

          {error && (
            <p className="mx-6 mt-4 bg-red-50 p-3 text-sm text-red-700">
              Error: {error}
            </p>
          )}

          <form onSubmit={crearSocio} className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Campo label="NUMCENS">
              <input
  required
  inputMode="numeric"
  pattern="[0-9]*"
  className={`${inputClass} font-semibold`}
  value={form.NUMCENS}
  onChange={(e) =>
    setForm({
      ...form,
      NUMCENS: e.target.value.replace(/\D/g, ""),
    })
  }
  onBlur={async () => {
    if (!form.NUMCENS) return;
  
    const { data } = await supabase
      .from("SOCIOS")
      .select("NUMCENS")
      .eq("NUMCENS", Number(form.NUMCENS))
      .maybeSingle();
  
    if (data) {
      setError("Ya existe un socio con ese NUMCENS");
    } else {
      setError(null);
    }
  }}
/>
              </Campo>

              <Campo label="Código JCF">
                <input
                  className={inputClass}
                  value={form.CODJCF}
                  onChange={(e) =>
                    setForm({ ...form, CODJCF: e.target.value })
                  }
                />
              </Campo>

              <Campo label="Fecha alta">
                <input
                  type="date"
                  className={inputClass}
                  value={form.FechaPrimerAlta}
                  onChange={(e) =>
                    setForm({ ...form, FechaPrimerAlta: e.target.value })
                  }
                />
              </Campo>

              <Campo label="Nombre">
                <input
                  required
                  className={inputClass}
                  value={form.Nombre}
                  onChange={(e) =>
                    setForm({ ...form, Nombre: e.target.value })
                  }
                />
              </Campo>

              <Campo label="Apellidos">
                <input
                  required
                  className={inputClass}
                  value={form.Apellidos}
                  onChange={(e) =>
                    setForm({ ...form, Apellidos: e.target.value })
                  }
                />
              </Campo>

              <Campo label="NIF">
                <input
                  className={inputClass}
                  value={form.NIF}
                  onChange={(e) => setForm({ ...form, NIF: e.target.value })}
                />
              </Campo>

              <Campo label="Comisión">
                <select
                  className={inputClass}
                  value={form.Comision}
                  onChange={(e) =>
                    setForm({ ...form, Comision: e.target.value })
                  }
                >
                  <option value="MAY">MAY</option>
                  <option value="INF">INF</option>
                </select>
              </Campo>

              <Campo label="Sexo">
                <select
                  className={inputClass}
                  value={form.SEXE}
                  onChange={(e) => setForm({ ...form, SEXE: e.target.value })}
                >
                  <option value="H">H</option>
                  <option value="M">M</option>
                </select>
              </Campo>

              <Campo label="Fecha nacimiento">
                <input
                  type="date"
                  className={inputClass}
                  value={form.FechaNacimiento}
                  onChange={(e) =>
                    setForm({ ...form, FechaNacimiento: e.target.value })
                  }
                />
              </Campo>

              <Campo label="Dirección">
                <input
                  className={inputClass}
                  value={form.Direccion}
                  onChange={(e) =>
                    setForm({ ...form, Direccion: e.target.value })
                  }
                />
              </Campo>

              <Campo label="Código postal">
                <input
                  className={inputClass}
                  value={form.CodigoPostal}
                  onChange={(e) =>
                    setForm({ ...form, CodigoPostal: e.target.value })
                  }
                />
              </Campo>

              <Campo label="Ciudad">
                <input
                  className={inputClass}
                  value={form.Ciudad}
                  onChange={(e) =>
                    setForm({ ...form, Ciudad: e.target.value })
                  }
                />
              </Campo>

              <Campo label="Teléfono">
                <input
                  className={inputClass}
                  value={form.Telefono1}
                  onChange={(e) =>
                    setForm({ ...form, Telefono1: e.target.value })
                  }
                />
              </Campo>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-zinc-200 pt-4">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardando}
                className="bg-red-900 px-5 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Crear socio"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
        {label}
      </label>

      {children}
    </div>
  );
}