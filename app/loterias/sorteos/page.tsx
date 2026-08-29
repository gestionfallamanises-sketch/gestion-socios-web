"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ResumenEconomicoSorteos from "@/app/loterias/componentes/ResumenEconomicoSorteos";

export default function ControlSemanalPage() {
    const router = useRouter();

  const [mostrarModal, setMostrarModal] = useState(false);
  const [fechaSorteo, setFechaSorteo] = useState("");

const [numeroFalla, setNumeroFalla] = useState("");
const [decimosFalla, setDecimosFalla] = useState(0);
const [precioDecimoFalla, setPrecioDecimoFalla] = useState(0);
const [papeletasFalla, setPapeletasFalla] = useState(0);
const [sobrantesFalla, setSobrantesFalla] = useState(0);
const [importePapeletaFalla, setImportePapeletaFalla] = useState(0);
const [beneficioFalla, setBeneficioFalla] = useState(0);

const [numeroVirgen, setNumeroVirgen] = useState("");
const [decimosVirgen, setDecimosVirgen] = useState(0);
const [precioDecimoVirgen, setPrecioDecimoVirgen] = useState(0);
const [papeletasVirgen, setPapeletasVirgen] = useState(0);
const [sobrantesVirgen, setSobrantesVirgen] = useState(0);
const [importePapeletaVirgen, setImportePapeletaVirgen] = useState(0);
const [beneficioVirgen, setBeneficioVirgen] = useState(0);
const [sorteos, setSorteos] = useState<any[]>([]);

const [resumenesSorteos, setResumenesSorteos] = useState<
  Record<number, {
    importeTotal: number;
    pendienteCobro: number;
    premioTotal: number;
    premioPendiente: number;
  }>
>({});

const [sorteoEditando, setSorteoEditando] = useState<any | null>(null);
const [ejercicioActivo, setEjercicioActivo] = useState<number | null>(null);

const [premioFallaPorPapeleta, setPremioFallaPorPapeleta] = useState(0);
const [premioVirgenPorPapeleta, setPremioVirgenPorPapeleta] = useState(0);

const [totalFalla, setTotalFalla] = useState(0);
const [totalVirgen, setTotalVirgen] = useState(0);

const [tipoSorteo, setTipoSorteo] = useState("SEMANAL");

const [modalPos, setModalPos] = useState({ x: 160, y: 80 });
const [arrastrandoModal, setArrastrandoModal] = useState(false);
const [offsetModal, setOffsetModal] = useState({ x: 0, y: 0 });

function calcularResumenEconomico(tipo: "Falla" | "Virgen") {
  return sorteos.reduce(
    (acc, sorteo) => {
      if (tipo === "Virgen" && sorteo.TipoSorteo === "ESPECIAL") {
        return acc;
      }

      const decimos = Number(sorteo[`Decimos${tipo}`] || 0);
      const precioDecimo = Number(sorteo[`PrecioDecimo${tipo}`] || 0);
      const importePapeleta = Number(sorteo[`ImportePapeleta${tipo}`] || 0);
      const beneficioPapeleta = Number(sorteo[`Beneficio${tipo}`] || 0);
      const papeletasSocios = Number(
        sorteo[`PapeletasTotales${tipo}`] || 0
      );

      const pagoAdministracion = decimos * precioDecimo;

      const papeletasEmitidas =
        importePapeleta > 0
          ? Math.floor(pagoAdministracion / importePapeleta)
          : 0;

      const sobrantes = Math.max(
        0,
        papeletasEmitidas - papeletasSocios
      );

      const recaudacion =
        papeletasSocios * (importePapeleta + beneficioPapeleta);

      const jugadoSocios =
        papeletasSocios * importePapeleta;

      const beneficioSocios =
        papeletasSocios * beneficioPapeleta;

      const jugadoSobrantes =
        sobrantes * importePapeleta;

      const beneficioSobrantes =
        sobrantes * beneficioPapeleta;

      return {
        recaudacion: acc.recaudacion + recaudacion,
        jugadoSocios: acc.jugadoSocios + jugadoSocios,
        beneficioSocios:
          acc.beneficioSocios + beneficioSocios,
        pagoAdministracion:
          acc.pagoAdministracion + pagoAdministracion,
        jugadoSobrantes:
          acc.jugadoSobrantes + jugadoSobrantes,
        beneficioSobrantes:
          acc.beneficioSobrantes + beneficioSobrantes,
        beneficioTotal:
          acc.beneficioTotal +
          beneficioSocios +
          beneficioSobrantes,
      };
    },
    {
      recaudacion: 0,
      jugadoSocios: 0,
      beneficioSocios: 0,
      pagoAdministracion: 0,
      jugadoSobrantes: 0,
      beneficioSobrantes: 0,
      beneficioTotal: 0,
    }
  );
}

function euros(valor: number) {
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(valor || 0)) + " €";
  }

  const precioPapeletaVentaFalla =
  importePapeletaFalla + beneficioFalla;

const importePagoAdministracionFalla =
  decimosFalla * precioDecimoFalla;

const papeletasEmitidasFalla =
  importePapeletaFalla > 0
    ? Math.floor(importePagoAdministracionFalla / importePapeletaFalla)
    : 0;

  const restoSueltoFalla =
  importePagoAdministracionFalla -
  papeletasEmitidasFalla * importePapeletaFalla;


