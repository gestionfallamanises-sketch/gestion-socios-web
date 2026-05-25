"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";

export default function PagoSocioPage() {
  const params = useParams();

  const numcens = params.numcens as string;

  const [socio, setSocio] = useState<any>(null);
  const [familia, setFamilia] = useState<any>(null);

  const [iban, setIban] = useState("");
  const [titularCuenta, setTitularCuenta] = useState("");
const [nifTitularCuenta, setNifTitularCuenta] = useState("");
  const [metodo, setMetodo] = useState("Efectivo");
  const [numeroPlazos, setNumeroPlazos] = useState(1);
  const [observaciones, setObservaciones] = useState("");
  const [pagador, setPagador] = useState("");
  const [busquedaPagador, setBusquedaPagador] = useState("");
const [socios, setSocios] = useState<any[]>([]);
const [pagadoresExternos, setPagadoresExternos] = useState<any[]>([]);

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const { data: socioData } = await supabase
      .from("SOCIOS")
      .select("*")
      .eq("NUMCENS", Number(numcens))
      .single();

    setSocio(socioData);
    if (socioData?.ID_Familia) {
      const { data: familiaData } = await supabase
        .from("FAMILIAS")
        .select("*")
        .eq("ID_Familia", socioData.ID_Familia)
        .maybeSingle();
    
      setFamilia(familiaData);
    }

    const { data: listaSocios } = await supabase
  .from("SOCIOS")
  .select("NUMCENS, Nombre, Apellidos")
  .order("Apellidos", { ascending: true });

setSocios(listaSocios || []);

const { data: listaExternos } = await supabase
  .from("PAGADORES_EXTERNOS")
  .select("*")
  .eq("Activo", true)
  .order("Apellidos", { ascending: true });

setPagadoresExternos(listaExternos || []);

    const { data: formaPago } = await supabase
      .from("FORMAS_PAGO_SOCIOS")
      .select("*")
      .eq("NUMCENS", Number(numcens))
      .eq("Activo", true)
      .maybeSingle();

      if (formaPago) {
        setMetodo(formaPago.Metodo || "EFECTIVO");
      
        setNumeroPlazos(
          formaPago.NumeroPlazos || 1
        );
      
        setObservaciones(
          formaPago.Observaciones || ""
        );
      
        setPagador(
          formaPago.IDPagadorExterno
            ? `externo-${formaPago.IDPagadorExterno}`
            : String(
                formaPago.NUMCENS_Pagador ||
                  socioData?.NUMCENS ||
                  ""
              )
        );
      }

      if (!formaPago) {
        if (socioData?.ID_Familia) {
          const { data: familiaData } = await supabase
            .from("FAMILIAS")
            .select("Titular_NUMCENS")
            .eq("ID_Familia", socioData.ID_Familia)
            .maybeSingle();
      
          setPagador(String(familiaData?.Titular_NUMCENS || socioData.NUMCENS));
        } else {
          setPagador(String(socioData.NUMCENS));
        }
      }

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
  }

  async function guardarDatos() {
    setGuardando(true);

    const esPagadorExterno = pagador.startsWith("externo-");

const idPagadorExterno = esPagadorExterno
  ? Number(pagador.replace("externo-", ""))
  : null;

const numcensPagador = esPagadorExterno
  ? null
  : Number(pagador);

    alert("Pagador seleccionado antes de guardar: " + pagador);
  
    const { data: bancoExistente, error: errorBancoBuscar } = await supabase
      .from("DATOS_BANCARIOS")
      .select("*")
      .eq("NUMCENS", Number(numcens))
      .maybeSingle();
  
    if (errorBancoBuscar) {
      setGuardando(false);
      alert(errorBancoBuscar.message);
      return;
    }
  
    if (bancoExistente) {
      const { error } = await supabase
  .from("DATOS_BANCARIOS")
  .update({
    IBAN: iban,
    TitularCuenta: titularCuenta || null,
    NIF_TitularCuenta: nifTitularCuenta || null,
  })
  .eq("NUMCENS", Number(numcens));
  
      if (error) {
        setGuardando(false);
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("DATOS_BANCARIOS")
        .insert({
          NUMCENS: Number(numcens),
          IBAN: iban,
          TitularCuenta: titularCuenta || null,
          NIF_TitularCuenta: nifTitularCuenta || null,
        });
  
      if (error) {
        setGuardando(false);
        alert(error.message);
        return;
      }
    }
  
    const { error: errorDesactivar } = await supabase
      .from("FORMAS_PAGO_SOCIOS")
      .update({ Activo: false })
      .eq("NUMCENS", Number(numcens));
  
    if (errorDesactivar) {
      setGuardando(false);
      alert(errorDesactivar.message);
      return;
    }
  
    const { error: errorFormaPago } = await supabase
    .from("FORMAS_PAGO_SOCIOS")
    .insert({
      NUMCENS: Number(numcens),
      Metodo: metodo,
      NumeroPlazos: numeroPlazos,
      Fraccionado: numeroPlazos > 1,
      Activo: true,
      NUMCENS_Pagador: numcensPagador,
IDPagadorExterno: idPagadorExterno,
      Observaciones: observaciones || null,
    });
  
    setGuardando(false);
  
    if (errorFormaPago) {
      alert(errorFormaPago.message);
      return;
    }
  
    const { error: errorPagador } = await supabase
  .from("CUOTAS_SOCIOS")
  .update({
    NUMCENS_Pagador: numcensPagador,
  })
  .eq("NUMCENS", Number(numcens))
  .eq("Ejercicio", 2027);

if (errorPagador) {
  alert(errorPagador.message);
  return;
}

await supabase.rpc("generar_actualizar_cuotas_completo", {
  p_ejercicio: 2027,
});

window.location.href = `/socios/${numcens}`;
  }
  
  const esMiembroNoTitular =
  Boolean(socio?.ID_Familia) &&
  Boolean(familia?.Titular_NUMCENS) &&
  Number(socio.NUMCENS) !== Number(familia.Titular_NUMCENS);

  function normalizar(texto: string) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }
  
  const sociosPagadorFiltrados = socios
    .filter((s) =>
      normalizar(`${s.NUMCENS} ${s.Apellidos || ""} ${s.Nombre || ""}`).includes(
        normalizar(busquedaPagador)
      )
    )
    .slice(0, 20);
  
  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-5xl">

          <Link
            href={`/socios/${numcens}`}
            className="mb-6 inline-block text-sm font-medium text-red-900 hover:text-red-950"
          >
            ← Volver a ficha socio
          </Link>

          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">

              <h1 className="text-2xl font-bold text-zinc-900">
                Datos de pago
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                {socio?.Apellidos},{" "}
                {socio?.Nombre}
              </p>

            </div>
          </section>

          {esMiembroNoTitular && (
  <section className="mb-6 border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
    <p className="font-semibold">
    Este socio pertenece a una familia. 
Por defecto hereda los datos de pago del titular, 
pero puedes configurar un pagador diferente si es necesario.
    </p>

    <p className="mt-1">
  Titular: {
    socios.find(
      (s) =>
        Number(s.NUMCENS) ===
        Number(familia?.Titular_NUMCENS)
    )
      ? `${
          socios.find(
            (s) =>
              Number(s.NUMCENS) ===
              Number(familia?.Titular_NUMCENS)
          )?.Apellidos || ""
        }, ${
          socios.find(
            (s) =>
              Number(s.NUMCENS) ===
              Number(familia?.Titular_NUMCENS)
          )?.Nombre || ""
        } · ${
          familia?.Titular_NUMCENS || ""
        }`
      : familia?.Titular_NUMCENS || "-"
  }
</p>
  </section>
  )}

