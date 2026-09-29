"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import EntregaNavidadModal from "../../components/EntregaNavidadModal";
import { supabase } from "../../../lib/supabaseClient";
import { normalizarTexto } from "@/lib/texto";
import CabeceraOrdenable from "@/app/components/CabeceraOrdenable";
import { exportarExcel as descargarExcel } from "@/lib/excel";
import PagoModal from "@/app/components/PagoModal";

const entregaVacia = {
  ID: null,
  NUMCENS: null,
  NombreExterno: "",
  Sorteo: "Navidad",
  FechaEntrega: new Date().toISOString().slice(0, 10),

  PapeletasFalla: 0,
  DevueltasFalla: 0,
  SerieFalla: "",

  PapeletasVirgen: 0,
  DevueltasVirgen: 0,
  SerieVirgen: "",

  Recibo: "",
  Observaciones: "",
};

function euros(valor: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(valor || 0));
}

export default function NavidadPage() {

  const [mostrarNavidad, setMostrarNavidad] = useState(true);
  const [mostrarNino, setMostrarNino] = useState(false);
  
  const [socios, setSocios] = useState<any[]>([]);
  
  const [cargando, setCargando] = useState(true);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [entregaEditando, setEntregaEditando] = useState<any>(null);
  
  const [busquedaSocio, setBusquedaSocio] = useState("");
  const [busquedaEntregas, setBusquedaEntregas] = useState("");

  const [entregas, setEntregas] = useState<any[]>([]);
  const [entrega, setEntrega] = useState(entregaVacia);
  const [ejercicioActivo, setEjercicioActivo] = useState<number | null>(null);

  const [sociosLoteria, setSociosLoteria] = useState<any[]>([]);

  const [campoOrden, setCampoOrden] = useState("socio");
const [direccionOrden, setDireccionOrden] =
  useState<"asc" | "desc">("asc");

  const [pagosNavidad, setPagosNavidad] = useState<any[]>([]);

  const [configuracion, setConfiguracion] = useState({
    FechaSorteo: "",
  
    NumeroFalla: "",
    DecimosFalla: 0,
    PrecioDecimoFalla: 0,
    ImportePapeletaFalla: 0,
    BeneficioPapeletaFalla: 0,
    PremioPorPapeletaFalla: 0,
  
    NumeroVirgen: "",
    DecimosVirgen: 0,
    PrecioDecimoVirgen: 0,
    ImportePapeletaVirgen: 0,
    BeneficioPapeletaVirgen: 0,
    PremioPorPapeletaVirgen: 0,
  });
  
  const [modalPagoAbierto, setModalPagoAbierto] =
    useState(false);
  
  const pagoVacio = {
    ID: null,
    IDEntrega: null,
    FechaPago: "",
    Importe: 0,
    Observaciones: "",
  };
  
  const [pago, setPago] = useState(pagoVacio);
  
  const [pagoEditando, setPagoEditando] =
    useState<any>(null);
  
  useEffect(() => {
    cargarDatos();
  }, []);
      
      async function cargarDatos() {
        setCargando(true);

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

    setEjercicioActivo(ejercicioActual);

    const [
      { data: entregasData, error: errorEntregas },
      { data: sociosData, error: errorSocios },
      { data: sociosLoteriaData, error: errorSociosLoteria },
      { data: configuracionData, error: errorConfiguracion },
      { data: pagosData, error: errorPagos },
    ] = await Promise.all([
          supabase
  .from("LOTERIA_SORTEO_NAVIDAD")
  .select("*")
  .eq("Ejercicio", ejercicioActual)
  .eq("Sorteo", "Navidad")
  .order("FechaEntrega", { ascending: false }),
      
          supabase
            .from("SOCIOS")
            .select("*"),
        
          supabase
            .from("SOCIOS_LOTERIA")
            .select("*"),

            supabase
  .from("LOTERIA_NAVIDAD_CONFIGURACION")
  .select("*")
  .eq("Ejercicio", ejercicioActual)
  .eq("Sorteo", "Navidad")
  .maybeSingle(),

  supabase
    .from("LOTERIA_NAVIDAD_PAGOS")
    .select("*")
    .order("FechaPago", { ascending: true }),
        ]);
      
        if (errorEntregas) {
          console.error(errorEntregas);
        }
      
        if (errorSocios) {
          console.error(errorSocios);
        }

        if (errorSociosLoteria) {
          console.error(errorSociosLoteria);
        }

        if (errorConfiguracion) {
          console.error(errorConfiguracion);
        }
      
        if (errorPagos) {
          alert(errorPagos.message);
          return;
        }

        setEntregas(entregasData || []);
        setSocios(sociosData || []);
        setSociosLoteria(sociosLoteriaData || []);
        setPagosNavidad(pagosData || []);

        const config: any = configuracionData;

if (config) {
  setConfiguracion({
    FechaSorteo: config.FechaSorteo || "",

    NumeroFalla: config.NumeroFalla || "",
    DecimosFalla: Number(config.DecimosFalla || 0),
    PrecioDecimoFalla: Number(config.PrecioDecimoFalla || 0),
    ImportePapeletaFalla: Number(config.ImportePapeletaFalla || 0),
    BeneficioPapeletaFalla: Number(config.BeneficioPapeletaFalla || 0),
    PremioPorPapeletaFalla: Number(config.PremioPorPapeletaFalla || 0),

    NumeroVirgen: config.NumeroVirgen || "",
    DecimosVirgen: Number(config.DecimosVirgen || 0),
    PrecioDecimoVirgen: Number(config.PrecioDecimoVirgen || 0),
    ImportePapeletaVirgen: Number(config.ImportePapeletaVirgen || 0),
    BeneficioPapeletaVirgen: Number(config.BeneficioPapeletaVirgen || 0),
    PremioPorPapeletaVirgen: Number(config.PremioPorPapeletaVirgen || 0),
  });
} else {
  setConfiguracion({
    FechaSorteo: ejercicioActual
      ? `${ejercicioActual - 1}-12-22`
      : "",

    NumeroFalla: "",
    DecimosFalla: 0,
    PrecioDecimoFalla: 0,
    ImportePapeletaFalla: 0,
    BeneficioPapeletaFalla: 0,
    PremioPorPapeletaFalla: 0,

    NumeroVirgen: "",
    DecimosVirgen: 0,
    PrecioDecimoVirgen: 0,
    ImportePapeletaVirgen: 0,
    BeneficioPapeletaVirgen: 0,
    PremioPorPapeletaVirgen: 0,
  });
}

setCargando(false);
      }
      
      async function borrarEntrega(id: number) {
        const confirmar = window.confirm("¿Seguro que quieres borrar esta entrega?");
        if (!confirmar) return;
      
        const { error } = await supabase
          .from("LOTERIA_SORTEO_NAVIDAD")
          .delete()
          .eq("ID", id);
      
        if (error) {
          console.error("Error borrando entrega:", error);
          alert("No se ha podido borrar la entrega");
          return;
        }
      
        await cargarDatos();
      }
      function normalizar(texto: string) {
        return normalizarTexto(texto);
      }
      
      function textoSocio(socio: any) {
        return `${socio.Apellidos || ""}, ${socio.Nombre || ""} · NUMCENS ${socio.NUMCENS}`;
      }
      
      function obtenerSocioLoteria(numcens: number | null) {
        if (numcens === null || numcens === undefined) return null;
      
        return (
          sociosLoteria.find((grupo: any) => {
            const esResponsable =
              Number(grupo.NUMCENS_Responsable) === Number(numcens);
      
            const esMiembro = (grupo.Miembros || []).some(
              (miembro: any) =>
                Number(miembro.NUMCENS ?? miembro) === Number(numcens)
            );
      
            return esResponsable || esMiembro;
          }) || null
        );
      }

      function sociosFiltrados(texto: string) {
        if (!texto.trim()) return [];
      
        const busquedaNormalizada = normalizarTexto(texto.trim());
      
        return socios
          .filter((socio) => {
            const nombreCompleto = normalizarTexto(
              `${socio.Apellidos || ""} ${socio.Nombre || ""}`
            );
      
            const nombreInvertido = normalizarTexto(
              `${socio.Nombre || ""} ${socio.Apellidos || ""}`
            );
      
            const numcens = String(socio.NUMCENS || "");
      
            return (
              nombreCompleto.includes(busquedaNormalizada) ||
              nombreInvertido.includes(busquedaNormalizada) ||
              numcens.includes(busquedaNormalizada)
            );
          })
          .slice(0, 30);
      }

      function seleccionarSocio(socio: any) {
        const ficha = obtenerSocioLoteria(socio.NUMCENS);
      
        setEntrega({
          ...entrega,
          NUMCENS: socio.NUMCENS,
          NombreExterno: "",
      
          PapeletasFalla: Number(ficha?.PapeletasNavidadFalla || 0),
          DevueltasFalla: 0,
          SerieFalla: "",
      
          PapeletasVirgen: Number(ficha?.PapeletasNavidadVirgen || 0),
          DevueltasVirgen: 0,
          SerieVirgen: "",
        });
      
        setBusquedaSocio(textoSocio(socio));
      }


      async function guardarEntrega() {
        if (!ejercicioActivo) {
          alert("No se ha encontrado un ejercicio activo.");
          return;
        }
      
        if (!entrega.NUMCENS && !entrega.NombreExterno.trim()) {
          alert("Selecciona un socio o registra una persona externa.");
          return;
        }
      
        if (!entrega.FechaEntrega) {
          alert("Selecciona la fecha de entrega.");
          return;
        }
      
        const papeletasFalla = Number(entrega.PapeletasFalla || 0);
        const devueltasFalla = Number(entrega.DevueltasFalla || 0);
      
        const papeletasVirgen = Number(entrega.PapeletasVirgen || 0);
        const devueltasVirgen = Number(entrega.DevueltasVirgen || 0);
      
        if (papeletasFalla <= 0 && papeletasVirgen <= 0) {
          alert("Indica al menos una papeleta de Falla o Virgen.");
          return;
        }
      
        if (devueltasFalla > papeletasFalla) {
          alert(
            "Las papeletas devueltas de Falla no pueden superar las entregadas."
          );
          return;
        }
      
        if (devueltasVirgen > papeletasVirgen) {
          alert(
            "Las papeletas devueltas de Virgen no pueden superar las entregadas."
          );
          return;
        }
      
        const datos = {
          Ejercicio: ejercicioActivo,
          NUMCENS: entrega.NUMCENS,
          NombreExterno: entrega.NombreExterno || null,
          Sorteo: "Navidad",
          FechaEntrega: entrega.FechaEntrega,
        
          // FALLA
          PapeletasFalla: Number(entrega.PapeletasFalla || 0),
          DevueltasFalla: Number(entrega.DevueltasFalla || 0),
          SerieFalla: entrega.SerieFalla || null,
        
          // VIRGEN
          PapeletasVirgen: Number(entrega.PapeletasVirgen || 0),
          DevueltasVirgen: Number(entrega.DevueltasVirgen || 0),
          SerieVirgen: entrega.SerieVirgen || null,
        
          // DATOS COMUNES DEL RECIBO
          Recibo: entrega.Recibo || null,
          Observaciones: entrega.Observaciones || null,
        };
        let error;
      
        if (entregaEditando?.ID) {
          ({ error } = await (supabase as any)
            .from("LOTERIA_SORTEO_NAVIDAD")
            .update(datos)
            .eq("ID", entregaEditando.ID));
        } else {
          ({ error } = await (supabase as any)
            .from("LOTERIA_SORTEO_NAVIDAD")
            .insert(datos));
        }
      
        if (error) {
          alert("Error guardando la entrega: " + error.message);
          return;
        }
      
        await cargarDatos();
      
        setModalAbierto(false);
        setEntregaEditando(null);
        setBusquedaSocio("");
        setEntrega(entregaVacia);
      }

      async function guardarConfiguracion() {
        if (!ejercicioActivo) {
          alert("No se ha encontrado un ejercicio activo.");
          return;
        }

        const datos = {
          Ejercicio: ejercicioActivo,
          Sorteo: "Navidad",
          FechaSorteo: configuracion.FechaSorteo || null,
        
          // FALLA
          NumeroFalla: configuracion.NumeroFalla || null,
          DecimosFalla: Number(configuracion.DecimosFalla || 0),
          PrecioDecimoFalla: Number(configuracion.PrecioDecimoFalla || 0),
          ImportePapeletaFalla: Number(
            configuracion.ImportePapeletaFalla || 0
          ),
          BeneficioPapeletaFalla: Number(
            configuracion.BeneficioPapeletaFalla || 0
          ),
          PremioPorPapeletaFalla: Number(
            configuracion.PremioPorPapeletaFalla || 0
          ),
        
          // VIRGEN
          NumeroVirgen: configuracion.NumeroVirgen || null,
          DecimosVirgen: Number(configuracion.DecimosVirgen || 0),
          PrecioDecimoVirgen: Number(configuracion.PrecioDecimoVirgen || 0),
          ImportePapeletaVirgen: Number(
            configuracion.ImportePapeletaVirgen || 0
          ),
          BeneficioPapeletaVirgen: Number(
            configuracion.BeneficioPapeletaVirgen || 0
          ),
          PremioPorPapeletaVirgen: Number(
            configuracion.PremioPorPapeletaVirgen || 0
          ),
        
          UpdatedAt: new Date().toISOString(),
        };
      
        const { error } = await (supabase as any)
          .from("LOTERIA_NAVIDAD_CONFIGURACION")
          .upsert(datos, {
            onConflict: "Ejercicio,Sorteo",
          });
      
        if (error) {
          alert("Error guardando la configuración: " + error.message);
          return;
        }
      
        alert("Configuración guardada correctamente");
        await cargarDatos();
      }

      // ==============================
// RESUMEN FALLA
// ==============================

const papeletasEmitidasFalla =
configuracion.ImportePapeletaFalla > 0
  ? Math.floor(
      (configuracion.DecimosFalla *
        configuracion.PrecioDecimoFalla) /
        configuracion.ImportePapeletaFalla
    )
  : 0;

const papeletasEntregadasFalla = entregas.reduce(
(suma, e) => suma + Number(e.PapeletasFalla || 0),
0
);

const papeletasDevueltasFalla = entregas.reduce(
(suma, e) => suma + Number(e.DevueltasFalla || 0),
0
);

const papeletasVendidasFalla =
papeletasEntregadasFalla - papeletasDevueltasFalla;

const recaudacionSociosFalla =
papeletasVendidasFalla *
(configuracion.ImportePapeletaFalla -
  configuracion.BeneficioPapeletaFalla);

const pagoAdministracionFalla =
configuracion.DecimosFalla *
configuracion.PrecioDecimoFalla;

const beneficioSociosFalla =
papeletasVendidasFalla *
configuracion.BeneficioPapeletaFalla;


// ==============================
// RESUMEN VIRGEN
// ==============================

const papeletasEmitidasVirgen =
configuracion.ImportePapeletaVirgen > 0
  ? Math.floor(
      (configuracion.DecimosVirgen *
        configuracion.PrecioDecimoVirgen) /
        configuracion.ImportePapeletaVirgen
    )
  : 0;

const papeletasEntregadasVirgen = entregas.reduce(
(suma, e) => suma + Number(e.PapeletasVirgen || 0),
0
);

const papeletasDevueltasVirgen = entregas.reduce(
(suma, e) => suma + Number(e.DevueltasVirgen || 0),
0
);

const papeletasVendidasVirgen =
papeletasEntregadasVirgen - papeletasDevueltasVirgen;

const recaudacionSociosVirgen =
papeletasVendidasVirgen *
(configuracion.ImportePapeletaVirgen -
  configuracion.BeneficioPapeletaVirgen);

const pagoAdministracionVirgen =
configuracion.DecimosVirgen *
configuracion.PrecioDecimoVirgen;

const beneficioSociosVirgen =
papeletasVendidasVirgen *
configuracion.BeneficioPapeletaVirgen;

  const importePagado = entregas.reduce(
    (suma, e) => suma + totalPagadoEntrega(e.ID),
    0
  );

  const pendienteCobro = entregas.reduce((suma, fila) => {
    // FALLA
    const vendidasFalla = Math.max(
      0,
      Number(fila.PapeletasFalla || 0) -
        Number(fila.DevueltasFalla || 0)
    );
  
    const totalFalla =
      vendidasFalla *
      Number(configuracion.ImportePapeletaFalla || 0);
  
    // VIRGEN
    const vendidasVirgen = Math.max(
      0,
      Number(fila.PapeletasVirgen || 0) -
        Number(fila.DevueltasVirgen || 0)
    );
  
    const totalVirgen =
      vendidasVirgen *
      Number(configuracion.ImportePapeletaVirgen || 0);
  
    // TOTAL DEL RECIBO
    const totalFila = totalFalla + totalVirgen;
  
    const pagadoFila = totalPagadoEntrega(fila.ID);
  
    const pendienteFila = Math.max(
      0,
      totalFila - pagadoFila
    );
  
    return suma + pendienteFila;
  }, 0);
  
function editarEntrega(fila: any) {
  setEntregaEditando(fila);

  setEntrega({
    ID: fila.ID ?? null,
    NUMCENS: fila.NUMCENS ?? null,
    NombreExterno: fila.NombreExterno || "",
    Sorteo: "Navidad",
    FechaEntrega: fila.FechaEntrega || "",

    PapeletasFalla: Number(fila.PapeletasFalla || 0),
    DevueltasFalla: Number(fila.DevueltasFalla || 0),
    SerieFalla: fila.SerieFalla || "",

    PapeletasVirgen: Number(fila.PapeletasVirgen || 0),
    DevueltasVirgen: Number(fila.DevueltasVirgen || 0),
    SerieVirgen: fila.SerieVirgen || "",

    Recibo: fila.Recibo || "",
    Observaciones: fila.Observaciones || "",
  });

  if (fila.NUMCENS) {
    const socio = socios.find(
      (s) => Number(s.NUMCENS) === Number(fila.NUMCENS)
    );

    setBusquedaSocio(
      socio
        ? textoSocio(socio)
        : `NUMCENS ${fila.NUMCENS}`
    );
  } else {
    setBusquedaSocio("");
  }

  setModalAbierto(true);
}

  async function eliminarEntrega(id: number) {
    const confirmar = window.confirm(
      "¿Seguro que quieres eliminar esta entrega?"
    );
  
    if (!confirmar) return;
  
    const { error } = await (supabase as any)
      .from("LOTERIA_SORTEO_NAVIDAD")
      .delete()
      .eq("ID", id);
  
    if (error) {
      alert("Error eliminando la entrega: " + error.message);
      return;
    }
  
    await cargarDatos();
  }

  const entregasFiltradas = entregas.filter((fila: any) => {
    const socio = socios.find(
      (s: any) => Number(s.NUMCENS) === Number(fila.NUMCENS)
    );
  
    const nombre = fila.NombreExterno
      ? fila.NombreExterno
      : `${socio?.Apellidos || ""}, ${socio?.Nombre || ""}`;
  
      const papeletasFalla = Number(fila.PapeletasFalla || 0);
      const devueltasFalla = Number(fila.DevueltasFalla || 0);
      const vendidasFalla = Math.max(
        0,
        papeletasFalla - devueltasFalla
      );
      
      const papeletasVirgen = Number(fila.PapeletasVirgen || 0);
      const devueltasVirgen = Number(fila.DevueltasVirgen || 0);
      const vendidasVirgen = Math.max(
        0,
        papeletasVirgen - devueltasVirgen
      );
      
      const importeTotal =
        vendidasFalla *
          Number(configuracion.ImportePapeletaFalla || 0) +
        vendidasVirgen *
          Number(configuracion.ImportePapeletaVirgen || 0);
      
      const importePagado = totalPagadoEntrega(fila.ID);
      
      const pendiente = Math.max(
        0,
        importeTotal - importePagado
      );
  
    const textoBusqueda = normalizarTexto(busquedaEntregas);
  
    if (!textoBusqueda) return true;
  
    const contenido = normalizarTexto(
      [
        nombre,
        fila.NUMCENS,
        fila.NombreExterno,
    
        fila.SerieFalla,
        fila.SerieVirgen,
    
        fila.FechaEntrega,
    
        papeletasFalla,
        devueltasFalla,
        vendidasFalla,
    
        papeletasVirgen,
        devueltasVirgen,
        vendidasVirgen,
    
        importePagado,
        pendiente,
    
        pendiente > 0 ? "pendiente" : "pagado",
    
        devueltasFalla > 0 || devueltasVirgen > 0
          ? "devueltas devolucion"
          : "",
      ].join(" ")
    );
  
    return contenido.includes(textoBusqueda);
  });

  const entregasOrdenadas = [...entregasFiltradas].sort(
    (a: any, b: any) => {
      const socioA = socios.find(
        (s: any) => Number(s.NUMCENS) === Number(a.NUMCENS)
      );
  
      const socioB = socios.find(
        (s: any) => Number(s.NUMCENS) === Number(b.NUMCENS)
      );
  
      const nombreA = normalizarTexto(
        a.NombreExterno ||
          `${socioA?.Apellidos || ""}, ${socioA?.Nombre || ""}`
      );
  
      const nombreB = normalizarTexto(
        b.NombreExterno ||
          `${socioB?.Apellidos || ""}, ${socioB?.Nombre || ""}`
      );
  
      // FALLA - FILA A
const vendidasFallaA = Math.max(
  0,
  Number(a.PapeletasFalla || 0) -
    Number(a.DevueltasFalla || 0)
);

// VIRGEN - FILA A
const vendidasVirgenA = Math.max(
  0,
  Number(a.PapeletasVirgen || 0) -
    Number(a.DevueltasVirgen || 0)
);

// FALLA - FILA B
const vendidasFallaB = Math.max(
  0,
  Number(b.PapeletasFalla || 0) -
    Number(b.DevueltasFalla || 0)
);

// VIRGEN - FILA B
const vendidasVirgenB = Math.max(
  0,
  Number(b.PapeletasVirgen || 0) -
    Number(b.DevueltasVirgen || 0)
);

const totalA =
  vendidasFallaA *
    Number(configuracion.ImportePapeletaFalla || 0) +
  vendidasVirgenA *
    Number(configuracion.ImportePapeletaVirgen || 0);

const totalB =
  vendidasFallaB *
    Number(configuracion.ImportePapeletaFalla || 0) +
  vendidasVirgenB *
    Number(configuracion.ImportePapeletaVirgen || 0);

const pendienteA = Math.max(
  0,
  totalA - totalPagadoEntrega(a.ID)
);

const pendienteB = Math.max(
  0,
  totalB - totalPagadoEntrega(b.ID)
);
  
      let comparacion = 0;
  
      if (campoOrden === "socio") {
        comparacion = nombreA.localeCompare(nombreB, "es");
      }
  
      if (campoOrden === "serie") {
        const serieA = `${a.SerieFalla || ""} ${a.SerieVirgen || ""}`;
        const serieB = `${b.SerieFalla || ""} ${b.SerieVirgen || ""}`;
      
        comparacion = serieA.localeCompare(
          serieB,
          "es",
          { numeric: true }
        );
      }
  
      if (campoOrden === "pendiente") {
        comparacion = pendienteA - pendienteB;
      }
  
      return direccionOrden === "asc"
        ? comparacion
        : -comparacion;
    }
  );

  function ordenarPor(campo: string) {
    if (campo === campoOrden) {
      setDireccionOrden(
        direccionOrden === "asc" ? "desc" : "asc"
      );
    } else {
      setCampoOrden(campo);
      setDireccionOrden("asc");
    }
  }
  function exportarExcel() {
  const datos = entregasOrdenadas.map((fila: any) => {
    const socio = socios.find(
      (s: any) => Number(s.NUMCENS) === Number(fila.NUMCENS)
    );

    const nombre =
      fila.NombreExterno ||
      `${socio?.Apellidos || ""}, ${socio?.Nombre || ""}`;

    // FALLA
    const papeletasFalla = Number(fila.PapeletasFalla || 0);
    const devueltasFalla = Number(fila.DevueltasFalla || 0);

    const vendidasFalla = Math.max(
      0,
      papeletasFalla - devueltasFalla
    );

    // VIRGEN
    const papeletasVirgen = Number(fila.PapeletasVirgen || 0);
    const devueltasVirgen = Number(fila.DevueltasVirgen || 0);

    const vendidasVirgen = Math.max(
      0,
      papeletasVirgen - devueltasVirgen
    );

    // TOTAL VENDIDAS
    const vendidasTotal =
      vendidasFalla + vendidasVirgen;

    // IMPORTES
    const totalFalla =
      vendidasFalla *
      Number(configuracion.ImportePapeletaFalla || 0);

    const totalVirgen =
      vendidasVirgen *
      Number(configuracion.ImportePapeletaVirgen || 0);

    const total = totalFalla + totalVirgen;

    const pagado = totalPagadoEntrega(fila.ID);

    const pendiente = Math.max(
      0,
      total - pagado
    );

    return {
      socio: nombre,
      numcens: fila.NUMCENS || "",
      fecha: fila.FechaEntrega || "",
      recibo: fila.Recibo || "",

      // FALLA
      entregadasFalla: papeletasFalla,
      devueltasFalla,
      vendidasFalla,
      serieFalla: fila.SerieFalla || "",

      // VIRGEN
      entregadasVirgen: papeletasVirgen,
      devueltasVirgen,
      vendidasVirgen,
      serieVirgen: fila.SerieVirgen || "",

      // TOTALES
      vendidasTotal,
      total,
      pagado,
      pendiente,

      estado: pendiente > 0 ? "Pendiente" : "Pagado",

      observaciones: fila.Observaciones || "",
    };
  });

  descargarExcel({
    nombreArchivo: `navidad-${ejercicioActivo || "ejercicio"}.xlsx`,
    nombreHoja: "Navidad",

    columnas: [
      {
        titulo: "Socio",
        campo: "socio",
        ancho: 32,
        tipo: "texto",
      },
      {
        titulo: "NUMCENS",
        campo: "numcens",
        ancho: 10,
        tipo: "texto",
      },
      {
        titulo: "Fecha",
        campo: "fecha",
        ancho: 13,
        tipo: "fecha",
      },
      {
        titulo: "Recibo nº",
        campo: "recibo",
        ancho: 12,
        tipo: "texto",
      },

      // FALLA
      {
        titulo: "Falla - Entregadas",
        campo: "entregadasFalla",
        ancho: 16,
        tipo: "numero",
      },
      {
        titulo: "Falla - Devueltas",
        campo: "devueltasFalla",
        ancho: 16,
        tipo: "numero",
      },
      {
        titulo: "Falla - Vendidas",
        campo: "vendidasFalla",
        ancho: 15,
        tipo: "numero",
      },
      {
        titulo: "Falla - Serie",
        campo: "serieFalla",
        ancho: 18,
        tipo: "texto",
      },

      // VIRGEN
      {
        titulo: "Virgen - Entregadas",
        campo: "entregadasVirgen",
        ancho: 17,
        tipo: "numero",
      },
      {
        titulo: "Virgen - Devueltas",
        campo: "devueltasVirgen",
        ancho: 17,
        tipo: "numero",
      },
      {
        titulo: "Virgen - Vendidas",
        campo: "vendidasVirgen",
        ancho: 16,
        tipo: "numero",
      },
      {
        titulo: "Virgen - Serie",
        campo: "serieVirgen",
        ancho: 18,
        tipo: "texto",
      },

      // TOTALES
      {
        titulo: "Vendidas total",
        campo: "vendidasTotal",
        ancho: 14,
        tipo: "numero",
      },
      {
        titulo: "Total",
        campo: "total",
        ancho: 13,
        tipo: "moneda",
      },
      {
        titulo: "Pagado",
        campo: "pagado",
        ancho: 13,
        tipo: "moneda",
      },
      {
        titulo: "Pendiente",
        campo: "pendiente",
        ancho: 13,
        tipo: "moneda",
      },
      {
        titulo: "Estado",
        campo: "estado",
        ancho: 12,
        tipo: "texto",
      },
      {
        titulo: "Observaciones",
        campo: "observaciones",
        ancho: 35,
        tipo: "texto",
      },
    ],

    datos,
  });
}

  function formatearFecha(fecha: string | null) {
    if (!fecha) return "—";
  
    const [year, month, day] = fecha.slice(0, 10).split("-");
  
    return `${day}/${month}/${year}`;
  }

  function totalPagadoEntrega(idEntrega: number) {
    return pagosNavidad
      .filter(
        (pago: any) =>
          Number(pago.IDEntrega) === Number(idEntrega)
      )
      .reduce(
        (total: number, pago: any) =>
          total + Number(pago.Importe || 0),
        0
      );
  }

  async function guardarPago() {
    if (!pago.IDEntrega) {
      alert("No se ha encontrado la entrega.");
      return;
    }
  
    if (!pago.FechaPago) {
      alert("Selecciona la fecha del pago.");
      return;
    }
  
    const importe = Number(pago.Importe || 0);
  
    if (importe <= 0) {
      alert("Introduce un importe válido.");
      return;
    }
  
    const vendidasFalla = Math.max(
      0,
      Number(entrega.PapeletasFalla || 0) -
        Number(entrega.DevueltasFalla || 0)
    );
    
    const vendidasVirgen = Math.max(
      0,
      Number(entrega.PapeletasVirgen || 0) -
        Number(entrega.DevueltasVirgen || 0)
    );
    
    const totalFalla =
      vendidasFalla *
      Number(configuracion?.ImportePapeletaFalla || 0);
    
    const totalVirgen =
      vendidasVirgen *
      Number(configuracion?.ImportePapeletaVirgen || 0);
    
    const totalEntrega = totalFalla + totalVirgen;
  
    const pagadoActual = totalPagadoEntrega(
      Number(pago.IDEntrega)
    );
  
    const pagadoSinMovimientoEditado =
      pagoEditando
        ? pagadoActual - Number(pagoEditando.Importe || 0)
        : pagadoActual;
  
    if (pagadoSinMovimientoEditado + importe > totalEntrega) {
      const maximo = Math.max(
        0,
        totalEntrega - pagadoSinMovimientoEditado
      );
  
      alert(
        `El importe máximo que se puede registrar es ${maximo.toFixed(
          2
        )} €.`
      );
      return;
    }
  
    const datos = {
      IDEntrega: Number(pago.IDEntrega),
      FechaPago: pago.FechaPago,
      Importe: importe,
      Observaciones: pago.Observaciones || null,
    };
  
    let error;
  
    if (pagoEditando) {
      ({ error } = await (supabase as any)
        .from("LOTERIA_NAVIDAD_PAGOS")
        .update(datos)
        .eq("ID", pagoEditando.ID));
    } else {
      ({ error } = await (supabase as any)
        .from("LOTERIA_NAVIDAD_PAGOS")
        .insert(datos));
    }
  
    if (error) {
      alert(error.message);
      return;
    }
  
    const { data: pagosData, error: errorPagos } =
      await (supabase as any)
        .from("LOTERIA_NAVIDAD_PAGOS")
        .select("*")
        .order("FechaPago", { ascending: true });
  
    if (errorPagos) {
      alert(errorPagos.message);
      return;
    }
  
    setPagosNavidad(pagosData || []);
    setModalPagoAbierto(false);
    setPago(pagoVacio);
    setPagoEditando(null);
  }

  function editarPago(pagoSeleccionado: any) {
    setPago({
      ...pagoSeleccionado,
    });
  
    setPagoEditando(pagoSeleccionado);
    setModalPagoAbierto(true);
  }

  async function eliminarPago(idPago: number) {
    const confirmar = window.confirm(
      "¿Seguro que quieres eliminar este pago?"
    );
  
    if (!confirmar) return;
  
    const { error } = await (supabase as any)
      .from("LOTERIA_NAVIDAD_PAGOS")
      .delete()
      .eq("ID", idPago);
  
    if (error) {
      alert(error.message);
      return;
    }
  
    const { data: pagosData, error: errorPagos } =
      await (supabase as any)
        .from("LOTERIA_NAVIDAD_PAGOS")
        .select("*")
        .order("FechaPago", { ascending: true });
  
    if (errorPagos) {
      alert(errorPagos.message);
      return;
    }
  
    setPagosNavidad(pagosData || []);
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">
        <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-l-4 border-red-900 px-6 py-5">
  <div>
    <h1 className="text-2xl font-bold text-zinc-900">
      Navidad
    </h1>

    <p className="mt-2 text-sm text-zinc-600">
      Gestión de entregas, series, pagos y devolución de papeletas.
    </p>
  </div>

  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() =>
        window.location.href = "/loterias/navidad/imprimir"
      }
      className="rounded bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900"
    >
      🖨️ Imprimir
    </button>

    <button
  type="button"
  onClick={exportarExcel}
  className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
>
  📗 Excel
</button>
  </div>
</div>
</section>
        </div>

        <EntregaNavidadModal
  abierto={modalAbierto}
  onClose={() => {
    setModalAbierto(false);
    setEntregaEditando(null);
    setBusquedaSocio("");
    setEntrega(entregaVacia);
  }}
  entregaEditando={entregaEditando}
  entrega={entrega}
  setEntrega={setEntrega}
  busquedaSocio={busquedaSocio}
  setBusquedaSocio={setBusquedaSocio}
  sociosFiltrados={sociosFiltrados}
  textoSocio={textoSocio}
  seleccionarSocio={seleccionarSocio}
  guardarEntrega={guardarEntrega}

  pagosEntrega={pagosNavidad.filter(
    (p: any) =>
      Number(p.IDEntrega) === Number(entregaEditando?.ID)
  )}

  totalPagado={totalPagadoEntrega(entregaEditando?.ID || 0)}

  importeTotal={
    Math.max(
      0,
      Number(entrega.PapeletasFalla || 0) -
        Number(entrega.DevueltasFalla || 0)
    ) *
      Number(configuracion.ImportePapeletaFalla || 0) +
    Math.max(
      0,
      Number(entrega.PapeletasVirgen || 0) -
        Number(entrega.DevueltasVirgen || 0)
    ) *
      Number(configuracion.ImportePapeletaVirgen || 0)
  }

  pendiente={
    Math.max(
      0,
      Math.max(
        0,
        Number(entrega.PapeletasFalla || 0) -
          Number(entrega.DevueltasFalla || 0)
      ) *
        Number(configuracion.ImportePapeletaFalla || 0) +
        Math.max(
          0,
          Number(entrega.PapeletasVirgen || 0) -
            Number(entrega.DevueltasVirgen || 0)
        ) *
          Number(configuracion.ImportePapeletaVirgen || 0) -
          totalPagadoEntrega(entrega.ID ?? 0)
    )
  }
  abrirNuevoPago={() => {
    setPago({
      ...pagoVacio,
      IDEntrega: entregaEditando?.ID,
      FechaPago: new Date().toISOString().slice(0, 10),
    });
  
    setPagoEditando(null);
    setModalPagoAbierto(true);
  }}

  editarPago={editarPago}
  eliminarPago={eliminarPago}
/>

<PagoModal
  abierto={modalPagoAbierto}
  titulo={pagoEditando ? "Editar pago" : "Registrar pago"}
  pago={pago}
  setPago={setPago}
  onClose={() => {
    setModalPagoAbierto(false);
    setPago(pagoVacio);
    setPagoEditando(null);
  }}
  onGuardar={guardarPago}
/>

<section className="mb-6 rounded border border-zinc-300 bg-white">
<div className="flex items-center justify-between gap-6 border-b border-zinc-300 bg-zinc-100 px-4 py-3">

<h2 className="whitespace-nowrap text-sm font-semibold uppercase text-zinc-700">
  Configuración Navidad
</h2>

<div className="ml-auto flex items-center gap-2">
  <label className="whitespace-nowrap text-sm font-medium text-zinc-700">
    Fecha sorteo
  </label>

  <input
    type="date"
    value={configuracion.FechaSorteo || ""}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        FechaSorteo: e.target.value,
      })
    }
    className="w-40 border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-red-900"
  />
