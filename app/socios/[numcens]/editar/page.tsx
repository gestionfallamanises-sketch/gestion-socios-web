"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import { supabase } from "../../../../lib/supabase";

export default function EditarSocioPage() {
  const params = useParams();
  const router = useRouter();
  const numcens = params.numcens as string;

  const [socio, setSocio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarSocio() {
      const { data, error } = await supabase
        .from("SOCIOS")
        .select("*")
        .eq("NUMCENS", Number(numcens))
        .single();

      if (error) {
        setError(error.message);
      } else {
        setSocio(data);
      }

      setLoading(false);
    }

    cargarSocio();
  }, [numcens]);

  function cambiarCampo(campo: string, valor: any) {
    setSocio((actual: any) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function guardarCambios(e: React.FormEvent) {
    e.preventDefault();

    setGuardando(true);
    setError(null);

    const { error } = await supabase
      .from("SOCIOS")
      .update({
        Nombre: socio.Nombre,
        Apellidos: socio.Apellidos,
        "Teléfono 1": socio["Teléfono 1"],
        Dirección: socio.Dirección,
        Ciudad: socio.Ciudad,
        "Código Postal": socio["Código Postal"],
        Comision: socio.Comision,
        SEXE: socio.SEXE,
        ConLoteria: socio.ConLoteria,
EsBanda: socio.EsBanda,
CARREG: socio.CARREG,
PapeletasFalla: Number(socio.PapeletasFalla || 0),
PapeletasVirgen: Number(socio.PapeletasVirgen || 0),
PapeletasNavidad: Number(socio.PapeletasNavidad || 0),
PapeletasNino: Number(socio.PapeletasNino || 0),
      })
      .eq("NUMCENS", Number(numcens));

    setGuardando(false);

    if (error) {
      setError(error.message);
      setGuardando(false);
      return;
    }

    const { error: errorRecalculo } = await supabase.rpc(
      "generar_actualizar_cuotas_completo",
      {
        p_ejercicio: 2027,
      }
    );
    
    if (errorRecalculo) {
      setGuardando(false);
      setError(errorRecalculo.message);
      return;
    }

    router.push(`/socios/${numcens}`);
  }

  if (loading) {
    return <div className="p-10">Cargando socio...</div>;
  }

  if (!socio) {
    return <div className="p-10">Socio no encontrado</div>;
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href={`/socios/${numcens}`}
            className="mb-6 inline-block text-sm font-medium text-red-900 hover:text-red-950"
          >
            ← Volver a ficha
          </Link>

          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900">
                    Editar socio
                  </h1>

                  <p className="mt-2 text-sm text-zinc-600">
                    {socio.Apellidos}, {socio.Nombre} · NUMCENS {socio.NUMCENS}
                  </p>
                </div>

                <button
                  type="submit"
                  form="form-editar-socio"
                  disabled={guardando}
                  className="bg-red-900 px-5 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Error: {error}
            </div>
          )}

          <form
            id="form-editar-socio"
            onSubmit={guardarCambios}
            className="space-y-8"
          >
            <section className="border border-zinc-200 bg-white">
              <div className="bg-zinc-100 px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Datos personales
                </h2>
              </div>

              <div className="grid gap-4 p-4 md:grid-cols-6">
                <CampoTexto
                  label="Nombre"
                  value={socio.Nombre || ""}
                  onChange={(valor) => cambiarCampo("Nombre", valor)}
                />

                <CampoTexto
                  label="Apellidos"
                  value={socio.Apellidos || ""}
                  onChange={(valor) => cambiarCampo("Apellidos", valor)}
                />

                <CampoTexto
                  label="Teléfono"
                  value={socio["Teléfono 1"] || ""}
                  onChange={(valor) => cambiarCampo("Teléfono 1", valor)}
                />

                <CampoTexto
                  label="Dirección"
                  value={socio.Dirección || ""}
                  onChange={(valor) => cambiarCampo("Dirección", valor)}
                />

                <CampoTexto
                  label="Ciudad"
                  value={socio.Ciudad || ""}
                  onChange={(valor) => cambiarCampo("Ciudad", valor)}
                />

                <CampoTexto
                  label="Código postal"
                  value={socio["Código Postal"] || ""}
                  onChange={(valor) =>
                    cambiarCampo("Código Postal", valor)
                  }
                />
              </div>
            </section>

            <section className="border border-zinc-200 bg-white">
              <div className="bg-zinc-100 px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Configuración del socio
                </h2>
              </div>

              <div className="grid gap-4 p-4 md:grid-cols-5">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
                    Comisión
                  </label>

                  <select
                    value={socio.Comision || ""}
                    onChange={(e) =>
                      cambiarCampo("Comision", e.target.value)
                    }
                    className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
                  >
                    <option value="">-</option>
                    <option value="MAY">MAY</option>
                    <option value="INF">INF</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
                    Sexo
                  </label>

                  <select
                    value={socio.SEXE || ""}
                    onChange={(e) =>
                      cambiarCampo("SEXE", e.target.value)
                    }
                    className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
                  >
                    <option value="">-</option>
                    <option value="H">H</option>
                    <option value="M">M</option>
                  </select>
                </div>

                <div>
  <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
    Banda
  </label>

  <select
    value={socio.EsBanda ? "true" : "false"}
    onChange={(e) =>
      cambiarCampo(
        "EsBanda",
        e.target.value === "true"
      )
    }
    className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
  >
    <option value="false">No</option>
    <option value="true">Sí</option>
  </select>
</div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
                    Lotería
                  </label>

                  <select
                    value={socio.ConLoteria ? "true" : "false"}
                    onChange={(e) =>
                      cambiarCampo(
                        "ConLoteria",
                        e.target.value === "true"
                      )
                    }
                    className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
                  >
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                </div>

                <CampoTexto
  label="Cargo"
  value={socio.CARREG || ""}
  onChange={(valor) =>
    cambiarCampo("CARREG", valor)
  }
/>

<CampoTexto
  label="Papeletas falla"
  value={String(socio.PapeletasFalla || 0)}
  onChange={(valor) => cambiarCampo("PapeletasFalla", valor)}
/>

<CampoTexto
  label="Papeletas virgen"
  value={String(socio.PapeletasVirgen || 0)}
  onChange={(valor) => cambiarCampo("PapeletasVirgen", valor)}
/>

<CampoTexto
  label="Papeletas Navidad"
  value={String(socio.PapeletasNavidad || 0)}
  onChange={(valor) => cambiarCampo("PapeletasNavidad", valor)}
/>

<CampoTexto
  label="Papeletas niño"
  value={String(socio.PapeletasNino || 0)}
  onChange={(valor) => cambiarCampo("PapeletasNino", valor)}
/>
              </div>
            </section>

            <div className="flex justify-end gap-3">
              <Link
                href={`/socios/${numcens}`}
                className="border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={guardando}
                className="bg-red-900 px-5 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
      />
    </div>
  );
}