const papeletasSociosFalla = papeletasFalla;

const papeletasSobrantesFalla =
  Math.max(0, papeletasEmitidasFalla - papeletasSociosFalla);

  const jugadoFalla =
  papeletasSobrantesFalla * importePapeletaFalla +
  restoSueltoFalla; 

const recaudacionSociosFalla =
  papeletasSociosFalla * precioPapeletaVentaFalla;

const importeJugadoSociosFalla =
  papeletasSociosFalla * importePapeletaFalla;

const beneficioSociosFalla =
  papeletasSociosFalla * beneficioFalla;

const beneficioPremioFalla =
  papeletasSobrantesFalla * premioFallaPorPapeleta;



  const precioPapeletaVentaVirgen =
  importePapeletaVirgen + beneficioVirgen;

const importePagoAdministracionVirgen =
  decimosVirgen * precioDecimoVirgen;

const papeletasEmitidasVirgen =
  importePapeletaVirgen > 0
    ? Math.floor(importePagoAdministracionVirgen / importePapeletaVirgen)
    : 0;

  const restoSueltoVirgen =
  importePagoAdministracionVirgen -
  papeletasEmitidasVirgen * importePapeletaVirgen;


const papeletasSociosVirgen = papeletasVirgen;

const papeletasSobrantesVirgen =
  Math.max(0, papeletasEmitidasVirgen - papeletasSociosVirgen);

  const jugadoVirgen =
  papeletasSobrantesVirgen * importePapeletaVirgen +
  restoSueltoVirgen; 

const recaudacionSociosVirgen =
  papeletasSociosVirgen * precioPapeletaVentaVirgen;

const importeJugadoSociosVirgen =
  papeletasSociosVirgen * importePapeletaVirgen;

const beneficioSociosVirgen =
  papeletasSociosVirgen * beneficioVirgen;