<section className="border border-zinc-200 bg-white">

            <div className="bg-zinc-100 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Configuración económica
              </h2>
            </div>

            <div className="grid gap-6 p-6">
  <div className="grid gap-6 lg:grid-cols-3">

              <div>
                <label className="mb-2 block text-xs font-medium uppercase text-zinc-500">
                  Método de pago
                </label>

                <select
                  value={metodo}
                  onChange={(e) =>
                    setMetodo(e.target.value)
                  }
                  className="w-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-900"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Banco">Banco</option>
                </select>
              </div>
              <div>
  <label className="mb-2 block text-xs font-medium uppercase text-zinc-500">
    Titular cuenta
  </label>

  <input
    value={titularCuenta}
    onChange={(e) => setTitularCuenta(e.target.value)}
    className="w-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-900"
  />
</div>

<div>
  <label className="mb-2 block text-xs font-medium uppercase text-zinc-500">
    NIF titular cuenta
  </label>

  <input
    value={nifTitularCuenta}
    onChange={(e) => setNifTitularCuenta(e.target.value)}
    className="w-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-900"
  />
</div>

              <div>
  <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
    Pagador cuota
  </label>

  <div className="relative">
  <input
    value={busquedaPagador}
    onChange={(e) => setBusquedaPagador(e.target.value)}
    placeholder="Buscar pagador..."
    className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
  />

  {busquedaPagador && (
    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto border border-zinc-200 bg-white shadow-lg">
      {sociosPagadorFiltrados.map((s) => (
        <button
          key={s.NUMCENS}
          type="button"
          onClick={() => {
            setPagador(String(s.NUMCENS));
            setBusquedaPagador(`${s.Apellidos}, ${s.Nombre} · ${s.NUMCENS}`);
          }}
          className="block w-full border-b border-zinc-100 px-3 py-2 text-left text-sm hover:bg-red-50"
        >
          {s.Apellidos}, {s.Nombre} · {s.NUMCENS}
        </button>
      ))}
    </div>
  )}

  {pagador && (
    <p className="mt-1 text-xs text-zinc-500">
      Pagador seleccionado: {pagador}
    </p>
  )}
