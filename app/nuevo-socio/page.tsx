"use client";

import { useEffect, useState } from "react";
import { normalizarTexto } from "@/lib/texto";
import { createBrowserClient } from "@supabase/ssr";
import Sidebar from "../components/Sidebar";
import { useRouter } from "next/navigation";

// Mismo cliente de sesión por cookies que app/login/page.tsx.
// Cambio aislado: no modifica lib/supabase.ts ni otras pantallas.
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function limpiarNif(nif: string) {
  return nif.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

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

  useEffect(() => {
    async function cargarSiguienteNumcens() {
      const { data, error } = await supabase
        .from("SOCIOS")
        .select("NUMCENS")
        .order("NUMCENS", { ascending: false })
        .limit(1)
        .maybeSingle();
  
      if (error) {
        setError(error.message);
        return;
      }
  
      if (data?.NUMCENS) {
        setForm((actual) => ({
          ...actual,
          NUMCENS: String(Number(data.NUMCENS) + 1),
        }));
      }
    }
  
    cargarSiguienteNumcens();
  }, []);

  const [ejercicioActivo, setEjercicioActivo] = useState<number | null>(null);
  const [tiposCuota, setTiposCuota] = useState<any[]>([]);
  const [tipoCuota, setTipoCuota] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [numeroPlazos, setNumeroPlazos] = useState(10);
  const [pagador, setPagador] = useState("");
  const [busquedaPagador, setBusquedaPagador] = useState("");
  const [pagadores, setPagadores] = useState<any[]>([]);
  const [buscarPagadorAbierto, setBuscarPagadorAbierto] = useState(false);
  const [avisoEconomico, setAvisoEconomico] = useState("");
  const [familias, setFamilias] = useState<any[]>([]);
  const [idFamilia, setIdFamilia] = useState<number | null>(null);
  const [busquedaFamilia, setBusquedaFamilia] = useState("");
  const [buscarFamiliaAbierto, setBuscarFamiliaAbierto] = useState(false);
  const [altaIniciada, setAltaIniciada] = useState(false);

  useEffect(() => {
    async function cargarConfiguracion() {
      const { data: ej, error: errorEj } = await supabase
        .from("EJERCICIOS").select("Ejercicio").eq("Activo", true).maybeSingle();
      if (errorEj || !ej?.Ejercicio) {
        setError(errorEj?.message || "No hay ejercicio activo configurado.");
        return;
      }
      const year = Number(ej.Ejercicio);
      setEjercicioActivo(year);
      const [tarifas, personas, familiasResult] = await Promise.all([
        supabase.from("TIPOS_CUOTA").select("IDCuota, Descripcion, Importe")
          .eq("Ejercicio", year).order("Descripcion", { ascending: true }),
        supabase.from("SOCIOS").select("NUMCENS, Nombre, Apellidos")
          .order("NUMCENS", { ascending: true }).range(0, 9999),
        supabase.from("FAMILIAS")
          .select("ID_Familia, Nombre_Familia")
          .order("Nombre_Familia", { ascending: true }).range(0, 9999),
      ]);
      if (tarifas.error || personas.error || familiasResult.error) {
        setError(tarifas.error?.message || personas.error?.message || familiasResult.error?.message || "No se pudo cargar la configuración");
        return;
      }
      setTiposCuota(tarifas.data || []);
      setPagadores(personas.data || []);
      setFamilias(familiasResult.data || []);
    }
    cargarConfiguracion();
  }, []);

  const coincidenciasPagador = busquedaPagador.trim()
    ? pagadores.filter((s) => normalizarTexto(
        `${s.NUMCENS} ${s.Nombre || ""} ${s.Apellidos || ""}`
      ).includes(normalizarTexto(busquedaPagador.trim()))).slice(0, 15)
    : [];

  const coincidenciasFamilia = busquedaFamilia.trim()
    ? familias.filter((f) => normalizarTexto(
        `${f.Nombre_Familia || ""} ${f.ID_Familia}`
      ).includes(normalizarTexto(busquedaFamilia.trim()))).slice(0, 12)
    : [];

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [avisoNif, setAvisoNif] = useState<any | null>(null);
const [continuarConNifDuplicado, setContinuarConNifDuplicado] = useState(false);

async function comprobarNifDuplicado(nif: string) {
  const nifLimpio = limpiarNif(nif);

  setContinuarConNifDuplicado(false);
  setAvisoNif(null);

  if (!nifLimpio || nifLimpio.startsWith("FN")) return;

  const { data, error } = await supabase
    .from("SOCIOS")
    .select("NUMCENS, Nombre, Apellidos, Estado, NIF")
    .neq("NIF", null);

  if (error) return;

  const encontrado = (data || []).find(
    (socio: any) => limpiarNif(socio.NIF || "") === nifLimpio
  );

  if (encontrado) {
    setAvisoNif(encontrado);
  }
}

  async function crearSocio(e: React.FormEvent) {
    e.preventDefault();
    if (guardando || altaIniciada) return;
    setError(null);
    setAvisoEconomico("");

    const numcens = Number(form.NUMCENS);
    if (!Number.isSafeInteger(numcens) || numcens <= 0) {
      setError("Introduce un NUMCENS válido.");
      return;
    }
    if (!ejercicioActivo || !tipoCuota) {
      setError("Selecciona la tarifa del ejercicio activo.");
      return;
    }
    if (!form.FechaNacimiento) {
      setError("La fecha de nacimiento es necesaria para calcular la cuota.");
      return;
    }
    if (busquedaFamilia.trim() && idFamilia === null) {
      setError("Selecciona una familia de la lista o deja la búsqueda vacía.");
      return;
    }
    if (busquedaPagador.trim() && !pagador) {
      setError("Selecciona un pagador de los resultados o deja la búsqueda vacía.");
      return;
    }

    setGuardando(true);
    try {
      const nifLimpio = limpiarNif(form.NIF);
      if (nifLimpio && !nifLimpio.startsWith("FN") && !continuarConNifDuplicado) {
        const { data: sociosConNif, error: errorNif } = await supabase
          .from("SOCIOS")
          .select("NUMCENS, Nombre, Apellidos, Estado, NIF")
          .neq("NIF", null);
        if (errorNif) throw new Error("No se pudo comprobar el NIF: " + errorNif.message);
        const socioDuplicado = (sociosConNif || []).find(
          (socio: any) => limpiarNif(socio.NIF || "") === nifLimpio
        );
        if (socioDuplicado) {
          setAvisoNif(socioDuplicado);
          setError("Ya existe un socio con ese NIF. Revisa el aviso y pulsa 'Continuar igualmente' si deseas crearlo.");
          return;
        }
      }

      // UNA llamada RPC, UNA transacción. Si algún paso falla no queda un alta parcial.
      const { data, error: errorAlta } = await (supabase as any).rpc(
        "alta_socio_completa",
        {
          p_datos: {
            NUMCENS: numcens,
            Ejercicio: ejercicioActivo,
            IDCuota: tipoCuota,
            ID_Familia: idFamilia,
            NUMCENS_Pagador: pagador ? Number(pagador) : numcens,
            Metodo: metodoPago,
            NumeroPlazos: metodoPago === "Banco" ? numeroPlazos : 1,
            FechaPrimerAlta: form.FechaPrimerAlta,
            Nombre: form.Nombre,
            Apellidos: form.Apellidos,
            CODJCF: form.CODJCF || null,
            Comision: form.Comision,
            SEXE: form.SEXE,
            Telefono1: form.Telefono1 || null,
            Ciudad: form.Ciudad || null,
            Direccion: form.Direccion || null,
            CodigoPostal: form.CodigoPostal || null,
            FechaNacimiento: form.FechaNacimiento,
            NIF: form.NIF || null,
          },
        }
      );
      if (errorAlta) throw new Error(errorAlta.message);
      if (Number(data) !== numcens) throw new Error("No se recibió confirmación correcta del alta.");

      setAltaIniciada(true);
      router.push(`/socios/${numcens}/editar`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "No se ha podido crear el socio.");
    } finally {
      setGuardando(false);
    }
  }

  const inputClass =
    "w-full min-w-0 border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-red-900";
  const labelClass =
    "mb-0.5 block text-[11px] font-medium uppercase text-zinc-500";

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <div className="min-w-0 flex-1 p-3 md:p-4">
        <main className="mx-auto max-w-7xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-l-4 border-red-900 px-4 py-2">
            <h1 className="text-xl font-bold text-zinc-900">Nuevo socio</h1>
            <p className="text-xs text-zinc-600">Crear un nuevo socio</p>
          </div>

          {avisoEconomico && <div className="mx-6 mt-4 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{avisoEconomico}</div>}
          {error && (
            <p className="mx-6 mt-4 bg-red-50 p-3 text-sm text-red-700">
              Error: {error}
            </p>
          )}

          <form onSubmit={crearSocio} className="p-3 md:p-4">
            <div className="grid gap-x-3 gap-y-2 md:grid-cols-4">
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
    onChange={(e) => {
      setForm({ ...form, NIF: e.target.value });
      setAvisoNif(null);
      setContinuarConNifDuplicado(false);
    }}
    onBlur={() => comprobarNifDuplicado(form.NIF)}
  />

  {avisoNif && (
    <div className="mt-2 border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
      <p className="font-semibold">
        ⚠️ Ya existe un socio con este NIF
      </p>

      <p className="mt-1">
        NUMCENS {avisoNif.NUMCENS} · {avisoNif.Apellidos}, {avisoNif.Nombre}
      </p>

      <p>
        Estado: {avisoNif.Estado || "-"}
      </p>

      <button
        type="button"
        onClick={() => {
          setContinuarConNifDuplicado(true);
          setError(null);
        }}
        className="mt-2 border border-amber-500 bg-white px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
      >
        Continuar igualmente
      </button>
    </div>
  )}
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
              <div className="relative md:col-span-2">
                <label className="mb-0.5 block text-[11px] font-medium uppercase text-zinc-500">Familia (opcional)</label>
                <input
                  className={inputClass}
                  value={busquedaFamilia}
                  onChange={(e) => {
                    setBusquedaFamilia(e.target.value);
                    setIdFamilia(null);
                    setBuscarFamiliaAbierto(true);
                  }}
                  onFocus={() => setBuscarFamiliaAbierto(true)}
                  placeholder="Buscar por nombre de familia..."
                  autoComplete="off"
                />
                {buscarFamiliaAbierto && busquedaFamilia.trim() && (
                  <div className="absolute z-50 mt-1 max-h-40 w-full overflow-y-auto border border-zinc-200 bg-white shadow-lg">
                    {coincidenciasFamilia.map((f) => (
                      <button key={f.ID_Familia} type="button"
                        onClick={() => {
                          setIdFamilia(Number(f.ID_Familia));
                          setBusquedaFamilia(`${f.Nombre_Familia} · ID ${f.ID_Familia}`);
                          setBuscarFamiliaAbierto(false);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50">
                        {f.Nombre_Familia} · ID {f.ID_Familia}
                      </button>
                    ))}
                    {!coincidenciasFamilia.length && <p className="p-2 text-sm text-zinc-500">Sin coincidencias</p>}
                  </div>
                )}
                <p className="text-[11px] text-zinc-500">{idFamilia !== null ? `Familia ID ${idFamilia} seleccionada` : "Vacío = sin familia"}</p>
              </div>
            </div>

            <section className="mt-3 border-t border-zinc-200 pt-3">
              <h2 className="mb-1 text-sm font-semibold text-zinc-900">Cuota y forma de pago</h2>
              <p className="mb-2 text-xs text-zinc-500">Ejercicio {ejercicioActivo ?? "sin cargar"}. Si el pagador es el nuevo socio, deja la búsqueda vacía.</p>
              <div className="grid gap-x-3 gap-y-2 md:grid-cols-4">
                <Campo label="Tarifa">
                  <select required className={inputClass} value={tipoCuota}
                    onChange={(e) => setTipoCuota(e.target.value)}>
                    <option value="">Seleccionar tarifa...</option>
                    {tiposCuota.map((t) => (
                      <option key={String(t.IDCuota)} value={String(t.IDCuota)}>
                        {t.Descripcion || t.IDCuota} · {Number(t.Importe || 0).toFixed(2)} €
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Forma de pago">
                  <select className={inputClass} value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                    <option value="Banco">Banco</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </Campo>
                {metodoPago === "Banco" && <Campo label="Número de plazos">
                  <select className={inputClass} value={numeroPlazos} onChange={(e) => setNumeroPlazos(Number(e.target.value))}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Campo>}
                <div className="md:col-span-2">
                  <label className="mb-0.5 block text-[11px] font-medium uppercase text-zinc-500">Pagador</label>
                  <p className="mb-2 text-xs text-zinc-500">{pagador ? `Seleccionado: socio nº ${pagador}` : "El propio socio"}</p>
                  <div className="relative">
                    <input className={inputClass} placeholder="Buscar otro socio por nombre, apellidos o número..."
                      autoComplete="off" value={busquedaPagador}
                      onChange={(e) => { setBusquedaPagador(e.target.value); setPagador(""); setBuscarPagadorAbierto(true); }}
                    />
                    {buscarPagadorAbierto && busquedaPagador.trim() && (
                      <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto border border-zinc-200 bg-white shadow-lg">
                        {coincidenciasPagador.map((s) => (
                          <button type="button" key={s.NUMCENS}
                            onClick={() => {
                              setPagador(String(s.NUMCENS));
                              setBusquedaPagador(`${s.NUMCENS} · ${s.Nombre} ${s.Apellidos}`);
                              setBuscarPagadorAbierto(false);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50">
                            {s.NUMCENS} · {s.Nombre} {s.Apellidos}
                          </button>
                        ))}
                        {coincidenciasPagador.length === 0 && <p className="p-3 text-sm text-zinc-500">Sin coincidencias</p>}
                      </div>
                    )}
                  </div>
                  {pagador && <button type="button" onClick={() => { setPagador(""); setBusquedaPagador(""); }}
                    className="mt-2 text-xs text-red-900 hover:underline">Paga el propio socio</button>}
                </div>
              </div>
            </section>

            <div className="mt-3 flex justify-end gap-3 border-t border-zinc-200 pt-3">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardando || altaIniciada}
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
      <label className="mb-0.5 block text-[11px] font-medium uppercase text-zinc-500">
        {label}
      </label>

      {children}
    </div>
  );
}