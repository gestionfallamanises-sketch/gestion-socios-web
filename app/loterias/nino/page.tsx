"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import EntregaNinoModal from "../../components/EntregaNinoModal";
import { supabase } from "../../../lib/supabaseClient";
import { normalizarTexto } from "@/lib/texto";
import CabeceraOrdenable from "@/app/components/CabeceraOrdenable";
import { exportarExcel as descargarExcel } from "@/lib/excel";
import PagoModal from "@/app/components/PagoModal";

const entregaVacia = {
  ID: null,

  NUMCENS: null,
  NombreExterno: "",

  Sorteo: "Niño",

  FechaEntrega: new Date().toISOString().slice(0, 10),

  Papeletas: 0,
  Devueltas: 0,

  Serie: "",

  Observaciones: "",
};

function euros(valor: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(valor || 0));
}

export default function NinoPage() {

const [mostrarNino, setMostrarNino] = useState(true);
  
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

  const [pagosNino, setPagosNino] = useState<any[]>([]);

  const [configuracion, setConfiguracion] = useState({
    FechaSorteo: "",
    Numero: "",
    Decimos: 0,
    PrecioDecimo: 0,
    ImportePapeleta: 0,
    BeneficioPapeleta: 0,
    PremioPorPapeleta: 0,
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
  .from("LOTERIA_SORTEO_NINO")
  .select("*")
  .eq("Ejercicio", ejercicioActual)
  .eq("Sorteo", "Niño")
  .order("FechaEntrega", { ascending: false }),
      
          supabase
            .from("SOCIOS")
            .select("*"),
        
          supabase
            .from("SOCIOS_LOTERIA")
            .select("*"),

            supabase
  .from("LOTERIA_NINO_CONFIGURACION")
  .select("*")
  .eq("Ejercicio", ejercicioActual)
  .eq("Sorteo", "Niño")
  .maybeSingle(),

  supabase
    .from("LOTERIA_NINO_PAGOS")
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
        setPagosNino(pagosData || []);

        const config: any = configuracionData;

        if (config) {
          setConfiguracion({
            FechaSorteo: config.FechaSorteo || "",
            Numero: config.Numero || "",
            Decimos: Number(config.Decimos || 0),
            PrecioDecimo: Number(config.PrecioDecimo || 0),
            ImportePapeleta: Number(config.ImportePapeleta || 0),
            BeneficioPapeleta: Number(config.BeneficioPapeleta || 0),
            PremioPorPapeleta: Number(config.PremioPorPapeleta || 0),
          });
        } else {
          setConfiguracion({
            FechaSorteo: ejercicioActivo
  ? `${ejercicioActivo - 1}-12-22`
  : "",
            Numero: "",
            Decimos: 0,
            PrecioDecimo: 0,
            ImportePapeleta: 0,
            BeneficioPapeleta: 0,
            PremioPorPapeleta: 0,
          });
        }
      
        setCargando(false);
      }
      
      async function borrarEntrega(id: number) {
        const confirmar = window.confirm("¿Seguro que quieres borrar esta entrega?");
        if (!confirmar) return;
      
        const { error } = await supabase
          .from("LOTERIA_SORTEO_NINO")
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
          Papeletas: Number(ficha?.PapeletasNino || 0),
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
      
        if (Number(entrega.Papeletas || 0) <= 0) {
          alert("Indica el número de papeletas.");
          return;
        }
        
        const vendidas = Math.max(
          0,
          Number(entrega.Papeletas || 0) -
            Number(entrega.Devueltas || 0)
        );
        
        const importeTotal =
          vendidas * Number(configuracion.ImportePapeleta || 0);
        
        const datos = {
          Ejercicio: ejercicioActivo,
          NUMCENS: entrega.NUMCENS,
          NombreExterno: entrega.NombreExterno || null,
          Sorteo: "Niño",
          FechaEntrega: entrega.FechaEntrega,
          Papeletas: Number(entrega.Papeletas || 0),
          Devueltas: Number(entrega.Devueltas || 0),
          Serie: entrega.Serie || null,
          
          Observaciones: entrega.Observaciones || null,
        };
      
        let error;
      
        if (entregaEditando?.ID) {
          ({ error } = await (supabase as any)
            .from("LOTERIA_SORTEO_NINO")
            .update(datos)
            .eq("ID", entregaEditando.ID));
        } else {
          ({ error } = await (supabase as any)
            .from("LOTERIA_SORTEO_NINO")
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
          Sorteo: "Niño",
          FechaSorteo: configuracion.FechaSorteo || null,
          Numero: configuracion.Numero || null,
          Decimos: Number(configuracion.Decimos || 0),
          PrecioDecimo: Number(configuracion.PrecioDecimo || 0),
          ImportePapeleta: Number(configuracion.ImportePapeleta || 0),
          BeneficioPapeleta: Number(configuracion.BeneficioPapeleta || 0),
          PremioPorPapeleta: Number(configuracion.PremioPorPapeleta || 0),
          UpdatedAt: new Date().toISOString(),
        };
      
        const { error } = await (supabase as any)
          .from("LOTERIA_NINO_CONFIGURACION")
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

      const papeletasEmitidas =
  configuracion.ImportePapeleta > 0
    ? Math.floor(
        (configuracion.Decimos * configuracion.PrecioDecimo) /
          configuracion.ImportePapeleta
      )
    : 0;

const papeletasEntregadas = entregas.reduce(
  (suma, e) => suma + Number(e.Papeletas || 0),
  0
);

const papeletasDevueltas = entregas.reduce(
  (suma, e) => suma + Number(e.Devueltas || 0),
  0
);

const papeletasVendidas =
  papeletasEntregadas - papeletasDevueltas;

const recaudacionSocios =
  papeletasVendidas *
  (configuracion.ImportePapeleta -
    configuracion.BeneficioPapeleta);

const pagoAdministracion =
  configuracion.Decimos * configuracion.PrecioDecimo;

const beneficioSocios =
  papeletasVendidas *
  configuracion.BeneficioPapeleta;

  const importePagado = entregas.reduce(
    (suma, e) => suma + totalPagadoEntrega(e.ID),
    0
  );

const pendienteCobro = entregas.reduce((suma, fila) => {
  const vendidas = Math.max(
    0,
    Number(fila.Papeletas || 0) -
      Number(fila.Devueltas || 0)
  );

  const totalFila =
    vendidas * Number(configuracion.ImportePapeleta || 0);

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
      Sorteo: "Niño",
      FechaEntrega: fila.FechaEntrega || "",
      Papeletas: Number(fila.Papeletas || 0),
      Devueltas: Number(fila.Devueltas || 0),
      Serie: fila.Serie || "",
      ImportePagado: totalPagadoEntrega(fila.ID),
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
      .from("LOTERIA_SORTEO_NINO")
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
  
    const papeletas = Number(fila.Papeletas || 0);
    const devueltas = Number(fila.Devueltas || 0);
    const vendidas = Math.max(0, papeletas - devueltas);
  
    const importeTotal =
      vendidas * Number(configuracion.ImportePapeleta || 0);
  
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
        fila.Serie,
        fila.FechaEntrega,
        papeletas,
        devueltas,
        vendidas,
        importePagado,
        pendiente,
        pendiente > 0 ? "pendiente" : "pagado",
        devueltas > 0 ? "devueltas devolucion" : "",
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
  
      const vendidasA = Math.max(
        0,
        Number(a.Papeletas || 0) - Number(a.Devueltas || 0)
      );
  
      const vendidasB = Math.max(
        0,
        Number(b.Papeletas || 0) - Number(b.Devueltas || 0)
      );
  
      const pendienteA = Math.max(
        0,
        vendidasA * Number(configuracion.ImportePapeleta || 0) -
        totalPagadoEntrega(a.ID)
      );
  
      const pendienteB = Math.max(
        0,
        vendidasB * Number(configuracion.ImportePapeleta || 0) -
        totalPagadoEntrega(b.ID)
      );
  
      let comparacion = 0;
  
      if (campoOrden === "socio") {
        comparacion = nombreA.localeCompare(nombreB, "es");
      }
  
      if (campoOrden === "serie") {
        comparacion = String(a.Serie || "").localeCompare(
          String(b.Serie || ""),
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
  
      const papeletas = Number(fila.Papeletas || 0);
      const devueltas = Number(fila.Devueltas || 0);
      const vendidas = Math.max(0, papeletas - devueltas);
  
      const total =
        vendidas * Number(configuracion.ImportePapeleta || 0);
  
      const pagado = totalPagadoEntrega(fila.ID);
      const pendiente = Math.max(0, total - pagado);
  
      return {
        socio: nombre,
        numcens: fila.NUMCENS || "",
        fecha: fila.FechaEntrega || "",
        serie: fila.Serie || "",
        entregadas: papeletas,
        devueltas,
        vendidas,
        total,
        pagado,
        pendiente,
      };
    });
  
    descargarExcel({
      nombreArchivo: `nino-${ejercicioActivo || "ejercicio"}.xlsx`,
      nombreHoja: "Niño",
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
          titulo: "Serie",
          campo: "serie",
          ancho: 18,
          tipo: "texto",
        },
        {
          titulo: "Entregadas",
          campo: "entregadas",
          ancho: 12,
          tipo: "numero",
        },
        {
          titulo: "Devueltas",
          campo: "devueltas",
          ancho: 11,
          tipo: "numero",
        },
        {
          titulo: "Vendidas",
          campo: "vendidas",
          ancho: 10,
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
    return pagosNino
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
  
    const totalEntrega =
      Math.max(
        0,
        Number(entrega.Papeletas || 0) -
          Number(entrega.Devueltas || 0)
      ) * Number(configuracion?.ImportePapeleta || 0);
  
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
        .from("LOTERIA_NINO_PAGOS")
        .update(datos)
        .eq("ID", pagoEditando.ID));
    } else {
      ({ error } = await (supabase as any)
        .from("LOTERIA_NINO_PAGOS")
        .insert(datos));
    }
  
    if (error) {
      alert(error.message);
      return;
    }
  
    const { data: pagosData, error: errorPagos } =
      await (supabase as any)
        .from("LOTERIA_NINO_PAGOS")
        .select("*")
        .order("FechaPago", { ascending: true });
  
    if (errorPagos) {
      alert(errorPagos.message);
      return;
    }
  
    setPagosNino(pagosData || []);
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
      .from("LOTERIA_NINO_PAGOS")
      .delete()
      .eq("ID", idPago);
  
    if (error) {
      alert(error.message);
      return;
    }
  
    const { data: pagosData, error: errorPagos } =
      await (supabase as any)
        .from("LOTERIA_NINO_PAGOS")
        .select("*")
        .order("FechaPago", { ascending: true });
  
    if (errorPagos) {
      alert(errorPagos.message);
      return;
    }
  
    setPagosNino(pagosData || []);
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
      Niño
    </h1>

    <p className="mt-2 text-sm text-zinc-600">
      Gestión de entregas, series, pagos y devolución de papeletas.
    </p>
  </div>

  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() =>
        window.location.href = "/loterias/nino/imprimir"
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

        <EntregaNinoModal
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

  pagosEntrega={pagosNino.filter(
    (p: any) =>
      Number(p.IDEntrega) === Number(entregaEditando?.ID)
  )}

  totalPagado={totalPagadoEntrega(entregaEditando?.ID || 0)}

  importeTotal={
    Math.max(
      0,
      Number(entrega.Papeletas || 0) -
        Number(entrega.Devueltas || 0)
    ) * Number(configuracion?.ImportePapeleta || 0)
  }

  pendiente={
    Math.max(
      0,
      Math.max(
        0,
        Number(entrega.Papeletas || 0) -
          Number(entrega.Devueltas || 0)
      ) *
        Number(configuracion?.ImportePapeleta || 0) -
        totalPagadoEntrega(entregaEditando?.ID || 0)
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
<div className="flex items-center justify-between border-b border-zinc-300 bg-zinc-100 px-4 py-3">
  <h2 className="text-sm font-semibold uppercase text-zinc-700">
    Configuración Niño
  </h2>

  <button
    type="button"
    onClick={guardarConfiguracion}
    className="rounded bg-red-900 px-3 py-2 text-sm font-medium text-white hover:bg-red-950"
  >
    💾 Guardar configuración
  </button>
</div>

<div className="p-6">

  <div className="grid grid-cols-[1.15fr_1fr_0.8fr_0.9fr_0.9fr_0.7fr_0.9fr] gap-4">

  <div>
  <label className="mb-1 block text-sm font-medium text-zinc-700">
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
    className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
  />
</div>

<div>
  <label className="mb-1 block text-sm font-medium text-zinc-700">
    Número
  </label>

  <input
    type="text"
    value={configuracion.Numero}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        Numero: e.target.value,
      })
    }
    className="w-full border border-zinc-300 px-3 py-2 text-sm"
  />
</div>

<div>
  <label className="mb-1 block text-sm font-medium text-zinc-700">
    Nº décimos
  </label>

  <input
    type="number"
    value={configuracion.Decimos}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        Decimos: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-3 py-2 text-sm"
  />
</div>

<div>
  <label className="mb-1 block text-sm font-medium text-zinc-700">
    Precio décimo
  </label>

  <input
    type="number"
    step="0.01"
    value={configuracion.PrecioDecimo}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        PrecioDecimo: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-3 py-2 text-sm"
  />
</div>

<div>
  <label className="mb-1 block text-sm font-medium text-zinc-700">
    Importe papeleta
  </label>

  <input
    type="number"
    step="0.01"
    value={configuracion.ImportePapeleta}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        ImportePapeleta: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-3 py-2 text-sm"
  />
</div>

<div>
  <label className="mb-1 block text-sm font-medium text-zinc-700">
    Beneficio
  </label>

  <input
    type="number"
    step="0.01"
    value={configuracion.BeneficioPapeleta}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        BeneficioPapeleta: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-3 py-2 text-sm"
  />
</div>

<div>
  <label className="mb-1 block text-sm font-medium text-zinc-700">
    Premio / papeleta
  </label>

  <input
    type="number"
    step="0.01"
    value={configuracion.PremioPorPapeleta}
    onChange={(e) =>
      setConfiguracion({
        ...configuracion,
        PremioPorPapeleta: Number(e.target.value),
      })
    }
    className="w-full border border-zinc-300 px-3 py-2 text-sm"
  />
</div>

</div>
  <hr className="my-6" />

<div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">

  <div className="flex justify-between">
    <span>Papeletas emitidas</span>
    <span className="font-semibold">{papeletasEmitidas}</span>
  </div>

  <div className="flex justify-between">
    <span>Pago administración</span>
    <span className="font-semibold">
      {euros(pagoAdministracion)}
    </span>
  </div>

  <div className="flex justify-between">
    <span>Papeletas entregadas</span>
    <span className="font-semibold">{papeletasEntregadas}</span>
  </div>

  <div className="flex justify-between">
    <span>Recaudación socios</span>
    <span className="font-semibold">
      {euros(recaudacionSocios)}
    </span>
  </div>

  <div className="flex justify-between">
    <span>Papeletas devueltas</span>
    <span className="font-semibold">{papeletasDevueltas}</span>
  </div>

  <div className="flex justify-between">
    <span>Beneficio socios</span>
    <span className="font-semibold">
      {euros(beneficioSocios)}
    </span>
  </div>

  <div className="flex justify-between">
    <span>Papeletas vendidas</span>
    <span className="font-semibold">{papeletasVendidas}</span>
  </div>

  <div className="flex justify-between">
    <span>Pendiente cobro</span>

    <span
      className={`font-semibold ${
        pendienteCobro > 0
          ? "text-red-700"
          : "text-green-700"
      }`}
    >
      {euros(pendienteCobro)}
    </span>
  </div>

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

<th className="whitespace-nowrap px-2 py-3 text-center text-xs font-semibold uppercase">
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

  const importeTotal =
  vendidas * Number(configuracion.ImportePapeleta || 0);

const importePagado = totalPagadoEntrega(fila.ID);

const importePendiente =
  Math.max(
    0,
    vendidas * Number(configuracion.ImportePapeleta || 0) - importePagado
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
                {fila.Papeletas}
              </td>
              <td className="px-4 py-3 text-center text-sm">
  {Number(fila.Devueltas || 0)}
</td>

<td className="px-4 py-3 text-center text-sm font-semibold">
  {vendidas}
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
              <td className="px-4 py-3 text-center text-sm">
                {fila.Serie || "—"}
              </td>
              <td className="px-4 py-3 text-center">
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