</div>

<button
  type="button"
  onClick={guardarConfiguracion}
  className="whitespace-nowrap rounded bg-red-900 px-3 py-2 text-sm font-medium text-white hover:bg-red-950"
>
  💾 Guardar configuración
</button>

</div>

  <div className="p-6">

   {/* FALLA + VIRGEN COMPACTO */}
<div className="overflow-hidden rounded border border-zinc-300">

{/* CABECERA */}
<div className="grid grid-cols-[90px_repeat(6,1fr)] gap-3 border-b border-zinc-300 bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-600">
  <div>Tipo</div>
  <div>Número</div>
  <div>Nº décimos</div>
  <div>Precio décimo</div>
  <div>Importe papeleta</div>
  <div>Beneficio</div>
  <div>Premio / papeleta</div>
</div>

{/* FALLA */}
<div className="grid grid-cols-[90px_repeat(6,1fr)] items-center gap-3 border-b border-zinc-200 bg-red-50/40 px-3 py-2">
  <div className="text-sm font-bold text-red-900">
    FALLA
  </div>

  <input
    type="text"
    value={configuracion.NumeroFalla}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        NumeroFalla: e.target.value,
      })
    }
    className="w-full border border-zinc-300 px-2 py-1.5 text-sm"
  />

  <input
    type="number"
    value={configuracion.DecimosFalla}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        DecimosFalla: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-2 py-1.5 text-sm"
  />

  <input
    type="number"
    step="0.01"
    value={configuracion.PrecioDecimoFalla}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        PrecioDecimoFalla: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-2 py-1.5 text-sm"
  />

  <input
    type="number"
    step="0.01"
    value={configuracion.ImportePapeletaFalla}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        ImportePapeletaFalla: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-2 py-1.5 text-sm"
  />

  <input
    type="number"
    step="0.01"
    value={configuracion.BeneficioPapeletaFalla}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        BeneficioPapeletaFalla: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-2 py-1.5 text-sm"
  />

  <input
    type="number"
    step="0.01"
    value={configuracion.PremioPorPapeletaFalla}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        PremioPorPapeletaFalla: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-2 py-1.5 text-sm"
  />
