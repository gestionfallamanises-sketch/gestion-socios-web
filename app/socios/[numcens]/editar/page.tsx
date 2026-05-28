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
  const [iban, setIban] = useState("");
const [titularCuenta, setTitularCuenta] = useState("");
const [nifTitularCuenta, setNifTitularCuenta] = useState("");
const [metodo, setMetodo] = useState("Efectivo");
const [numeroPlazos, setNumeroPlazos] = useState(1);
const [observacionesPago, setObservacionesPago] = useState("");
const [pagador, setPagador] = useState("");
const [busquedaPagador, setBusquedaPagador] = useState("");
const [socios, setSocios] = useState<any[]>([]);

  useEffect(() => {
    async function cargarSocio() {
      const { data, error } = await supabase
  .from("SOCIOS")
  .select(`
    *,
    FAMILIAS (
      Titular_NUMCENS
    )
  `)
  .eq("NUMCENS", Number(numcens))
  .single();

if (error) {
  setError(error.message);
} else {
  setSocio({
    ...data,
    titularNumcens:
      (data as any)?.FAMILIAS?.Titular_NUMCENS || null,
  });
}

      const { data: listaSocios } = await supabase
  .from("SOCIOS")
  .select("NUMCENS, Nombre, Apellidos")
  .order("Apellidos", { ascending: true });

setSocios(listaSocios || []);

      const { data: banco } = await supabase
      .from("DATOS_BANCARIOS")
      .select("*")
      .eq("NUMCENS", Number(numcens))
      .maybeSingle();
    
    if (banco) {
      setIban(banco.IBAN || "");
      setTitularCuenta(banco.TitularCuenta || "");
      setNifTitularCuenta(banco.NIF_TitularCuenta || "");
    }
    
    const { data: formaPago } = await supabase
      .from("FORMAS_PAGO_SOCIOS")
      .select("*")
      .eq("NUMCENS", Number(numcens))
      .eq("Activo", true)
      .maybeSingle();
    
    if (formaPago) {
      setMetodo(formaPago.Metodo || "Efectivo");
      setNumeroPlazos(formaPago.NumeroPlazos || 1);
      setObservacionesPago(formaPago.Observaciones || "");
      setPagador(
        formaPago.NUMCENS_Pagador &&
        Number(formaPago.NUMCENS_Pagador) !== Number(numcens)
          ? String(formaPago.NUMCENS_Pagador)
          : ""
      );
    }

      setLoading(false);
    }

    cargarSocio();
  }, [numcens]);

  const isBaja = socio?.Estado?.toLowerCase() === "baja";

  function cambiarCampo(campo: string, valor: any) {
    setSocio((actual: any) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function guardarCambios(e: React.FormEvent) {
    e.preventDefault();

    if (isBaja) {
      setError("Este socio está dado de baja. No se pueden editar sus datos.");
      return;
    }

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

    const { data: bancoExistente, error: errorBancoBuscar } = await supabase
    .from("DATOS_BANCARIOS")
    .select("*")
    .eq("NUMCENS", Number(numcens))
    .maybeSingle();
  
  if (errorBancoBuscar) {
    setGuardando(false);
    setError(errorBancoBuscar.message);
    return;
  }
  
  if (bancoExistente) {
    const { error: errorBanco } = await supabase
      .from("DATOS_BANCARIOS")
      .update({
        IBAN: iban,
        TitularCuenta: titularCuenta || null,
        NIF_TitularCuenta: nifTitularCuenta || null,
      })
      .eq("NUMCENS", Number(numcens));
  
    if (errorBanco) {
      setGuardando(false);
      setError(errorBanco.message);
      return;
    }
  } else {
    const { error: errorBanco } = await supabase
      .from("DATOS_BANCARIOS")
      .insert({
        NUMCENS: Number(numcens),
        IBAN: iban,
        TitularCuenta: titularCuenta || null,
        NIF_TitularCuenta: nifTitularCuenta || null,
      });
  
    if (errorBanco) {
      setGuardando(false);
      setError(errorBanco.message);
      return;
    }
  }
  
  await supabase
    .from("FORMAS_PAGO_SOCIOS")
    .update({ Activo: false })
    .eq("NUMCENS", Number(numcens));
  
  const { error: errorFormaPago } = await supabase
    .from("FORMAS_PAGO_SOCIOS")
    .insert({
      NUMCENS: Number(numcens),
      Metodo: metodo,
      NumeroPlazos: numeroPlazos,
      Fraccionado: numeroPlazos > 1,
      Activo: true,
      NUMCENS_Pagador: Number(
        pagador ||
          socio?.titularNumcens ||
          numcens
      ),
      Observaciones: observacionesPago || null,
    });
  
    if (errorFormaPago) {
      setGuardando(false);
      setError(errorFormaPago.message);
      return;
    }
    
    const hoy = new Date();

const ejercicioActual =
  hoy.getMonth() >= 3
    ? hoy.getFullYear() + 1
    : hoy.getFullYear();

const { error: errorRecalculo } = await (supabase as any).rpc(
  "generar_actualizar_cuotas_completo",
  {
    p_ejercicio: ejercicioActual,
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
  disabled={guardando || isBaja}
  className={`px-5 py-2 text-sm font-medium text-white ${
    isBaja
      ? "cursor-not-allowed bg-zinc-400"
      : "bg-red-900 hover:bg-red-950"
  } disabled:opacity-50`}
>
  {isBaja
    ? "Socio dado de baja"
    : guardando
    ? "Guardando..."
    : "Guardar cambios"}
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
  <fieldset
    disabled={isBaja}
    className={isBaja ? "opacity-50 grayscale" : ""}
  >
            <fieldset disabled={isBaja} className={isBaja ? "opacity-50 grayscale" : ""}>

            </fieldset>
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

            <section className="border border-zinc-200 bg-white">
            <div className="bg-zinc-100 px-4 py-3">
  <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
    Datos de pago
  </h2>
</div>

<div className="grid gap-4 p-4 md:grid-cols-3">

  <div>
    <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
      Método de pago
    </label>

    <select
      value={metodo}
      onChange={(e) => setMetodo(e.target.value)}
      className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
    >
      <option value="Efectivo">Efectivo</option>
      <option value="Banco">Banco</option>
    </select>
  </div>

  <CampoTexto
    label="IBAN"
    value={iban}
    onChange={(valor) => setIban(valor)}
  />

  <div>
    <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
      Número de plazos
    </label>

    <select
      value={numeroPlazos}
      onChange={(e) => setNumeroPlazos(Number(e.target.value))}
      className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <option key={n} value={n}>
          {n} plazo{n > 1 ? "s" : ""}
        </option>
      ))}
    </select>
  </div>

  <CampoTexto
    label="Titular cuenta"
    value={titularCuenta}
    onChange={(valor) => setTitularCuenta(valor)}
  />

  <CampoTexto
    label="NIF titular"
    value={nifTitularCuenta}
    onChange={(valor) => setNifTitularCuenta(valor)}
  />

<div>
  <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
    Pagador cuota
  </label>

  <div className="relative">
  
      <input
      value={busquedaPagador}
      onChange={(e) => setBusquedaPagador(e.target.value)}
      disabled={isBaja}
      placeholder="Buscar pagador..."
      className={`w-full border px-3 py-2 text-sm outline-none ${
        isBaja
          ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-500"
          : "border-zinc-300 bg-white focus:border-red-900"
      }`}
    />

    {busquedaPagador && (
      <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto border border-zinc-200 bg-white shadow-lg">

        {socios
          .filter((s) =>
            `${s.NUMCENS} ${s.Apellidos || ""} ${s.Nombre || ""}`
              .toLowerCase()
              .includes(busquedaPagador.toLowerCase())
          )
          .slice(0, 10)
          .map((s) => (
            <button
  key={s.NUMCENS}
  type="button"
  disabled={isBaja}
  onClick={() => {
    if (isBaja) return;
    setPagador(String(s.NUMCENS));
    setBusquedaPagador(
      `${s.Apellidos}, ${s.Nombre} · ${s.NUMCENS}`
    );
  }}
  className="block w-full border-b border-zinc-100 px-3 py-2 text-left text-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
>
              {s.Apellidos}, {s.Nombre} · {s.NUMCENS}
            </button>
          ))}

      </div>
    )}
  </div>
</div>

<CampoTexto
  label="Observaciones pago"
  value={observacionesPago}
  onChange={(valor) => setObservacionesPago(valor)}
  disabled={isBaja}
/>

</div>

<div className="grid gap-4 border-t border-zinc-200 p-4 md:grid-cols-3">

  <div>
    <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
      Tipo adeudo
    </label>

    <input
      value="RCUR"
      disabled
      className="w-full border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-600"
    />
  </div>

  <div>
    <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
      Fecha mandato
    </label>

    <input
      value={socio?.FechaPrimerAlta || "-"}
      disabled
      className="w-full border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-600"
    />
  </div>

  <div>
    <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
      Referencia mandato
    </label>

    <input
      value={`${pagador || socio?.NUMCENS}-2027`}
      disabled
      className="w-full border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-600"
    />
  </div>

</div>

</section>

</fieldset>

            <div className="flex justify-end gap-3">
              <Link
                href={`/socios/${numcens}`}
                className="border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancelar
                </Link>

              <button
  type="submit"
  disabled={guardando || isBaja}
  className={`px-5 py-2 text-sm font-medium text-white ${
    isBaja
      ? "cursor-not-allowed bg-zinc-400"
      : "bg-red-900 hover:bg-red-950"
  } disabled:opacity-50`}
>
  {isBaja ? "Socio dado de baja" : guardando ? "Guardando..." : "Guardar cambios"}
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
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
      />
    </div>
  );
}