const beneficioPremioVirgen =
  papeletasSobrantesVirgen * premioVirgenPorPapeleta;

  useEffect(() => {
    cargarSorteos();
  }, []);


  async function guardarSorteo() {
    if (!ejercicioActivo) {
      alert("No se ha encontrado un ejercicio activo.");
      return;
    }

    if (!fechaSorteo) {
      alert("Selecciona la fecha del sorteo.");
      return;
    }
  
    const datos = {
      Ejercicio: ejercicioActivo,
      FechaSorteo: fechaSorteo,
      TipoSorteo: tipoSorteo,
  
      NumeroFalla: numeroFalla,
      DecimosFalla: decimosFalla,
      PrecioDecimoFalla: precioDecimoFalla,
      PapeletasTotalesFalla: papeletasFalla,
      SobrantesFalla: papeletasSobrantesFalla,
      ImportePapeletaFalla: importePapeletaFalla,
      BeneficioFalla: beneficioFalla,
      PremioFallaPorPapeleta: premioFallaPorPapeleta,
  
      NumeroVirgen: numeroVirgen,
      DecimosVirgen: decimosVirgen,
      PrecioDecimoVirgen: precioDecimoVirgen,
      PapeletasTotalesVirgen: papeletasVirgen,
      SobrantesVirgen: papeletasSobrantesVirgen,
      ImportePapeletaVirgen: importePapeletaVirgen,
      BeneficioVirgen: beneficioVirgen,
      PremioVirgenPorPapeleta: premioVirgenPorPapeleta,
  
      Activo: true,
    };
  
    let error;
  
    if (sorteoEditando) {
      ({ error } = await (supabase as any)
        .from("LOTERIA_SORTEOS")
        .update(datos)
        .eq("ID", sorteoEditando.ID));
    
      if (error) {
        alert(error.message);
        return;
      }
    
      const { data: lineasSorteo, error: errorLineas } =
        await (supabase as any)
          .from("LOTERIA_SORTEOS_GRUPOS")
          .select(`
            ID,
            PapeletasFalla,
            PapeletasVirgen,
            PapeletasPremioFalla,
            PapeletasPremioVirgen,
            PremioEntregado
          `)
          .eq("IDSorteo", sorteoEditando.ID);
    
      if (errorLineas) {
        alert(
          "El sorteo se ha actualizado, pero no se pudieron cargar sus líneas: " +
            errorLineas.message
        );
        return;
      }
    
      const actualizaciones = (lineasSorteo || []).map(
        async (linea: any) => {
          const papeletasPremioFalla =
  Number(linea.PapeletasPremioFalla || 0) > 0
    ? Number(linea.PapeletasPremioFalla)
    : Number(linea.PapeletasFalla || 0);

const papeletasPremioVirgen =
  Number(linea.PapeletasPremioVirgen || 0) > 0
    ? Number(linea.PapeletasPremioVirgen)
    : Number(linea.PapeletasVirgen || 0);

const nuevoImportePremio = Number(
  (
    papeletasPremioFalla *
      Number(premioFallaPorPapeleta || 0) +
    papeletasPremioVirgen *
      Number(premioVirgenPorPapeleta || 0)
  ).toFixed(2)
);
    
          const { error: errorActualizarLinea } =
            await (supabase as any)
              .from("LOTERIA_SORTEOS_GRUPOS")
              .update({
                ImportePremio: nuevoImportePremio,
                PremioEntregado: false,
              })
              .eq("ID", linea.ID);
    
          if (errorActualizarLinea) {
            throw new Error(errorActualizarLinea.message);
          }
        }
      );
    
      try {
        await Promise.all(actualizaciones);
      } catch (errorPremios: any) {
        alert(
          "El sorteo se ha actualizado, pero no se pudieron recalcular los premios: " +
            errorPremios.message
        );
        return;
      }
    } else {

        const { data: sorteoCreado, error: errorInsert } = await (supabase as any)
          .from("LOTERIA_SORTEOS")
          .insert(datos)
          .select()
          .single();
      
        if (errorInsert) {
          alert(errorInsert.message);
          return;
        }
      
        await crearLineasSorteo(sorteoCreado);
      }
  
    if (error) {
      alert(error.message);
      return;
    }
  
    alert(sorteoEditando ? "Sorteo actualizado correctamente" : "Sorteo guardado correctamente");
  
    cargarSorteos();
limpiarFormularioSorteo();
setMostrarModal(false);
  }

  async function crearLineasSorteo(sorteo: any) {
    const { data: grupos, error } = await (supabase as any)
      .from("SOCIOS_LOTERIA")
      .select("*")
      .eq("Activo", true);
  
    if (error) {
      alert("Sorteo creado, pero error creando líneas: " + error.message);
      return;
    }
  
    const lineas = (grupos || [])
  .filter((grupo: any) =>
    Number(grupo.PapeletasFalla || 0) > 0 ||
    Number(grupo.PapeletasVirgen || 0) > 0
  )
  .map((grupo: any) => {

      const precioVentaFalla =
        Number(sorteo.ImportePapeletaFalla || 0) +
        Number(sorteo.BeneficioFalla || 0);
  
      const precioVentaVirgen =
        Number(sorteo.ImportePapeletaVirgen || 0) +
        Number(sorteo.BeneficioVirgen || 0);
  
      return {
        IDSorteo: sorteo.ID,
        IDGrupoLoteria: grupo.ID,
        PapeletasFalla: Number(grupo.PapeletasFalla || 0),
        PapeletasVirgen: Number(grupo.PapeletasVirgen || 0),
        ImporteFalla: Number((Number(grupo.PapeletasFalla || 0) * precioVentaFalla).toFixed(2)),
        ImporteVirgen: Number((Number(grupo.PapeletasVirgen || 0) * precioVentaVirgen).toFixed(2)),
        ImportePagado: 0,
        ImportePremio: 0,
        PremioEntregado: false,
        PagadoConfirmado: false,
        PapeletasPremioFalla: Number(grupo.PapeletasFalla || 0),
        PapeletasPremioVirgen: Number(grupo.PapeletasVirgen || 0),
      };
    });
  
    if (lineas.length === 0) return;
  
    const { error: errorLineas } = await (supabase as any)
      .from("LOTERIA_SORTEOS_GRUPOS")
      .insert(lineas);
  
    if (errorLineas) {
      alert("Sorteo creado, pero error creando líneas: " + errorLineas.message);
    }
  }

  async function cargarSorteos() {

    const { data: ejercicioData, error: errorEjercicio } =
  await (supabase as any)
    .from("EJERCICIOS")
    .select("Ejercicio")
    .eq("Activo", true)
    .maybeSingle();

if (errorEjercicio) {
  console.error(errorEjercicio);
}

const ejercicioActual = Number(ejercicioData?.Ejercicio || 0);

if (!ejercicioActual) {
  alert("No se ha encontrado un ejercicio activo.");
  setSorteos([]);
  return;
}

setEjercicioActivo(ejercicioActual);

const { data, error } = await (supabase as any)
.from("LOTERIA_SORTEOS")
.select("*")
.eq("Ejercicio", ejercicioActual)
.order("FechaSorteo", { ascending: false });
  
    if (error) {
      alert(error.message);
      return;
    }

    const idsSorteos = (data || []).map((s: any) => s.ID);
  
    let lineas: any[] = [];
let errorLineas = null;

if (idsSorteos.length > 0) {
  const resultadoLineas = await (supabase as any)
    .from("LOTERIA_SORTEOS_GRUPOS")
    .select(`
      IDSorteo,
      ImporteFalla,
      ImporteVirgen,
      ImportePremio,
      PagadoConfirmado,
      PremioEntregado
    `)
    .in("IDSorteo", idsSorteos);

  lineas = resultadoLineas.data || [];
  errorLineas = resultadoLineas.error;
}
  
    if (errorLineas) {
      alert(errorLineas.message);
      return;
    }
  
    const resumenes: Record<
      number,
      {
        importeTotal: number;
        cobrado: number;
        pendienteCobro: number;
        premioTotal: number;
        premioPendiente: number;
        grupos: number;
        gruposPagados: number;
        gruposPendientes: number;
      }
    > = {};
  
    (lineas || []).forEach((l: any) => {
      if (!resumenes[l.IDSorteo]) {
        resumenes[l.IDSorteo] = {
          importeTotal: 0,
          cobrado: 0,
          pendienteCobro: 0,
          premioTotal: 0,
          premioPendiente: 0,
          grupos: 0,
          gruposPagados: 0,
          gruposPendientes: 0,
        };
      }
  
      const resumen = resumenes[l.IDSorteo];
  
      const importe =
        Number(l.ImporteFalla || 0) +
        Number(l.ImporteVirgen || 0);
  
        resumen.importeTotal += importe;

        // Solo cuenta como grupo participante si realmente tiene papeletas
        if (importe > 0) {
          resumen.grupos++;
        
          if (l.PagadoConfirmado) {
            resumen.cobrado += importe;
            resumen.gruposPagados++;
          } else {
            resumen.pendienteCobro += importe;
            resumen.gruposPendientes++;
          }
        }
  
      resumen.premioTotal += Number(l.ImportePremio || 0);
  
      if (!l.PremioEntregado) {
        resumen.premioPendiente += Number(l.ImportePremio || 0);
      }
    });
  
    setResumenesSorteos(resumenes);
    setSorteos(data || []);
  }

  async function cargarTotalesLineasSorteo(idSorteo: number) {
    const { data, error } = await (supabase as any)
      .from("LOTERIA_SORTEOS_GRUPOS")
      .select("PapeletasFalla, PapeletasVirgen")
      .eq("IDSorteo", idSorteo);
  
    if (error) {
      alert("Error cargando totales del sorteo: " + error.message);
      return {
        falla: 0,
        virgen: 0,
      };
    }
  
    const falla = (data || []).reduce(
      (sum: number, fila: any) => sum + Number(fila.PapeletasFalla || 0),
      0
    );
  
    const virgen = (data || []).reduce(
      (sum: number, fila: any) => sum + Number(fila.PapeletasVirgen || 0),
      0
    );
  
    return { falla, virgen };
  }

  async function cargarTotalesSorteo(idSorteo: number) {
    const { data, error } = await (supabase as any)
      .from("LOTERIA_SORTEOS_GRUPOS")
      .select("PapeletasFalla, PapeletasVirgen")
      .eq("IDSorteo", idSorteo);
  
    if (error) {
      alert(error.message);
      return;
    }
  
    const totalFalla = (data || []).reduce(
      (sum: number, fila: any) =>
        sum + Number(fila.PapeletasFalla || 0),
      0
    );
  
    const totalVirgen = (data || []).reduce(
      (sum: number, fila: any) =>
        sum + Number(fila.PapeletasVirgen || 0),
      0
    );
  
    setPapeletasFalla(totalFalla);
    setPapeletasVirgen(totalVirgen);
  }

  async function cargarTotalesSociosLoteria() {
    const { data, error } = await (supabase as any)
      .from("SOCIOS_LOTERIA")
      .select("PapeletasFalla, PapeletasVirgen")
      .eq("Activo", true);
  
    if (error) {
      alert(error.message);
      return;
    }
  
    const totalF = (data || []).reduce(
      (sum: number, grupo: any) => sum + Number(grupo.PapeletasFalla || 0),
      0
    );
  
    const totalV = (data || []).reduce(
      (sum: number, grupo: any) => sum + Number(grupo.PapeletasVirgen || 0),
      0
    );
  
    setPapeletasFalla(totalF);
    setPapeletasVirgen(totalV);
  }

  async function editarSorteo(sorteo: any) {
    const totalesLineas = await cargarTotalesLineasSorteo(sorteo.ID);
    setSorteoEditando(sorteo);
    setFechaSorteo(sorteo.FechaSorteo || "");
  
    setNumeroFalla(sorteo.NumeroFalla || "");
    setDecimosFalla(Number(sorteo.DecimosFalla || 0));
    setPrecioDecimoFalla(Number(sorteo.PrecioDecimoFalla || 0));
    setPapeletasFalla(totalesLineas.falla);
    setSobrantesFalla(Number(sorteo.SobrantesFalla || 0));
    setImportePapeletaFalla(Number(sorteo.ImportePapeletaFalla || 0));
    setBeneficioFalla(Number(sorteo.BeneficioFalla || 0));
    setPremioFallaPorPapeleta(Number(sorteo.PremioFallaPorPapeleta || 0));
  
    setNumeroVirgen(sorteo.NumeroVirgen || "");
    setDecimosVirgen(Number(sorteo.DecimosVirgen || 0));
    setPrecioDecimoVirgen(Number(sorteo.PrecioDecimoVirgen || 0));
    setPapeletasVirgen(totalesLineas.virgen);
    setSobrantesVirgen(Number(sorteo.SobrantesVirgen || 0));
    setImportePapeletaVirgen(Number(sorteo.ImportePapeletaVirgen || 0));
    setBeneficioVirgen(Number(sorteo.BeneficioVirgen || 0));
    setPremioVirgenPorPapeleta(Number(sorteo.PremioVirgenPorPapeleta || 0));
    
    setMostrarModal(true);
  }

  async function eliminarSorteo(id: number) {
    const confirmar = confirm(
      "¿Seguro que quieres eliminar este sorteo?"
    );
  
    if (!confirmar) return;
  
    const { error: errorGrupos } = await (supabase as any)
      .from("LOTERIA_SORTEOS_GRUPOS")
      .delete()
      .eq("IDSorteo", id);
  
    if (errorGrupos) {
      alert(errorGrupos.message);
      return;
    }
  
    const { error: errorSorteo } = await (supabase as any)
      .from("LOTERIA_SORTEOS")
      .delete()
      .eq("ID", id);
  
    if (errorSorteo) {
      alert(errorSorteo.message);
      return;
    }
  
    cargarSorteos();
  }

  function limpiarFormularioSorteo() {
    setSorteoEditando(null);
    setFechaSorteo("");
  
    setNumeroFalla("");
    setDecimosFalla(0);
    setPrecioDecimoFalla(0);
    setPapeletasFalla(0);
    setSobrantesFalla(0);
    setImportePapeletaFalla(1.6);
    setBeneficioFalla(0.4);
    setPremioFallaPorPapeleta(0);
  
    setNumeroVirgen("");
    setDecimosVirgen(0);
    setPrecioDecimoVirgen(0);
    setPapeletasVirgen(0);
    setSobrantesVirgen(0);
    setImportePapeletaVirgen(1.6);
    setBeneficioVirgen(0.4);
    setPremioVirgenPorPapeleta(0);
  }

  function formatearFecha(fecha: string) {
    const d = new Date(fecha);
  
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const anio = d.getFullYear();
  
    return `${dia}/${mes}/${anio}`;
  }

  function imprimirListadoSorteos() {
    router.push("/loterias/sorteos/imprimir")
  }

  const resumenFalla = calcularResumenEconomico("Falla");
