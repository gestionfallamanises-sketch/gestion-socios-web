"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ImprimirSocio() {
  const params = useParams();
  const numcens = Number(params.numcens);

  const [socio, setSocio] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [cuotaActual, setCuotaActual] = useState<any>(null);
const [formaPago, setFormaPago] = useState<any>(null);
const [datosBanco, setDatosBanco] = useState<any>(null);
const [textoPagador, setTextoPagador] = useState("-");
const [familia, setFamilia] = useState<any>(null);
const [miembrosFamilia, setMiembrosFamilia] = useState<any[]>([]);
const [cuotasFamilia, setCuotasFamilia] = useState<any[]>([]);

  useEffect(() => {
    async function cargar() {
      const { data, error } = await (supabase as any)
  .from("SOCIOS_ANTIGUEDAD_CALCULADA")
        .select("*")
        .eq("NUMCENS", numcens)
        .maybeSingle();

      if (error) {
        console.error("Error cargando socio:", error);
      }

      setSocio(data);

      const { data: cuota, error: errorCuota } = await (supabase as any)
  .from("VISTA_CUOTAS_RESUMEN")
  .select("*")
  .eq("NUMCENS", numcens)
  .order("Ejercicio", { ascending: false })
  .limit(1)
  .maybeSingle();


setCuotaActual(cuota);

const { data: pago } = await (supabase as any)
  .from("FORMAS_PAGO_SOCIOS")
  .select("*")
  .eq("NUMCENS", numcens)
  .eq("Activo", true)
  .maybeSingle();

setFormaPago(pago);

const numcensPagador = pago?.NUMCENS_Pagador
  ? Number(pago.NUMCENS_Pagador)
  : numcens;

if (numcensPagador === numcens) {
  setTextoPagador("Mismo socio");
} else {
  const { data: socioPagador } = await (supabase as any)
  .from("SOCIOS")
    .select("NUMCENS, Nombre, Apellidos")
    .eq("NUMCENS", numcensPagador)
    .maybeSingle();

  if (socioPagador) {
    setTextoPagador(
      `${socioPagador.NUMCENS} · ${socioPagador.Apellidos}, ${socioPagador.Nombre}`
    );
  }
}

const { data: banco } = await supabase
  .from("DATOS_BANCARIOS")
  .select("*")
  .eq("NUMCENS", numcensPagador)
  .maybeSingle();

setDatosBanco(banco);

if (data?.ID_Familia) {
  const { data: familiaData } = await (supabase as any)
  .from("FAMILIAS")
      .select("*")
      .eq("ID_Familia", data.ID_Familia)
      .maybeSingle();
  
    setFamilia(familiaData);
  
    const { data: miembrosData } = await (supabase as any)
  .from("SOCIOS")
      .select("*")
      .eq("ID_Familia", data.ID_Familia)
      .order("Apellidos", { ascending: true });
  
    const miembros = miembrosData || [];
    setMiembrosFamilia(miembros);
  
    const numeros = miembros.map((m: any) => m.NUMCENS);
  
    if (numeros.length > 0) {
      const { data: cuotasData } = await (supabase as any)
  .from("VISTA_CUOTAS_RESUMEN")
        .select("*")
        .in("NUMCENS", numeros)
        .eq("Ejercicio", cuota?.Ejercicio);
  
      setCuotasFamilia(cuotasData || []);
    }
  }

      setCargando(false);
    }

    if (numcens) cargar();
  }, [numcens]);

  if (cargando) {
    return <div className="p-8">Cargando ficha...</div>;
  }

  if (!socio) {
    return <div className="p-8">Socio no encontrado.</div>;
  }

  return (
    <main className="mx-auto max-w-[190mm] bg-white p-5 text-zinc-900 print:p-0">
  
      {/* CABECERA */}
      <div className="mb-3 flex items-start justify-between border-b-2 border-red-900 pb-3">
        <div>
          <h1 className="text-xl font-bold">
            {socio.Apellidos}, {socio.Nombre}
          </h1>
  
          <p className="mt-1 text-xs text-zinc-600">
            Nº socio {socio.NUMCENS}
            {" · "}
            {socio.CARREG || "Sin cargo"}
            {" · Antigüedad: "}
            {socio.Antiguedad_Calculada || "-"}
          </p>
        </div>
  
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase text-zinc-500">
            Ficha del socio
          </p>
  
          <p className="mt-1 text-xs font-semibold">
            {socio.Estado || "-"}
          </p>
        </div>
      </div>
  
      {/* PRIMERA FILA */}
      <div className="mb-3 grid grid-cols-2 gap-3">
  
        {/* DATOS PERSONALES */}
        <Seccion titulo="Datos personales">
          <div className="grid grid-cols-2">
            <Dato
              label="Fecha nacimiento"
              value={
                socio["FECHA de NACIMIENTO"]
                  ? new Date(
                      socio["FECHA de NACIMIENTO"]
                    ).toLocaleDateString("es-ES")
                  : "-"
              }
            />
  
            <Dato label="NIF" value={socio.NIF} />
  
            <Dato
              label="Teléfono 1"
              value={socio["Teléfono 1"]}
            />
  
            <Dato
              label="Teléfono 2"
              value={socio["Teléfono 2"]}
            />
  
            <Dato
              label="Código postal"
              value={socio["Código Postal"]}
            />
  
            <Dato
              label="Ciudad"
              value={socio.Ciudad}
            />
          </div>
  
          <Dato
            label="Dirección"
            value={socio.Dirección}
          />
        </Seccion>
  
        {/* CONFIGURACIÓN */}
        <Seccion titulo="Configuración">
          <div className="grid grid-cols-2">
            <Dato
              label="Comisión"
              value={socio.Comision}
            />
  
            <Dato
              label="Sexo"
              value={socio.SEXE}
            />
  
            <Dato
              label="Banda"
              value={socio.EsBanda ? "Sí" : "No"}
            />
  
            <Dato
              label="Lotería"
              value={socio.ConLoteria ? "Sí" : "No"}
            />
  
            <div className="col-span-2">
              <Dato
                label="Cargo"
                value={socio.CARREG}
              />
            </div>
          </div>
        </Seccion>
  
      </div>
  
      {/* CUOTA Y PAGO */}
<section className="mt-3 border border-zinc-300">
  <div className="flex items-center justify-between bg-zinc-100 px-3 py-1.5">
    <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-700">
      Cuota y pago
    </h2>

    <span className="text-[10px] text-zinc-500">
      Ejercicio {cuotaActual?.Ejercicio || "-"}
    </span>
  </div>

  <div className="grid grid-cols-[1.4fr_0.8fr_1fr_0.6fr_0.8fr_0.8fr]">
    <Dato
      label="Tarifa"
      value={
        cuotaActual?.Descripcion ||
        cuotaActual?.TipoCuota ||
        cuotaActual?.IDCuota
      }
    />

    <Dato
      label="Importe"
      value={
        cuotaActual?.Importe != null
          ? `${Number(cuotaActual.Importe).toFixed(2)} €`
          : "-"
      }
    />

    <Dato
      label="Forma pago"
      value={formaPago?.Metodo}
    />

    <Dato
      label="Plazos"
      value={formaPago?.NumeroPlazos}
    />

    <Dato
      label="Pagado"
      value={`${Number(
        cuotaActual?.TotalPagado || 0
      ).toFixed(2)} €`}
    />

    <Dato
      label="Pendiente"
      value={`${Number(
        cuotaActual?.Pendiente || 0
      ).toFixed(2)} €`}
    />
  </div>

  <div className="grid grid-cols-2">
  <Dato
  label="Pagador"
  value={textoPagador}
/>

  <Dato
    label="IBAN"
    value={datosBanco?.IBAN}
  />
</div>

  
</section>
  
  {/* FAMILIA */}
<section className="mt-3 border border-zinc-300">
  <div className="flex items-center justify-between bg-zinc-100 px-3 py-1.5">
    <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-700">
      Familia
    </h2>

    <span className="text-xs text-zinc-600">
      {familia?.Nombre_Familia ||
        (familia ? `Familia ${familia.ID_Familia}` : "Sin familia")}
    </span>
  </div>

  {familia && miembrosFamilia.length > 0 ? (
    <table className="w-full text-[11px]">
      <thead>
        <tr className="border-t border-zinc-300 bg-zinc-50 text-left text-[9px] uppercase text-zinc-500">
          <th className="px-2 py-1">Socio</th>
          <th className="px-2 py-1">Comisión</th>
          <th className="px-2 py-1">Tarifa</th>
          <th className="px-2 py-1 text-right">Importe</th>
        </tr>
      </thead>

      <tbody>
        {miembrosFamilia.map((miembro) => {
          const cuotaMiembro = cuotasFamilia.find(
            (c) => Number(c.NUMCENS) === Number(miembro.NUMCENS)
          );

          return (
            <tr
              key={miembro.NUMCENS}
              className="border-t border-zinc-200"
            >
              <td className="px-2 py-1">
                <span className="font-medium">
                  {miembro.Apellidos}, {miembro.Nombre}
                </span>

                <span className="ml-2 text-[9px] text-zinc-500">
                  Nº {miembro.NUMCENS}
                </span>
              </td>

              <td className="px-2 py-1">
                {miembro.Comision || "-"}
              </td>

              <td className="px-2 py-1">
                {cuotaMiembro?.Descripcion ||
                  cuotaMiembro?.TipoCuota ||
                  cuotaMiembro?.IDCuota ||
                  "-"}
              </td>

              <td className="px-2 py-1 text-right">
                {cuotaMiembro?.Importe != null
                  ? `${Number(cuotaMiembro.Importe).toFixed(2)} €`
                  : "-"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  ) : (
    <div className="px-3 py-2 text-xs text-zinc-500">
      No pertenece a ninguna familia.
    </div>
  )}
</section>

      {/* BOTÓN */}
      <div className="mt-4 flex justify-end print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-red-900 px-5 py-2 text-sm font-medium text-white hover:bg-red-950"
        >
          Imprimir
        </button>
      </div>
  
    </main>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="h-full border border-zinc-300">
      <div className="bg-zinc-100 px-3 py-1.5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-700">
          {titulo}
        </h2>
      </div>

      {children}
    </section>
  );
}

function Dato({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="border-r border-t border-zinc-200 px-2 py-1.5">
      <div className="text-[10px] font-medium uppercase text-zinc-500">
        {label}
      </div>

      <div className="mt-0.5 text-xs">
        {value === null || value === undefined || value === ""
          ? "-"
          : String(value)}
      </div>
    </div>
  );
}