"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createBrowserClient } from "@supabase/ssr";
import LoteriaSocioDesplegable from "@/app/components/LoteriaSocioDesplegable";

type Objeto = Record<string, any>;
type Seccion = "personal" | "configuracion" | "pago";
type Props = {
  seccion: Seccion;
  numcens: number;
  estado: string;
  socio: Objeto;
  banco: Objeto | null;
  formaPago: Objeto | null;
  cuota?: Objeto | null;
  textoPagador?: string;
  pagadoresExtra?: Objeto[];
  loteria?: { falla: number; virgen: number; navidad: number; nino: number; responsable: string };
};

const texto = (v: unknown) => v == null ? "" : String(v);
const fecha = (v: unknown) => texto(v).slice(0, 10);
const esSi = (v: unknown) => v === true || v === 1 || ["true", "si", "sí", "1", "s"].includes(texto(v).trim().toLowerCase());
const campoClase = "w-full min-w-0 border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-red-900";
const boton = "bg-red-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50";

export default function EdicionFichaSocio({ seccion, numcens, estado, socio, banco, formaPago, cuota, textoPagador, pagadoresExtra = [], loteria }: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esBaja = texto(estado).toLowerCase() === "baja";
  const esBanco = texto(formaPago?.Metodo).toLowerCase() === "banco";

  const inicialPersonal = () => ({
    Nombre: texto(socio.Nombre), Apellidos: texto(socio.Apellidos),
    "FECHA de NACIMIENTO": fecha(socio["FECHA de NACIMIENTO"]),
    "Teléfono 1": texto(socio["Teléfono 1"]), "Teléfono 2": texto(socio["Teléfono 2"]),
    NIF: texto(socio.NIF), "Código Postal": texto(socio["Código Postal"]),
    Ciudad: texto(socio.Ciudad), Dirección: texto(socio.Dirección),
  });
  const inicialConfig = () => ({ Comision: texto(socio.Comision), SEXE: texto(socio.SEXE), CARREG: texto(socio.CARREG), EsBanda: esSi(socio.EsBanda), ConLoteria: esSi(socio.ConLoteria) });
  const inicialBanco = () => ({ IBAN: texto(banco?.IBAN), TitularCuenta: texto(banco?.TitularCuenta), NIF_TitularCuenta: texto(banco?.NIF_TitularCuenta) });
  const [personal, setPersonal] = useState(inicialPersonal);
  const [config, setConfig] = useState(inicialConfig);
  const [bancarios, setBancarios] = useState(inicialBanco);
  const [plazos, setPlazos] = useState(Number(formaPago?.NumeroPlazos) || 1);
  const [tarifas, setTarifas] = useState<Objeto[]>([]);
  const [tarifaElegida, setTarifaElegida] = useState(String(cuota?.IDCuota ?? ""));
  useEffect(() => {
    if (seccion !== "pago" || !cuota?.Ejercicio) return;
    let vigente = true;
    supabase.from("TIPOS_CUOTA")
      .select("IDCuota,Importe,Ejercicio")
      .eq("Ejercicio", cuota.Ejercicio)
      .order("IDCuota", {ascending:true})
      .then(({data,error}) => { if (vigente) { if (error) setError(error.message); else setTarifas(data || []); } });
    return () => {vigente = false};
  }, [seccion, cuota?.Ejercicio]);
  const [metodo, setMetodo] = useState<"Banco" | "Efectivo">(esBanco ? "Banco" : "Efectivo");
  type Extra = { ID?: number; TitularCuenta: string; IBAN: string; NIF_TitularCuenta: string; Porcentaje: number; Activo?: boolean };
  const nuevosExtras = (): Extra[] => pagadoresExtra.map(p => ({ ID: p.ID, TitularCuenta: texto(p.TitularCuenta), IBAN: texto(p.IBAN), NIF_TitularCuenta: texto(p.NIF_TitularCuenta), Porcentaje: Number(p.Porcentaje || 0) }));
  const [extras, setExtras] = useState<Extra[]>(nuevosExtras);
  const [eliminados, setEliminados] = useState<number[]>([]);
  const extrasCambiados = JSON.stringify(extras) !== JSON.stringify(nuevosExtras()) || eliminados.length > 0;
  const actualizarExtra = (i: number, campo: keyof Extra, valor: string | number) => setExtras(actual => actual.map((p,j)=>j===i?{...p,[campo]:valor}:p));


  function cancelar() {
    setPersonal(inicialPersonal()); setConfig(inicialConfig()); setBancarios(inicialBanco());
    setPlazos(Number(formaPago?.NumeroPlazos) || 1); setTarifaElegida(String(cuota?.IDCuota ?? "")); setMetodo(esBanco ? "Banco" : "Efectivo"); setExtras(nuevosExtras()); setEliminados([]);
    setError(null); setEditando(false);
  }
  // Cabecera gris y valor debajo, como en Gestión económica.
  function bloque(etiqueta: string, contenido: React.ReactNode) {
    return <div className="min-w-0 h-full border-b border-r border-zinc-200">
      <div className="bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase text-zinc-600">{etiqueta}</div>
      <div className="min-h-[30px] min-w-0 px-3 py-1 text-sm text-zinc-900 break-words">{contenido}</div>
    </div>;
  }
  function celda(etiqueta: string, valor: unknown, campo?: string, tipo: "personal" | "config" | "banco" = "personal", inputType = "text") {
    const mapa = tipo === "personal" ? personal : tipo === "config" ? config : bancarios;
    const setter = tipo === "personal" ? setPersonal : tipo === "config" ? setConfig : setBancarios;
    return <div key={etiqueta} className="min-w-0">{bloque(etiqueta,
      editando && campo ? <input aria-label={etiqueta} type={inputType} value={texto((mapa as Objeto)[campo])}
        onChange={e => setter((v: any) => ({ ...v, [campo]: e.target.value }))} className={campoClase}/>
        : (valor === "" || valor == null ? "-" : String(valor))
    )}</div>;
  }
  function cambios(original: Objeto, actual: Objeto): Objeto {
    const update: Objeto = {};
    for (const [key, val] of Object.entries(actual)) {
      if (texto(val) !== texto(original[key])) update[key] = texto(val).trim() || null;
    }
    return update;
  }
  async function guardar() {
    if (guardando) return;
    setGuardando(true); setError(null);
    try {
      if (seccion === "personal") {
        const update = cambios(inicialPersonal(), personal);
        if (Object.keys(update).length) {
          // Mantener el control de NIF duplicado, sin actualizar las otras secciones.
          if (Object.prototype.hasOwnProperty.call(update, "NIF") && update.NIF && !texto(update.NIF).toUpperCase().startsWith("FN")) {
            const nif = texto(update.NIF).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
            const {data, error: err} = await supabase.from("SOCIOS").select("NUMCENS,NIF").neq("NUMCENS", numcens);
            if (err) throw err;
            if ((data || []).some((s: any) => texto(s.NIF).replace(/[^A-Za-z0-9]/g, "").toUpperCase() === nif)) throw new Error("Ese NIF ya existe en otro socio.");
          }
          const {error: err} = await supabase.from("SOCIOS").update(update).eq("NUMCENS", numcens);
          if (err) throw err;
        }
      } else if (seccion === "configuracion") {
        const original = inicialConfig();
        const update: Objeto = cambios({ Comision: original.Comision, SEXE: original.SEXE, CARREG: original.CARREG }, { Comision: config.Comision, SEXE: config.SEXE, CARREG: config.CARREG });
        if (config.EsBanda !== original.EsBanda) update.EsBanda = config.EsBanda;
        if (config.ConLoteria !== original.ConLoteria) update.ConLoteria = config.ConLoteria;
        if (Object.keys(update).length) {
          const {error: err} = await supabase.from("SOCIOS").update(update).eq("NUMCENS", numcens);
          if (err) throw err;
        }
      } else {
        const update = cambios(inicialBanco(), bancarios);
        const cambioTarifa = tarifaElegida !== String(cuota?.IDCuota ?? "");
        const cambioMetodo = metodo.toLowerCase() !== texto(formaPago?.Metodo).trim().toLowerCase();
        const cambioPlazos = metodo === "Banco" && (cambioMetodo || plazos !== (Number(formaPago?.NumeroPlazos) || 1));

        // Los cambios económicos (tarifa, método y plazos) se guardan juntos en una transacción SQL.
        const cambioEconomico = cambioTarifa || cambioMetodo || cambioPlazos;
        if (cambioEconomico && (extrasCambiados || Object.keys(update).length)) {
          throw new Error("Guarda primero los datos bancarios o pagadores; tarifa, forma de pago y plazos se guardan juntos.");
        }
        if (extrasCambiados && Object.keys(update).length) {
          throw new Error("Guarda los datos bancarios y los pagadores especiales por separado.");
        }
        if (cambioEconomico) {
          if (!tarifas.some(t => String(t.IDCuota) === tarifaElegida)) {
            throw new Error("Selecciona una tarifa válida del ejercicio 2027.");
          }
          const auth = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
          const {error: err} = await auth.rpc("actualizar_tarifa_y_forma_pago_socio", {
            p_numcens: numcens,
            p_ejercicio: Number(cuota?.Ejercicio),
            p_idcuota: tarifaElegida,
            p_metodo: metodo,
            p_numero_plazos: metodo === "Efectivo" ? 1 : plazos,
          });
          if (err) throw err;
        }
        if (Object.keys(update).length > 0) {
          const consulta = banco
            ? supabase.from("DATOS_BANCARIOS").update(update).eq("NUMCENS", numcens)
            : supabase.from("DATOS_BANCARIOS").insert({ NUMCENS: numcens, ...update });
          const {error: err} = await consulta;
          if (err) throw err;
        }
        if (extrasCambiados) {
          if (extras.length > 2) throw new Error("Como máximo dos pagadores especiales.");
          if (extras.length > 0) {
            if (extras.some(p => !p.TitularCuenta.trim() || !p.IBAN.trim() || !p.NIF_TitularCuenta.trim() || !(Number(p.Porcentaje) > 0))) throw new Error("Completa titular, IBAN, NIF y porcentaje de cada pagador.");
            const suma = extras.reduce((a,p) => a + Number(p.Porcentaje || 0), 0);
            if (Math.abs(suma - 100) > 0.001) throw new Error("Los porcentajes de los pagadores especiales deben sumar 100%.");
          }
          // No borrar registros históricos: desactivar únicamente los retirados.
          // Las modificaciones se realizan por ID para no duplicar pagadores.
          for (const p of extras.filter(p => p.ID)) {
            const previo = pagadoresExtra.find(x => Number(x.ID) === Number(p.ID));
            if (previo && (texto(previo.TitularCuenta) !== p.TitularCuenta || texto(previo.IBAN) !== p.IBAN || texto(previo.NIF_TitularCuenta) !== p.NIF_TitularCuenta || Number(previo.Porcentaje) !== Number(p.Porcentaje))) {
              const {error: err} = await supabase.from("PAGADORES_EXTRA_CUOTA").update({ TitularCuenta:p.TitularCuenta, IBAN:p.IBAN, NIF_TitularCuenta:p.NIF_TitularCuenta, Porcentaje:Number(p.Porcentaje) }).eq("ID", p.ID).eq("NUMCENS", numcens);
              if (err) throw err;
            }
          }
          for (const p of extras.filter(p => !p.ID)) {
            const {error: err} = await supabase.from("PAGADORES_EXTRA_CUOTA").insert({ NUMCENS:numcens, TitularCuenta:p.TitularCuenta, IBAN:p.IBAN, NIF_TitularCuenta:p.NIF_TitularCuenta, Porcentaje:Number(p.Porcentaje), Activo:true });
            if (err) throw err;
          }
          if (eliminados.length) {
            const {error: err} = await supabase.from("PAGADORES_EXTRA_CUOTA").update({Activo:false}).eq("NUMCENS",numcens).in("ID",eliminados);
            if (err) throw err;
          }
        }
      }
      setEditando(false);
      router.refresh();
    } catch (e: unknown) {
      const err = e as { message?: string; details?: string; hint?: string; code?: string } | null;
      const partes = [err?.message, err?.details, err?.hint, err?.code ? `Código: ${err.code}` : null].filter(Boolean);
      console.error("Error al guardar ficha del socio:", e);
      setError(partes.length ? partes.join(" · ") : "No se pudo guardar. Revisa la consola del navegador.");
    }
    finally { setGuardando(false); }
  }
  const titulos = {
    personal: ["Datos personales", "Información principal del socio"],
    configuracion: ["Configuración socio", "Comisión, sexo, banda, cargo y lotería"],
    pago: ["Datos de pago", "Banco, forma de pago y cuota actual"],
  };
  return <section className="mb-3 border border-zinc-200 bg-white">
    <div className="flex items-center justify-between gap-2 bg-zinc-100 px-4 py-2">
      <div><h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">{titulos[seccion][0]}</h2>
        </div>
      {esBaja ? <span className="text-xs text-zinc-500">Socio dado de baja</span>
        : editando ? <div className="flex gap-2">
          <button type="button" disabled={guardando} onClick={cancelar} className="border border-zinc-300 bg-white px-3 py-1.5 text-sm">Cancelar</button>
          <button type="button" disabled={guardando} onClick={guardar} className={boton}>{guardando ? "Guardando..." : "Guardar"}</button>
        </div> : <button type="button" onClick={() => {setError(null); setEditando(true);}} className={boton}>Editar</button>}
    </div>
    {error && <div role="alert" className="border-y border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
    {seccion === "personal" && <>
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {celda("F. nacimiento", socio["FECHA de NACIMIENTO"] ? new Date(socio["FECHA de NACIMIENTO"]).toLocaleDateString("es-ES") : "-", "FECHA de NACIMIENTO", "personal", "date")}
        {celda("Teléfono 1", socio["Teléfono 1"], "Teléfono 1")}
        {celda("Teléfono 2", socio["Teléfono 2"], "Teléfono 2")}
        {celda("NIF", socio.NIF, "NIF")}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,2.5fr)_minmax(0,0.8fr)_minmax(0,1.3fr)]">
        {celda("Dirección", socio.Dirección, "Dirección")}
        {celda("C. postal", socio["Código Postal"], "Código Postal")}
        {celda("Ciudad", socio.Ciudad, "Ciudad")}
      </div>
      {editando && <div className="grid gap-2 border-t border-zinc-200 p-2 md:grid-cols-2">
        <label className="text-sm text-zinc-600">Nombre<input value={personal.Nombre} onChange={e=>setPersonal(s=>({...s,Nombre:e.target.value}))} className={campoClase}/></label>
        <label className="text-sm text-zinc-600">Apellidos<input value={personal.Apellidos} onChange={e=>setPersonal(s=>({...s,Apellidos:e.target.value}))} className={campoClase}/></label>
      </div>}
    </>}
    {seccion === "configuracion" && <>
      <div className="grid grid-cols-2 lg:grid-cols-5 [&>*]:min-w-0">
        {bloque("Comisión", editando
          ? <select aria-label="Comisión" value={config.Comision} onChange={e=>setConfig(a=>({...a, Comision:e.target.value}))} className={campoClase}>
              <option value="">-</option>
              <option value="MAY">MAY</option>
              <option value="INF">INF</option>
              {config.Comision && !["MAY", "INF"].includes(config.Comision) && <option value={config.Comision}>{config.Comision}</option>}
            </select>
          : (socio.Comision || "-"))}
        {bloque("Sexo", editando
          ? <select aria-label="Sexo" value={config.SEXE} onChange={e=>setConfig(a=>({...a,SEXE:e.target.value}))} className={campoClase}><option value="">-</option><option value="H">H</option><option value="M">M</option></select>
          : (socio.SEXE || "-"))}
        {bloque("Banda", editando
          ? <select aria-label="Banda" value={config.EsBanda ? "si" : "no"} onChange={e=>setConfig(a=>({...a, EsBanda:e.target.value === "si"}))} className={campoClase}><option value="si">Sí</option><option value="no">No</option></select>
          : (esSi(socio.EsBanda) ? "Sí" : "No"))}
        {celda("Cargo", socio.CARREG, "CARREG", "config")}
        {bloque("Lotería", editando
          ? <select aria-label="Lotería" value={config.ConLoteria ? "si" : "no"} onChange={e=>setConfig(a=>({...a, ConLoteria:e.target.value === "si"}))} className={campoClase}><option value="si">Sí</option><option value="no">No</option></select>
          : <div className="min-w-0 [&>div]:!border-0 [&>div]:!rounded-none [&>div]:!shadow-none [&>div]:!p-0 [&>div]:!bg-transparent [&>div>div:first-child]:hidden">
              <LoteriaSocioDesplegable conLoteria={esSi(socio.ConLoteria)} falla={loteria?.falla || 0} virgen={loteria?.virgen || 0}
                navidad={loteria?.navidad || 0} nino={loteria?.nino || 0} responsable={loteria?.responsable || "-"} numcens={numcens}/>
            </div>)}
      </div>
    </>}
    {seccion === "pago" && <>
      <div className="grid grid-cols-2 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-2">{celda("Cuota", cuota?.Importe != null ? Number(cuota.Importe).toFixed(2) + " €" : "-")}</div>
        <div className="min-w-0 lg:col-span-3">{bloque("Tarifa", editando
          ? <select aria-label="Tarifa" className={campoClase} value={tarifaElegida} onChange={e => setTarifaElegida(e.target.value)}>
            <option value="">Seleccionar tarifa</option>
            {tarifas.map(t => <option value={String(t.IDCuota)} key={t.IDCuota}>{t.IDCuota} · {Number(t.Importe || 0).toFixed(2)} €</option>)}
            {tarifaElegida && !tarifas.some(t=>String(t.IDCuota)===tarifaElegida) && <option value={tarifaElegida}>Tarifa actual ({tarifaElegida})</option>}
          </select> : (cuota?.Descripcion || cuota?.TipoCuota || cuota?.IDCuota || "-"))}</div>
        <div className={(editando ? metodo === "Banco" : esBanco) ? "min-w-0 lg:col-span-4" : "min-w-0 lg:col-span-5"}>{celda("IBAN", banco?.IBAN, "IBAN", "banco")}</div>
        <div className="min-w-0 lg:col-span-2">{bloque("Forma", editando
          ? <select aria-label="Forma de pago" value={metodo} onChange={e => setMetodo(e.target.value as "Banco" | "Efectivo")} className={campoClase}>
              <option value="Banco">Banco</option>
              <option value="Efectivo">Efectivo</option>
            </select>
          : (formaPago?.Metodo || "-"))}</div>
        {(editando ? metodo === "Banco" : esBanco) && <div className="min-w-0 lg:col-span-1">{bloque("Plazos", editando
          ? <select aria-label="Plazos" value={plazos} onChange={e=>setPlazos(Number(e.target.value))} className={campoClase}>{Array.from({length:10},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select>
          : (formaPago?.NumeroPlazos || "-"))}</div>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {bloque("Pagador", textoPagador || "Mismo socio")}
        {bloque("Titular", editando
          ? <input aria-label="Titular de cuenta" value={bancarios.TitularCuenta} onChange={e=>setBancarios(a=>({...a,TitularCuenta:e.target.value}))} className={campoClase}/>
          : (banco?.TitularCuenta || "-"))}
        {bloque("NIF titular", editando
          ? <input aria-label="NIF titular" value={bancarios.NIF_TitularCuenta} onChange={e=>setBancarios(a=>({...a,NIF_TitularCuenta:e.target.value}))} className={campoClase}/>
          : (banco?.NIF_TitularCuenta || "-"))}
        {bloque("Observaciones", formaPago?.Observaciones || "-")}
      </div>
      {(pagadoresExtra.length > 0 || editando) && <div className="border-b border-zinc-200">
        <div className="bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase text-zinc-600">Pagadores especiales</div>
        {editando ? <div className="grid grid-cols-1 gap-2 p-2 lg:grid-cols-2">
          {extras.map((p,i)=><div key={p.ID ?? `nuevo-${i}`} className="min-w-0 border border-zinc-200 p-2">
            <div className="mb-1 flex items-center justify-between gap-2 text-sm font-medium">
              <span>Pagador {i+1}</span>
              <button type="button" className="text-sm text-red-800 underline" onClick={()=>{if(p.ID)setEliminados(a=>[...a,p.ID!]);setExtras(a=>a.filter((_,j)=>j!==i));}}>Quitar</button>
            </div>
            <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-1">
              <input aria-label={`Porcentaje especial ${i+1}`} title="Porcentaje" type="number" min="0" max="100" step="0.01" value={p.Porcentaje} onChange={e=>actualizarExtra(i,"Porcentaje",Number(e.target.value))} className={campoClase}/>
              <input aria-label={`Titular especial ${i+1}`} placeholder="Titular" value={p.TitularCuenta} onChange={e=>actualizarExtra(i,"TitularCuenta",e.target.value)} className={campoClase}/>
              <input aria-label={`IBAN especial ${i+1}`} placeholder="IBAN" value={p.IBAN} onChange={e=>actualizarExtra(i,"IBAN",e.target.value)} className="col-span-2 w-full min-w-0 border border-zinc-300 px-2 py-1 text-sm"/>
              <input aria-label={`NIF especial ${i+1}`} placeholder="NIF" value={p.NIF_TitularCuenta} onChange={e=>actualizarExtra(i,"NIF_TitularCuenta",e.target.value)} className="col-span-2 w-full min-w-0 border border-zinc-300 px-2 py-1 text-sm"/>
            </div>
          </div>)}
          {extras.length < 2 && <button type="button" className="self-start p-2 text-left text-sm text-red-900 underline" onClick={()=>setExtras(a=>[...a,{TitularCuenta:"",IBAN:"",NIF_TitularCuenta:"",Porcentaje:a.length?100-Number(a[0].Porcentaje):100}])}>+ Añadir pagador especial</button>}
        </div> : <div className="grid grid-cols-1 lg:grid-cols-2">
          {pagadoresExtra.map((p,i)=><div key={p.ID ?? i} className="min-w-0 border-r border-zinc-200 px-3 py-1.5 text-sm break-words"><strong>{Number(p.Porcentaje || 0)}%</strong> · {p.TitularCuenta || "-"} · {p.IBAN || "-"}{p.NIF_TitularCuenta ? ` · ${p.NIF_TitularCuenta}` : ""}</div>)}
        </div>}
      </div>}

    </>}
  </section>;
}