const resumenVirgen = calcularResumenEconomico("Virgen");

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">

        <div className="mb-4">
  <button
    onClick={() => router.push("/loterias")}
    className="text-sm font-medium text-red-900 hover:underline"
  >
    ← Volver a loterías
  </button>
</div>

        <section className="mb-6 border border-zinc-200 bg-white p-6">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">
        Sorteos
      </h1>

      <p className="mt-2 text-sm text-zinc-600">
        Gestión de sorteos y resultados.
      </p>
    </div>

    

    <div className="flex gap-2">
  <button
  onClick={() => router.push("/loterias/sorteos/imprimir")}
  className="bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
>
  Imprimir
</button>

<button
  onClick={() => router.push("/loterias/sorteos/excel")}
  className="bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
>
  Excel
</button>

  <button
    onClick={async () => {
      limpiarFormularioSorteo();
    
      setTipoSorteo("SEMANAL");
    
      await cargarTotalesSociosLoteria();
    
      setMostrarModal(true);
    }}
    className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
  >
    + Sorteo Semanal
  </button>

  <button
  onClick={async () => {
    limpiarFormularioSorteo();

    setTipoSorteo("ESPECIAL");

    await cargarTotalesSociosLoteria();

    setPapeletasVirgen(0);

    setMostrarModal(true);
  }}
  className="bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800"