</div>

{/* VIRGEN */}
<div className="grid grid-cols-[90px_repeat(6,1fr)] items-center gap-3 bg-blue-50/40 px-3 py-2">
  <div className="text-sm font-bold text-blue-900">
    VIRGEN
  </div>

  <input
    type="text"
    value={configuracion.NumeroVirgen}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        NumeroVirgen: e.target.value,
      })
    }
    className="w-full border border-zinc-300 px-2 py-1.5 text-sm"
  />

  <input
    type="number"
    value={configuracion.DecimosVirgen}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        DecimosVirgen: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-2 py-1.5 text-sm"
  />

  <input
    type="number"
    step="0.01"
    value={configuracion.PrecioDecimoVirgen}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        PrecioDecimoVirgen: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-2 py-1.5 text-sm"
  />

  <input
    type="number"
    step="0.01"
    value={configuracion.ImportePapeletaVirgen}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        ImportePapeletaVirgen: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-2 py-1.5 text-sm"
  />

  <input
    type="number"
    step="0.01"
    value={configuracion.BeneficioPapeletaVirgen}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        BeneficioPapeletaVirgen: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-2 py-1.5 text-sm"
  />

  <input
    type="number"
    step="0.01"
    value={configuracion.PremioPorPapeletaVirgen}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        PremioPorPapeletaVirgen: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-2 py-1.5 text-sm"
  />