</div>
</div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase text-zinc-500">
                  Número de plazos
                </label>

                <select
                  value={numeroPlazos}
                  onChange={(e) =>
                    setNumeroPlazos(
                      Number(e.target.value)
                    )
                  }
                  className="w-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-900"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <option key={n} value={n}>
                      {n} plazo{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase text-zinc-500">
                  IBAN
                </label>

                <input
                  value={iban}
                  onChange={(e) =>
                    setIban(e.target.value)
                  }
                  className="w-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-900"
                />
              </div>

</div>
<div className="grid gap-4 border-t border-zinc-200 pt-4 md:grid-cols-4">
  <div>
    <label className="mb-1 block text-[11px] font-medium uppercase text-zinc-500">
      Tipo adeudo
    </label>

    <input
      value="RCUR"
      disabled
      className="w-full border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs text-zinc-600"
    />
  </div>

  <div>
    <label className="mb-1 block text-[11px] font-medium uppercase text-zinc-500">
      Fecha mandato
    </label>

    <input
      value={socio?.FechaPrimerAlta || "-"}
      disabled
      className="w-full border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs text-zinc-600"
    />
  </div>

  <div>
    <label className="mb-1 block text-[11px] font-medium uppercase text-zinc-500">
      Referencia mandato
    </label>

    <input
      value={`${pagador || socio?.NUMCENS}-2027`}
      disabled
      className="w-full border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs text-zinc-600"
    />
  </div>

  <div>
    <label className="mb-1 block text-[11px] font-medium uppercase text-zinc-500">
      Observaciones
    </label>

    <input
      value={observaciones}
      onChange={(e) =>
        setObservaciones(e.target.value)
      }
      className="w-full border border-zinc-300 bg-white px-3 py-2 text-xs outline-none focus:border-red-900"
    />
  </div>
</div>

            </div>

            <div className="flex justify-end border-t border-zinc-200 p-4">

              <button
                onClick={guardarDatos}
                disabled={guardando}
                className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar datos"}
              </button>

            </div>
          </section>
        </div>
      </main>
    </div>
  );
}