>
  + Especial
</button>
</div>
  </div>
</section>

          <section className="border border-zinc-200 bg-white">
            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Sorteos
                </h2>

                <p className="text-xs text-zinc-500">
                  Fechas de sorteo configuradas
                </p>
              </div>
            </div>

            {sorteos.length === 0 ? (
  <div className="px-4 py-12 text-center text-sm text-zinc-500">
    Todavía no hay sorteos creados.
  </div>

) : (

  <>
    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ResumenEconomicoSorteos
        titulo="Falla"
        resumen={resumenFalla}
      />

      <ResumenEconomicoSorteos
        titulo="Virgen"
        resumen={resumenVirgen}
      />
    </div>

    <table className="min-w-full divide-y divide-zinc-200">

    <thead className="bg-zinc-100">
  <tr>
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
      Fecha
    </th>

    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
      Sorteo
    </th>

    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
      Números
    </th>

    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
      Cobros
    </th>

    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
      Premios
    </th>

    <th className="px-4 py-3 text-center text-xs font-semibold uppercase">
      Acciones
    </th>
  </tr>

</thead>

<tbody className="divide-y divide-zinc-200 bg-white">
  {sorteos.map((sorteo) => {
    const resumen: any = resumenesSorteos[sorteo.ID] || {
      importeTotal: 0,
      cobrado: 0,
      pendienteCobro: 0,
      premioTotal: 0,
      premioPendiente: 0,
      grupos: 0,
      gruposPagados: 0,
      gruposPendientes: 0,
    };
    const premioFallaPorPapeleta = Number(
      sorteo.PremioFallaPorPapeleta || 0
    );
    
    const premioVirgenPorPapeleta = Number(
      sorteo.PremioVirgenPorPapeleta || 0
    );
    
    const hayPremio =
      premioFallaPorPapeleta > 0 ||
      premioVirgenPorPapeleta > 0;

      const hayCobroPendiente =
      Number(resumen.pendienteCobro || 0) > 0;
    
    const hayPremioPendiente =
      Number(resumen.premioPendiente || 0) > 0;
    
    const sorteoCerrado =
      !hayCobroPendiente && !hayPremioPendiente;

    return (
      <tr
        key={sorteo.ID}
        className="align-top hover:bg-zinc-50"
      >
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() =>
              router.push(`/loterias/sorteos/${sorteo.ID}`)
            }
            className="font-medium text-red-900 hover:underline"
          >
            {formatearFecha(sorteo.FechaSorteo)}
          </button>

          <div className="mt-1 text-xs text-zinc-500">
            {sorteo.TipoSorteo === "ESPECIAL"
              ? "Especial"
              : "Semanal"}
          </div>

          <div
  className={`mt-2 inline-block px-2 py-1 text-xs font-medium ${
    sorteoCerrado
      ? "bg-green-100 text-green-800"
      : hayCobroPendiente && hayPremioPendiente
      ? "bg-orange-100 text-orange-800"
      : hayPremioPendiente
      ? "bg-orange-100 text-orange-800"
      : "bg-amber-100 text-amber-800"
  }`}
>
  {sorteoCerrado
    ? "Cerrado"
    : hayCobroPendiente && hayPremioPendiente
    ? "Cobro y premio pendientes"
    : hayPremioPendiente
    ? "Premio pendiente"
    : "Cobro pendiente"}
</div>
</td>

        <td className="px-4 py-3 text-sm">
          <div>
            <span className="text-zinc-500">Grupos:</span>{" "}
            <span className="font-semibold">
              {resumen.grupos}
            </span>
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Pagados: {resumen.gruposPagados}
          </div>

          <div className="text-xs text-zinc-500">
            Pendientes: {resumen.gruposPendientes}
          </div>
        </td>

        <td className="px-4 py-3 text-sm">
          <div>
            <span className="font-medium text-red-900">
              Falla:
            </span>{" "}
            <span className="font-semibold">
              {sorteo.NumeroFalla || "—"}
            </span>
          </div>

          {sorteo.TipoSorteo !== "ESPECIAL" && (
            <div className="mt-2">
              <span className="font-medium text-blue-900">
                Virgen:
              </span>{" "}
              <span className="font-semibold">
                {sorteo.NumeroVirgen || "—"}
              </span>
            </div>
          )}
        </td>

        <td className="px-4 py-3 text-sm">
          <div className="flex justify-between gap-5">
            <span className="text-zinc-500">Total:</span>
            <span className="font-semibold">
              {resumen.importeTotal.toFixed(2)} €
            </span>
          </div>

          <div className="mt-1 flex justify-between gap-5">
            <span className="text-zinc-500">Cobrado:</span>
            <span className="font-semibold text-green-700">
              {resumen.cobrado.toFixed(2)} €
            </span>
          </div>

          <div className="mt-1 flex justify-between gap-5">
            <span className="text-zinc-500">Pendiente:</span>
            <span
              className={`font-semibold ${
                resumen.pendienteCobro > 0
                  ? "text-red-700"
                  : "text-zinc-700"
              }`}
            >
              {resumen.pendienteCobro.toFixed(2)} €
            </span>
          </div>
        </td>

        <td className="px-4 py-3 text-sm">

        <div
  className={`mb-2 inline-block px-2 py-1 text-xs font-medium ${
    !hayPremio
      ? "bg-zinc-100 text-zinc-500"
      : hayPremioPendiente
      ? "bg-orange-100 text-orange-800"
      : "bg-green-100 text-green-800"
  }`}
>
  {!hayPremio
    ? "Sin premio"
    : hayPremioPendiente
    ? "Premio pendiente"
    : "Premio entregado"}
</div>

{premioFallaPorPapeleta > 0 && (
  <div className="mb-1 flex justify-between gap-5 text-xs">
    <span className="text-zinc-500">Falla / papeleta:</span>
    <span className="font-semibold">
      {premioFallaPorPapeleta.toFixed(2)} €
    </span>
  </div>
)}

{sorteo.TipoSorteo !== "ESPECIAL" &&
  premioVirgenPorPapeleta > 0 && (
    <div className="mb-2 flex justify-between gap-5 text-xs">
      <span className="text-zinc-500">Virgen / papeleta:</span>
      <span className="font-semibold">
        {premioVirgenPorPapeleta.toFixed(2)} €
      </span>
    </div>
  )}
          <div className="flex justify-between gap-5">
            <span className="text-zinc-500">Total:</span>
            <span className="font-semibold">
              {resumen.premioTotal.toFixed(2)} €
            </span>
          </div>

          <div className="mt-1 flex justify-between gap-5">
            <span className="text-zinc-500">
              Sin entregar:
            </span>

            <span
              className={`font-semibold ${
                resumen.premioPendiente > 0
                  ? "text-red-700"
                  : "text-zinc-700"
              }`}
            >
              {resumen.premioPendiente.toFixed(2)} €
            </span>
          </div>

          <div className="mt-1 flex justify-between gap-5">
            <span className="text-zinc-500">
              Entregado:
            </span>

            <span className="font-semibold text-green-700">
              {(
                resumen.premioTotal -
                resumen.premioPendiente
              ).toFixed(2)}{" "}
              €
            </span>
          </div>
        </td>

        <td className="px-4 py-3">
          <div className="flex justify-center gap-2">
            <button
              onClick={() =>
                router.push(`/loterias/sorteos/${sorteo.ID}`)
              }
              title="Ver líneas de socios"
              className="rounded bg-zinc-100 px-2 py-1 text-sm hover:bg-zinc-200"
            >
              👥
            </button>

            <button
              onClick={() => editarSorteo(sorteo)}
              title="Editar sorteo"
              className="rounded bg-zinc-100 px-2 py-1 text-sm hover:bg-zinc-200"
            >
              ✏️
            </button>

            <button
              onClick={() =>
                router.push(
                  `/loterias/sorteos/${sorteo.ID}/imprimir`
                )
              }
              title="Imprimir ficha"
              className="rounded bg-zinc-100 px-2 py-1 text-sm hover:bg-zinc-200"
            >
              🖨️
            </button>

            <button
              onClick={() =>
                alert("Pendiente exportar este sorteo a Excel")
              }
              title="Exportar este sorteo"
              className="rounded bg-zinc-100 px-2 py-1 text-sm hover:bg-zinc-200"
            >
              📗
            </button>

            <button
              onClick={() => eliminarSorteo(sorteo.ID)}
              title="Eliminar"
              className="rounded bg-red-100 px-2 py-1 text-sm hover:bg-red-200"
            >
              🗑️
            </button>
          </div>
        </td>
      </tr>
    );
  })}
</tbody>
</table>
</>
)}
</section>
        </div>

        {mostrarModal && (
          <div
          className="fixed inset-0 z-50 bg-black/40"
          onMouseMove={(e) => {
            if (!arrastrandoModal) return;
        
            setModalPos({
              x: e.clientX - offsetModal.x,
              y: e.clientY - offsetModal.y,
            });
          }}
          onMouseUp={() => setArrastrandoModal(false)}
        >
          <div
            className="absolute w-full max-w-6xl border border-zinc-200 bg-white shadow-xl"
            style={{
              left: modalPos.x,
              top: modalPos.y,
            }}
          >
            <div
  className="cursor-move border-b border-zinc-200 px-6 py-3"
  onMouseDown={(e) => {
    setArrastrandoModal(true);
    setOffsetModal({
      x: e.clientX - modalPos.x,
      y: e.clientY - modalPos.y,
    });
  }}
>
  <div className="flex items-center justify-between gap-4">
    <h2 className="text-lg font-semibold">
      {sorteoEditando ? "Editar sorteo" : "Nuevo sorteo"}
    </h2>

    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-zinc-700">
        Fecha
      </label>

      <input
        type="date"
        value={fechaSorteo}
        onChange={(e) => setFechaSorteo(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-40 border border-zinc-300 px-2 py-1 text-sm"
      />
    </div>
  </div>
</div>

              <div className="space-y-3 p-4">

                <div className="grid grid-cols-2 gap-6">

                <div className="border border-zinc-200 p-4">

<div className="mb-4 flex items-center justify-between">
  <h3 className="font-semibold text-red-900">
    Falla
  </h3>

  <input
  type="text"
  value={numeroFalla || ""}
  onChange={(e) => setNumeroFalla(e.target.value)}
  className="w-36 border border-zinc-300 px-2 py-1 text-center text-2xl font-bold tracking-wider"
/>
</div>

<div className="grid grid-cols-2 gap-x-8 gap-y-3">

  {/* CANTIDADES */}

  <div className="flex items-center justify-between">
  <label className="text-sm">Nº Décimos</label>
  <input
    type="number"
    value={decimosFalla || 0}
    onChange={(e) => setDecimosFalla(Number(e.target.value))}
    className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
  />
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Precio décimo</label>
  <div className="flex items-center">
    <input
      type="number"
      step="0.01"
      value={precioDecimoFalla || 0}
      onChange={(e) => setPrecioDecimoFalla(Number(e.target.value))}
      className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
    />
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Papeletas emitidas</label>
  <input
    type="number"
    value={papeletasEmitidasFalla}
readOnly
    className="w-24 border border-zinc-300 bg-zinc-100 px-2 py-1 text-right text-sm"
  />
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Precio papeleta venta</label>
  <div className="flex items-center">
    <input
      type="number"
      step="0.01"
      value={(importePapeletaFalla + beneficioFalla).toFixed(2)}
      readOnly
      className="w-24 border border-zinc-300 bg-zinc-100 px-2 py-1 text-right text-sm"
    />
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Papeletas socios</label>
  <input
  type="number"
  value={papeletasFalla || 0}
  readOnly
  className="w-24 border border-zinc-300 bg-zinc-100 px-2 py-1 text-right text-sm"
/>
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Importe jugado</label>
  <div className="flex items-center">
  <input
  type="number"
  step="0.01"
  value={importePapeletaFalla}
  onChange={(e) => setImportePapeletaFalla(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Papeletas sobrantes</label>
  <input
    type="number"
    value={papeletasSobrantesFalla}
readOnly
    onChange={(e) => setSobrantesFalla(Number(e.target.value))}
    className="w-24 border border-zinc-300 bg-zinc-100 px-2 py-1 text-right text-sm"
  />
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Beneficio papeleta</label>
  <div className="flex items-center">
    <input
      type="number"
      step="0.01"
      value={beneficioFalla || 0}
      onChange={(e) => setBeneficioFalla(Number(e.target.value))}
      className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
    />
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Premio papeletas</label>
  <div className="flex items-center">
    <input
      type="number"
      step="0.01"
      value={premioFallaPorPapeleta || 0}
      onChange={(e) => setPremioFallaPorPapeleta(Number(e.target.value))}
      className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
    />
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

</div>

<hr className="my-4" />

<div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">

  <div className="flex items-center justify-between">
  <span>Recaudación socios</span>
  <span className="font-semibold">{euros(recaudacionSociosFalla)}</span>
</div>

<div className="flex items-center justify-between">
  <span>Pago administración</span>
  <span className="font-semibold">
    {euros(importePagoAdministracionFalla)}
  </span>
</div>

<div className="flex items-center justify-between">
  <span>Importe jugado socios</span>
  <span className="font-semibold">{euros(importeJugadoSociosFalla)}</span>
</div>

<div className="flex items-center justify-between">
  <div>
    <div>Jugado falla</div>
    <div className="text-xs text-zinc-500">
      Sobrantes + resto sobrante
    </div>
  </div>

  <span className="font-semibold">
    {euros(jugadoFalla)}
  </span>
</div>

<div className="flex items-center justify-between">
  <span>Beneficio socios</span>
  <span className="font-semibold">{euros(beneficioSociosFalla)}</span>
</div>

<div className="flex items-center justify-between">
  <span>Beneficio premio sobrantes</span>
  <span className="font-semibold">{euros(beneficioPremioFalla)}</span>
</div>

</div>

</div>

<div className="border border-zinc-200 p-4">

<div className="mb-4 flex items-center justify-between">
  <h3 className="font-semibold text-blue-900">
    Virgen
  </h3>

  <input
  type="text"
  value={numeroVirgen || ""}
  onChange={(e) => setNumeroVirgen(e.target.value)}
  className="w-36 border border-zinc-300 px-2 py-1 text-center text-2xl font-bold tracking-wider"
/>
</div>

<div className="grid grid-cols-2 gap-x-8 gap-y-3">

  {/* CANTIDADES */}

  <div className="flex items-center justify-between">
  <label className="text-sm">Nº Décimos</label>
  <input
    type="number"
    value={decimosVirgen || 0}
    onChange={(e) => setDecimosVirgen(Number(e.target.value))}
    className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
  />
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Precio décimo</label>
  <div className="flex items-center">
    <input
      type="number"
      step="0.01"
      value={precioDecimoVirgen || 0}
      onChange={(e) => setPrecioDecimoVirgen(Number(e.target.value))}
      className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
    />
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Papeletas emitidas</label>
  <input
    type="number"
    value={papeletasEmitidasVirgen}
readOnly
    className="w-24 border border-zinc-300 bg-zinc-100 px-2 py-1 text-right text-sm"
  />
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Precio papeleta venta</label>
  <div className="flex items-center">
    <input
      type="number"
      step="0.01"
      value={(importePapeletaVirgen + beneficioVirgen).toFixed(2)}
      readOnly
      className="w-24 border border-zinc-300 bg-zinc-100 px-2 py-1 text-right text-sm"
    />
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Papeletas socios</label>
  <input
  type="number"
  value={papeletasVirgen || 0}
  readOnly
  className="w-24 border border-zinc-300 bg-zinc-100 px-2 py-1 text-right text-sm"
/>
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Importe jugado</label>
  <div className="flex items-center">
  <input
  type="number"
  step="0.01"
  value={importePapeletaVirgen}
  onChange={(e) => setImportePapeletaVirgen(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Papeletas sobrantes</label>
  <input
    type="number"
    value={papeletasSobrantesVirgen}
readOnly
    onChange={(e) => setSobrantesVirgen(Number(e.target.value))}
    className="w-24 border border-zinc-300 bg-zinc-100 px-2 py-1 text-right text-sm"
  />
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Beneficio papeleta</label>
  <div className="flex items-center">
    <input
      type="number"
      step="0.01"
      value={beneficioVirgen || 0}
      onChange={(e) => setBeneficioVirgen(Number(e.target.value))}
      className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
    />
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Premio papeletas</label>
  <div className="flex items-center">
    <input
      type="number"
      step="0.01"
      value={premioVirgenPorPapeleta || 0}
      onChange={(e) => setPremioVirgenPorPapeleta(Number(e.target.value))}
      className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
    />
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

</div>

<hr className="my-4" />

<div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">

  <div className="flex items-center justify-between">
  <span>Recaudación socios</span>
  <span className="font-semibold">{euros(recaudacionSociosVirgen)}</span>
</div>

<div className="flex items-center justify-between">
  <span>Pago administración</span>
  <span className="font-semibold">
    {euros(importePagoAdministracionVirgen)}
  </span>
</div>

<div className="flex items-center justify-between">
  <span>Importe jugado socios</span>
  <span className="font-semibold">{euros(importeJugadoSociosVirgen)}</span>
</div>

<div className="flex items-center justify-between">
  <div>
    <div>Jugado falla</div>
    <div className="text-xs text-zinc-500">
      Sobrantes + resto sobrante
    </div>
  </div>

  <span className="font-semibold">
    {euros(jugadoVirgen)}
  </span>
</div>

<div className="flex items-center justify-between">
  <span>Beneficio socios</span>
  <span className="font-semibold">{euros(beneficioSociosVirgen)}</span>
</div>

<div className="flex items-center justify-between">
  <span>Beneficio premio sobrantes</span>
  <span className="font-semibold">{euros(beneficioPremioVirgen)}</span>
</div>

</div>

</div>

</div>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-200 px-6 py-4">
                <button
                  onClick={() => setMostrarModal(false)}
                  className="bg-zinc-300 px-4 py-2 text-sm"
                >
                  Cancelar
                </button>

                <button
  onClick={guardarSorteo}
  className="bg-red-900 px-4 py-2 text-sm text-white hover:bg-red-950"
>
  Guardar
</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}