</div>

</div>

    {/* ================= RESUMEN ================= */}
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

{/* RESUMEN FALLA */}
<div className="min-w-0 rounded border border-red-200 bg-red-50/20 p-4">
  <h3 className="mb-3 border-b border-red-100 pb-2 text-sm font-bold uppercase text-red-900">
    Resumen Falla
  </h3>

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-6">

    {/* CANTIDADES */}
    <div className="min-w-0 space-y-2 text-sm">

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase text-zinc-600">
          Emitidas
        </span>
        <span className="shrink-0 font-semibold">
          {papeletasEmitidasFalla}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase text-zinc-600">
          Entregadas
        </span>
        <span className="shrink-0 font-semibold">
          {papeletasEntregadasFalla}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase text-zinc-600">
          Devueltas
        </span>
        <span className="shrink-0 font-semibold">
          {papeletasDevueltasFalla}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase text-zinc-600">
          Vendidas
        </span>
        <span className="shrink-0 font-semibold">
          {papeletasVendidasFalla}
        </span>
      </div>

    </div>

    {/* DINERO */}
    <div className="min-w-0 space-y-2 border-t border-zinc-200 pt-4 text-sm sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">

      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-xs font-medium uppercase text-zinc-600">
          Pago administración
        </span>
        <span className="shrink-0 whitespace-nowrap font-semibold">
          {euros(pagoAdministracionFalla)}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-xs font-medium uppercase text-zinc-600">
          Recaudación socios
        </span>
        <span className="shrink-0 whitespace-nowrap font-semibold">
          {euros(recaudacionSociosFalla)}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-xs font-medium uppercase text-zinc-600">
          Beneficio socios
        </span>
        <span className="shrink-0 whitespace-nowrap font-semibold">
          {euros(beneficioSociosFalla)}
        </span>
      </div>

    </div>
  </div>
</div>


{/* RESUMEN VIRGEN */}
<div className="min-w-0 rounded border border-blue-200 bg-blue-50/20 p-4">
  <h3 className="mb-3 border-b border-blue-100 pb-2 text-sm font-bold uppercase text-blue-900">
    Resumen Virgen
  </h3>

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-6">

    {/* CANTIDADES */}
    <div className="min-w-0 space-y-2 text-sm">

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase text-zinc-600">
          Emitidas
        </span>
        <span className="shrink-0 font-semibold">
          {papeletasEmitidasVirgen}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase text-zinc-600">
          Entregadas
        </span>
        <span className="shrink-0 font-semibold">
          {papeletasEntregadasVirgen}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase text-zinc-600">
          Devueltas
        </span>
        <span className="shrink-0 font-semibold">
          {papeletasDevueltasVirgen}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase text-zinc-600">
          Vendidas
        </span>
        <span className="shrink-0 font-semibold">
          {papeletasVendidasVirgen}
        </span>
      </div>

    </div>

    {/* DINERO */}
    <div className="min-w-0 space-y-2 border-t border-zinc-200 pt-4 text-sm sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">

      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-xs font-medium uppercase text-zinc-600">
          Pago administración
        </span>
        <span className="shrink-0 whitespace-nowrap font-semibold">
          {euros(pagoAdministracionVirgen)}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-xs font-medium uppercase text-zinc-600">
          Recaudación socios
        </span>
        <span className="shrink-0 whitespace-nowrap font-semibold">
          {euros(recaudacionSociosVirgen)}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-xs font-medium uppercase text-zinc-600">
          Beneficio socios
        </span>
        <span className="shrink-0 whitespace-nowrap font-semibold">
          {euros(beneficioSociosVirgen)}
        </span>
      </div>

    </div>
  </div>
</div>

</div>

    {/* PENDIENTE TOTAL DEL SORTEO */}
    <div className="mt-5 flex items-center justify-end gap-3 border-t border-zinc-200 pt-4 text-sm">
      <span className="font-medium text-zinc-700">
        Pendiente de cobro total:
      </span>

      <span
        className={`text-base font-bold ${
          pendienteCobro > 0
            ? "text-red-700"
            : "text-green-700"
        }`}
      >
        {euros(pendienteCobro)}
      </span>
    </div>

  </div>
</section>

<section className="border border-zinc-200 bg-white">
  <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">

    <div className="flex items-center gap-4">
      <h2 className="text-sm font-semibold uppercase text-zinc-700">
        Entregas registradas
      </h2>

      <input
        type="text"
        placeholder="Buscar socio, serie, fecha, pendiente..."
        value={busquedaEntregas}
        onChange={(e) => setBusquedaEntregas(e.target.value)}
        className="w-80 border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
      />
    </div>

    <button
      onClick={() => {
        setEntrega(entregaVacia);
        setEntregaEditando(null);
        setBusquedaSocio("");
        setModalAbierto(true);
      }}
      className="rounded bg-red-900 px-3 py-2 text-sm font-medium text-white hover:bg-red-950"
    >
      + Registrar entrega
    </button>

  </div>

  {cargando ? (
    <div className="px-4 py-10 text-center text-sm text-zinc-500">
      Cargando...
    </div>
  ) : entregas.length === 0 ? (
    <div className="px-4 py-10 text-center text-sm text-zinc-500">
      Todavía no hay entregas registradas.
    </div>
  ) : (
    
    <div className="overflow-x-auto">

<table className="w-full min-w-[1050px] divide-y divide-zinc-200">
      <thead className="bg-zinc-50">
  <tr>
    <CabeceraOrdenable
  titulo="Socio"
  campo="socio"
  campoOrden={campoOrden}
  direccionOrden={direccionOrden}
  alOrdenar={ordenarPor}
/>

    <th className="px-2 py-3 text-center text-xs font-semibold uppercase">
      Sorteo
    </th>

    <th className="px-2 py-3 text-center text-xs font-semibold uppercase">
      Fecha
    </th>

    <th className="px-2 py-3 text-center text-xs font-semibold uppercase">
      Papeletas
    </th>

    <th className="px-2 py-3 text-center text-xs font-semibold uppercase">
      Devueltas
    </th>

    <th className="px-2 py-3 text-center text-xs font-semibold uppercase">
      Vendidas
    </th>

    <th className="px-2 py-3 text-right text-xs font-semibold uppercase">
  Total
</th>

    <th className="px-2 py-3 text-center text-xs font-semibold uppercase">
      Pagado
    </th>

    <CabeceraOrdenable
  titulo="Pendiente"
  campo="pendiente"
  campoOrden={campoOrden}
  direccionOrden={direccionOrden}
  alOrdenar={ordenarPor}
  className="text-right"
/>

    <CabeceraOrdenable
  titulo="Serie"
  campo="serie"
  campoOrden={campoOrden}
  direccionOrden={direccionOrden}
  alOrdenar={ordenarPor}
/>

<th className="sticky right-0 z-30 whitespace-nowrap border-l border-zinc-200 bg-zinc-100 px-3 py-3 text-center text-xs font-semibold uppercase shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.15)]">
  Acciones
</th>
  </tr>
</thead>

      <tbody className="divide-y divide-zinc-200 bg-white">
      {entregasOrdenadas.map((fila) => {
          const socio = socios.find(
            (s) => Number(s.NUMCENS) === Number(fila.NUMCENS)
          );

          const vendidas =
  Math.max(
    0,
    Number(fila.Papeletas || 0) - Number(fila.Devueltas || 0)
  );

  const vendidasFalla = Math.max(
    0,
    Number(fila.PapeletasFalla || 0) -
      Number(fila.DevueltasFalla || 0)
  );
  
  const vendidasVirgen = Math.max(
    0,
    Number(fila.PapeletasVirgen || 0) -
      Number(fila.DevueltasVirgen || 0)
  );
  
  const importeFalla =
    vendidasFalla *
    Number(configuracion.ImportePapeletaFalla || 0);
  
  const importeVirgen =
    vendidasVirgen *
    Number(configuracion.ImportePapeletaVirgen || 0);
  
  const importeTotal = importeFalla + importeVirgen;
  
  const importePagado = totalPagadoEntrega(fila.ID);
  
  const importePendiente = Math.max(
    0,
    importeTotal - importePagado
  );
  
          return (
            <tr key={fila.ID}>
              <td className="px-4 py-3 text-sm">
                <div className="font-medium text-zinc-900">
                  {fila.NombreExterno ||
                    `${socio?.Apellidos || ""}, ${socio?.Nombre || ""}`}
                </div>

                <div className="text-xs text-zinc-400">
                  {fila.NUMCENS
                    ? `NUMCENS ${fila.NUMCENS}`
                    : "Externo"}
                </div>
              </td>

              <td className="px-4 py-3 text-center text-sm">
                {fila.Sorteo}
              </td>

              <td className="px-4 py-3 text-center text-sm">
              {formatearFecha(fila.FechaEntrega)}
                              </td>

                              <td className="px-4 py-3 text-center text-sm">
  <div className="font-medium text-red-900">
    F: {Number(fila.PapeletasFalla || 0)}
  </div>
  <div className="font-medium text-blue-900">
    V: {Number(fila.PapeletasVirgen || 0)}
  </div>
</td>

<td className="px-4 py-3 text-center text-sm">
  <div className="text-red-900">
    F: {Number(fila.DevueltasFalla || 0)}
  </div>
  <div className="text-blue-900">
    V: {Number(fila.DevueltasVirgen || 0)}
  </div>
</td>

<td className="px-4 py-3 text-center text-sm font-medium">
  {vendidasFalla + vendidasVirgen}
</td>

<td className="px-4 py-3 text-right text-sm font-medium">
  {euros(importeTotal)}
</td>

<td className="px-4 py-3 text-center text-sm">
  {euros(importePagado)}
</td>

<td className="px-4 py-3 text-center text-sm">
  <div className="flex items-center justify-center gap-2">

    {importePendiente > 0 && (
      <span className="h-2.5 w-2.5 rounded-full bg-red-600"></span>
    )}

    <span
      className={
        importePendiente > 0
          ? "font-semibold text-red-700"
          : "text-green-700"
      }
    >
      {euros(importePendiente)}
    </span>

  </div>
</td>
              <td className="px-2 py-3 text-center text-xs whitespace-nowrap">
  <div className="whitespace-nowrap text-red-900">
    F: {fila.SerieFalla || "—"}
  </div>

  <div className="whitespace-nowrap text-blue-900">
    V: {fila.SerieVirgen || "—"}
  </div>
</td>

<td className="sticky right-0 z-20 border-l border-zinc-200 bg-white px-3 py-3 text-center shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.15)]">
  <div className="flex justify-center gap-2">

    <button
      onClick={() => editarEntrega(fila)}
      title="Editar"
      className="rounded bg-zinc-100 px-2 py-1 text-sm hover:bg-zinc-200"
    >
      ✏️
    </button>

    <button
      onClick={() => eliminarEntrega(fila.ID)}
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
    </div>
  )}
</section>
      </main>
    </div>
  );
}