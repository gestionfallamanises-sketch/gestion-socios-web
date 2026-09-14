"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { supabase } from "../../lib/supabase";
import EditarCargoHistorial from "../components/EditarCargoHistorial";

function LinkSocio({ numcens, children }: { numcens: any; children: any }) {
  return (
    <Link
      href={`/socios/${numcens}`}
      className="font-medium text-red-900 hover:underline"
    >
      {children}
    </Link>
  );
}

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function ListadosPage() {
    const [listado, setListado] = useState("");
    const [busquedaSocio, setBusquedaSocio] = useState("");
    const [filtroSexo, setFiltroSexo] = useState("TODOS");
const [filtroComision, setFiltroComision] = useState("TODAS");
const [orden, setOrden] = useState("NOMBRE");
    const [socios, setSocios] = useState<any[]>([]);
const [error, setError] = useState<string | null>(null);
const [cuotas, setCuotas] = useState<any[]>([]);
const [ejercicios, setEjercicios] = useState<any[]>([]);
const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState<number | null>(null);
const [filtroTipoCuota, setFiltroTipoCuota] = useState("TODOS");
const [filtroPendiente, setFiltroPendiente] = useState("TODOS");
const [filtroFormaPago, setFiltroFormaPago] = useState("TODAS");
const [filtroEstadoCuota, setFiltroEstadoCuota] = useState("TODOS");
const [pagadores, setPagadores] = useState<any[]>([]);
const [filtroMetodoPagador, setFiltroMetodoPagador] = useState("TODOS");
const [filtroIBAN, setFiltroIBAN] = useState("TODOS");
const [fechaNacimientoDesde, setFechaNacimientoDesde] = useState("");
const [fechaNacimientoHasta, setFechaNacimientoHasta] = useState("");
const [cargos, setCargos] = useState<any[]>([]);
const [filtroCategoriaCargo, setFiltroCategoriaCargo] = useState("TODOS");
const [ordenCargos, setOrdenCargos] = useState<
  "NOMBRE_ASC" | "NOMBRE_DESC" | "CARGO_ASC" | "CARGO_DESC"
>("NOMBRE_ASC");
const [ejercicioActivo, setEjercicioActivo] = useState<number | null>(null);
const [recargarCargos, setRecargarCargos] = useState(0);

useEffect(() => {
  async function fetchSocios() {
    const [
      { data: antiguedadData, error: antiguedadError },
      { data: sociosData, error: sociosError },
      { data: familiasData, error: familiasError },
    ] = await Promise.all([
      supabase
        .from("SOCIOS_ANTIGUEDAD_CALCULADA")
        .select(`
          NUMCENS,
          Nombre,
          Apellidos,
          Estado,
          Comision,
          SEXE,
          Antiguedad_Calculada,
          Antiguedad_Meses_Total,
          "FECHA de NACIMIENTO",
          ConLoteria,
          NumPapeletas,
          PapeletasFalla,
          PapeletasVirgen,
          PapeletasNavidad,
          PapeletasNino,
          EsBanda
        `),

      supabase
        .from("SOCIOS")
        .select(`
          NUMCENS,
          Nombre,
          Apellidos,
          ID_Familia,
          "Teléfono 1",
          "Teléfono 2",
          "FECHA de NACIMIENTO"
        `),

      supabase
        .from("FAMILIAS")
        .select(`
          ID_Familia,
          Titular_NUMCENS
        `),
    ]);

    if (antiguedadError || sociosError || familiasError) {
      setError(
        antiguedadError?.message ||
          sociosError?.message ||
          familiasError?.message ||
          "Error al cargar los socios"
      );
      return;
    }

    const datosSocios = sociosData || [];
    const familias = familiasData || [];

    function obtenerTelefono(socio: any) {
      return (
        socio?.["Teléfono 1"]?.trim() ||
        socio?.["Teléfono 2"]?.trim() ||
        ""
      );
    }

    function esAdulto(fechaNacimiento: string | null) {
      if (!fechaNacimiento) return false;

      const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);
      const hoy = new Date();

      let edad = hoy.getFullYear() - nacimiento.getFullYear();

      const mes = hoy.getMonth() - nacimiento.getMonth();

      if (
        mes < 0 ||
        (mes === 0 && hoy.getDate() < nacimiento.getDate())
      ) {
        edad--;
      }

      return edad >= 18;
    }

    const sociosConTelefono = (antiguedadData || []).map((socio) => {
      const datosSocio = datosSocios.find(
        (s) => Number(s.NUMCENS) === Number(socio.NUMCENS)
      );

      const telefonoPropio = obtenerTelefono(datosSocio);

      if (telefonoPropio) {
        return {
          ...socio,
          TelefonoListado: telefonoPropio,
          OrigenTelefono: "Propio",
          ContactoTelefono: `${socio.Nombre || ""} ${
            socio.Apellidos || ""
          }`.trim(),
        };
      }

      if (!datosSocio?.ID_Familia) {
        return {
          ...socio,
          TelefonoListado: "",
          OrigenTelefono: "",
          ContactoTelefono: "",
        };
      }

      const familia = familias.find(
        (f) =>
          Number(f.ID_Familia) === Number(datosSocio.ID_Familia)
      );

      const titular = datosSocios.find(
        (s) =>
          Number(s.NUMCENS) === Number(familia?.Titular_NUMCENS)
      );

      const telefonoTitular = obtenerTelefono(titular);

      if (telefonoTitular) {
        return {
          ...socio,
          TelefonoListado: telefonoTitular,
          OrigenTelefono: "Titular",
          ContactoTelefono: `${titular?.Nombre || ""} ${
            titular?.Apellidos || ""
          }`.trim(),
        };
      }

      const otroAdulto = datosSocios.find(
        (s) =>
          Number(s.ID_Familia) === Number(datosSocio.ID_Familia) &&
          Number(s.NUMCENS) !== Number(socio.NUMCENS) &&
          Number(s.NUMCENS) !== Number(titular?.NUMCENS) &&
          esAdulto(s["FECHA de NACIMIENTO"]) &&
          obtenerTelefono(s)
      );

      const telefonoFamiliar = obtenerTelefono(otroAdulto);

      if (telefonoFamiliar) {
        return {
          ...socio,
          TelefonoListado: telefonoFamiliar,
          OrigenTelefono: "Familiar",
          ContactoTelefono: `${otroAdulto?.Nombre || ""} ${
            otroAdulto?.Apellidos || ""
          }`.trim(),
        };
      }

      return {
        ...socio,
        TelefonoListado: "",
        OrigenTelefono: "",
        ContactoTelefono: "",
      };
    });

    setSocios(sociosConTelefono);
  }

  fetchSocios();
}, []);

useEffect(() => {
    async function fetchEjercicios() {
      const { data, error } = await supabase
        .from("EJERCICIOS")
        .select("*")
        .order("Ejercicio", { ascending: false });
  
      if (error) {
        setError(error.message);
        return;
      }
  
      setEjercicios(data || []);

      const activo = (data || []).find(
        (ejercicio) => ejercicio.Activo === true
      );
      
      setEjercicioActivo(activo?.Ejercicio ?? null);
  
      if (data && data.length > 0) {
        setEjercicioSeleccionado(data[0].Ejercicio);
      }
    }
  
    fetchEjercicios();
  }, []);

  useEffect(() => {
    async function fetchCuotas() {
      if (!ejercicioSeleccionado) return;
  
      const { data, error } = await supabase
  .from("VISTA_CUOTAS_RESUMEN")
  .select("*")
  .eq("Ejercicio", ejercicioSeleccionado)
  .eq("EstadoSocio", "Activo")
  .order("Apellidos", { ascending: true });
  
      if (error) {
        setError(error.message);
        return;
      }
  
      setCuotas(data || []);
    }
  
    fetchCuotas();
  }, [ejercicioSeleccionado]);

  useEffect(() => {
    async function fetchPagadores() {
      const { data, error } = await supabase
        .from("v_pagadores")
        .select("*")
        .order("NombrePagador", { ascending: true });
  
      if (error) {
        setError(error.message);
      } else {
        setPagadores(data || []);
      }
    }
  
    fetchPagadores();
  }, []);

  useEffect(() => {
    async function fetchCargos() {
      if (!ejercicioSeleccionado) return;
  
      const { data, error } = await supabase
        .from("HISTORIAL_SOCIOS")
        .select(`
          ID,
          NUMCENS,
          Ejercicio,
          Cargo,
          CategoriaCargo
        `)
        .eq("Ejercicio", ejercicioSeleccionado)
        .order("NUMCENS", { ascending: true });
  
      if (error) {
        setError(error.message);
        return;
      }
  
      setCargos(data || []);
    }
  
    fetchCargos();
  }, [ejercicioSeleccionado, recargarCargos]);

function abreviarAntiguedad(texto: string | null) {
    if (!texto) return "-";
  
    return texto
      .replace(/,\s*\d+\s*días?/i, "")
      .replace(" años", " A")
      .replace(" año", " A")
      .replace(" meses", " M")
      .replace(" mes", " M");
  }

  const sociosActivos = socios
  .filter((socio) => socio.Estado === "Activo")
  .sort((a, b) => {
    const nombreA = `${a.Apellidos || ""}, ${a.Nombre || ""}`.toLowerCase();
    const nombreB = `${b.Apellidos || ""}, ${b.Nombre || ""}`.toLowerCase();
    return nombreA.localeCompare(nombreB);
  });

const sociosBaja = socios
  .filter((socio) => socio.Estado === "Baja")
  .sort((a, b) => {
    const nombreA = `${a.Apellidos || ""}, ${a.Nombre || ""}`.toLowerCase();
    const nombreB = `${b.Apellidos || ""}, ${b.Nombre || ""}`.toLowerCase();
    return nombreA.localeCompare(nombreB);
  });
  
  const sociosBanda = socios
  .filter((socio) => socio.EsBanda === true && socio.Estado === "Activo")
  .sort((a, b) => {
    const nombreA = `${a.Apellidos || ""}, ${a.Nombre || ""}`.toLowerCase();
    const nombreB = `${b.Apellidos || ""}, ${b.Nombre || ""}`.toLowerCase();
    return nombreA.localeCompare(nombreB);
  });

  const sociosBase =
  listado === "ACTIVOS"
    ? sociosActivos
    : listado === "BAJAS"
    ? sociosBaja
    : listado === "BANDA"
    ? sociosBanda
    : [];

    const cuotasFiltradas = cuotas.filter((cuota) => {
      if (cuota.EstadoSocio !== "Activo") return false;
    
      const coincideTipo =
        filtroTipoCuota === "TODOS" || cuota.IDCuota === filtroTipoCuota;
    
      const coincideEstado =
        filtroEstadoCuota === "TODOS" || cuota.EstadoPago === filtroEstadoCuota;
    
      const coincideFormaPago =
        filtroFormaPago === "TODAS" || cuota.Metodo === filtroFormaPago;
    
      const pendiente = Number(cuota.Pendiente || 0);
    
      const coincidePendiente =
        filtroPendiente === "TODOS" ||
        (filtroPendiente === "SI" && pendiente > 0) ||
        (filtroPendiente === "NO" && pendiente <= 0);
    
      const textoSocio = normalizarTexto(
        `${cuota.Apellidos || ""} ${cuota.Nombre || ""} ${cuota.NUMCENS || ""}`
      );
    
      const coincideBusqueda =
        normalizarTexto(busquedaSocio) === "" ||
        textoSocio.includes(normalizarTexto(busquedaSocio));
    
      return (
        coincideTipo &&
        coincideEstado &&
        coincideFormaPago &&
        coincidePendiente &&
        coincideBusqueda
      );
    });

      const tiposCuota = Array.from(
        new Set(cuotas.map((cuota) => cuota.IDCuota).filter(Boolean))
      ).sort();
      
      const formasPago = Array.from(
        new Set(cuotas.map((cuota) => cuota.Metodo).filter(Boolean))
      ).sort();

      const estadosCuota = Array.from(
        new Set(cuotas.map((cuota) => cuota.EstadoPago).filter(Boolean))
      ).sort();

      const pagadoresFiltrados = pagadores.filter((pagador) => {
        const socioPagador = socios.find(
          (socio) => Number(socio.NUMCENS) === Number(pagador.Pagador)
        );
        
        if (!socioPagador || socioPagador.Estado !== "Activo") {
          return false;
        }
        const cumpleMetodo =
          filtroMetodoPagador === "TODOS" ||
          pagador.Metodo === filtroMetodoPagador;
      
        const cumpleIBAN =
          filtroIBAN === "TODOS" ||
          (filtroIBAN === "CON_IBAN" &&
            pagador.IBAN &&
            pagador.IBAN.trim() !== "") ||
          (filtroIBAN === "SIN_IBAN" &&
            (!pagador.IBAN || pagador.IBAN.trim() === ""));
      
        const textoPagador = normalizarTexto(
          `${pagador.NombrePagador || ""} ${pagador.NUMCENS_Pagador || ""}`
        );
      
        const coincideBusqueda =
          normalizarTexto(busquedaSocio) === "" ||
          textoPagador.includes(normalizarTexto(busquedaSocio));
      
        return cumpleMetodo && cumpleIBAN && coincideBusqueda;
      });

      const pagadorSocios = cuotas
      
      .filter((cuota) => {
        const socioRelacionado = socios.find(
          (socio) => Number(socio.NUMCENS) === Number(cuota.NUMCENS)
        );
        
        const numcensPagador =
          cuota.NUMCENS_Pagador || cuota.NUMCENS;
        
        const socioPagador = socios.find(
          (socio) => Number(socio.NUMCENS) === Number(numcensPagador)
        );
        
        if (
          !socioRelacionado ||
          socioRelacionado.Estado !== "Activo" ||
          !socioPagador ||
          socioPagador.Estado !== "Activo"
        ) {
          return false;
        }
        const coincideMetodo =
          filtroMetodoPagador === "TODOS" ||
          cuota.Metodo === filtroMetodoPagador;
      
        const textoBusqueda = normalizarTexto(
          `${cuota.PagadorNombre || ""} ${cuota.NUMCENS_Pagador || ""} ${cuota.Apellidos || ""} ${cuota.Nombre || ""} ${cuota.NUMCENS || ""}`
        );
      
        const coincideBusqueda =
          normalizarTexto(busquedaSocio) === "" ||
          textoBusqueda.includes(normalizarTexto(busquedaSocio));
      
        return coincideMetodo && coincideBusqueda;
      })
  .sort((a, b) => {
    const pagadorA = String(a.PagadorNombre || a.NUMCENS_Pagador || "");
    const pagadorB = String(b.PagadorNombre || b.NUMCENS_Pagador || "");

    const cmpPagador = pagadorA.localeCompare(pagadorB, "es");

    if (cmpPagador !== 0) return cmpPagador;

    const socioA = `${a.Apellidos || ""}, ${a.Nombre || ""}`;
    const socioB = `${b.Apellidos || ""}, ${b.Nombre || ""}`;

    return socioA.localeCompare(socioB, "es");
  });

const sociosMostrados = sociosBase
.filter((socio) => {
  const coincideSexo =
    filtroSexo === "TODOS" || socio.SEXE === filtroSexo;

  const coincideComision =
    filtroComision === "TODAS" || socio.Comision === filtroComision;

    const textoSocio = normalizarTexto(
      `${socio.Apellidos || ""} ${socio.Nombre || ""} ${socio.NUMCENS || ""}`
    );
    
    const coincideBusqueda =
      normalizarTexto(busquedaSocio) === "" ||
      textoSocio.includes(normalizarTexto(busquedaSocio));

  return coincideSexo && coincideComision && coincideBusqueda;
})
  .sort((a, b) => {
    if (orden === "NUMCENS") {
      return Number(a.NUMCENS || 0) - Number(b.NUMCENS || 0);
    }

    if (orden === "ANTIGUEDAD_DESC") {
      return (
        Number(b.Antiguedad_Meses_Total || 0) -
        Number(a.Antiguedad_Meses_Total || 0)
      );
    }

    if (orden === "ANTIGUEDAD_ASC") {
      return (
        Number(a.Antiguedad_Meses_Total || 0) -
        Number(b.Antiguedad_Meses_Total || 0)
      );
    }

    if (orden === "NACIMIENTO_ASC") {
      const fechaA = a["FECHA de NACIMIENTO"] || "9999-12-31";
      const fechaB = b["FECHA de NACIMIENTO"] || "9999-12-31";
    
      return fechaA.localeCompare(fechaB);
    }
    
    if (orden === "NACIMIENTO_DESC") {
      const fechaA = a["FECHA de NACIMIENTO"] || "";
      const fechaB = b["FECHA de NACIMIENTO"] || "";
    
      return fechaB.localeCompare(fechaA);
    }
    const nombreA = `${a.Apellidos || ""}, ${a.Nombre || ""}`.toLowerCase();
    const nombreB = `${b.Apellidos || ""}, ${b.Nombre || ""}`.toLowerCase();
    return nombreA.localeCompare(nombreB);
  });

  function tipoCuotaSocio(numcens: any) {
    const cuota = cuotas.find(
      (c) => Number(c.NUMCENS) === Number(numcens)
    );
  
    return cuota?.IDCuota || "-";
  }
  const cargosFiltrados = cargos
  .map((fila) => {
    const socio = socios.find(
      (s) => Number(s.NUMCENS) === Number(fila.NUMCENS)
    );

    return {
      ...fila,
      socio,
    };
  })
  .filter((fila) => {
    if (!fila.socio || fila.socio.Estado !== "Activo") {
      return false;
    }
    const coincideCategoria =
      filtroCategoriaCargo === "TODOS" ||
      fila.CategoriaCargo === filtroCategoriaCargo;
  
      const textoSocio = normalizarTexto(
        `${fila.socio?.Apellidos || ""} ${fila.socio?.Nombre || ""} ${fila.NUMCENS || ""}`
      );
      
      const coincideBusqueda =
        normalizarTexto(busquedaSocio) === "" ||
        textoSocio.includes(normalizarTexto(busquedaSocio));
  
    return coincideCategoria && coincideBusqueda;
  })

  .sort((a, b) => {
    if (ordenCargos === "CARGO_ASC") {
      return String(a.Cargo || "").localeCompare(
        String(b.Cargo || ""),
        "es",
        { sensitivity: "base" }
      );
    }
  
    if (ordenCargos === "CARGO_DESC") {
      return String(b.Cargo || "").localeCompare(
        String(a.Cargo || ""),
        "es",
        { sensitivity: "base" }
      );
    }
  
    const nombreA =
      `${a.socio?.Apellidos || ""}, ${a.socio?.Nombre || ""}`;
  
    const nombreB =
      `${b.socio?.Apellidos || ""}, ${b.socio?.Nombre || ""}`;
  
    if (ordenCargos === "NOMBRE_DESC") {
      return nombreB.localeCompare(nombreA, "es", {
        sensitivity: "base",
      });
    }
  
    return nombreA.localeCompare(nombreB, "es", {
      sensitivity: "base",
    });
  });

  function exportarExcel() {
    let filas: any[] = [];
    let nombreArchivo = "listado.csv";
  
    if (listado === "CUOTAS") {
      filas = cuotasFiltradas.map((cuota) => ({
        NUMCENS: cuota.NUMCENS || "",
        Socio: `${cuota.Apellidos || ""}, ${cuota.Nombre || ""}`,
        Tipo: cuota.IDCuota || "",
        Importe: Number(cuota.Importe || 0).toFixed(2),
        Pagado: Number(cuota.TotalPagado || 0).toFixed(2),
        Pendiente: Number(cuota.Pendiente || 0).toFixed(2),
        "Forma pago": cuota.Metodo || "",
        Estado: cuota.EstadoPago || "",
      }));
  
      nombreArchivo = `cuotas_${ejercicioSeleccionado || ""}.csv`;
    
    } else if (listado === "NACIMIENTO") {
      filas = sociosNacimiento.map((socio) => ({
        NUMCENS: socio.NUMCENS || "",
        Socio: `${socio.Apellidos || ""}, ${socio.Nombre || ""}`,
        "Fecha nacimiento": socio["FECHA de NACIMIENTO"]
          ? new Date(
              `${socio["FECHA de NACIMIENTO"]}T00:00:00`
            ).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "",
        Comisión: socio.Comision || "",
        Antigüedad: abreviarAntiguedad(
          socio.Antiguedad_Calculada
        ),
      }));
    
      nombreArchivo = "nacimiento.csv";

    } else if (listado === "PAGADORES") {
      filas = pagadoresFiltrados.map((pagador) => ({
        Pagador: pagador.Pagador || "",
        Nombre: pagador.NombrePagador || "",
        Método: pagador.Metodo || "",
        Titular: pagador.TitularCuenta || "",
        IBAN: pagador.IBAN || "",
        Socios: pagador.NumeroSocios || 0,
      }));
    
      nombreArchivo = "pagadores.csv";

    } else if (listado === "PAGADOR_SOCIOS") {
      filas = pagadorSocios.map((cuota) => ({
        "NUMCENS pagador":
          cuota.NUMCENS_Pagador || cuota.NUMCENS || "",
        Pagador:
          cuota.PagadorNombre || "Mismo socio",
        "NUMCENS socio":
          cuota.NUMCENS || "",
        Socio:
          `${cuota.Apellidos || ""}, ${cuota.Nombre || ""}`,
        Método:
          cuota.Metodo || "",
        Cuota:
          Number(cuota.Importe || 0).toFixed(2),
      }));
    
      nombreArchivo = "pagador_socios.csv";

    } else if (listado === "CARGOS") {
      filas = cargosFiltrados.map((fila) => ({
        NUMCENS: fila.NUMCENS || "",
        Socio: `${fila.socio?.Apellidos || ""}, ${fila.socio?.Nombre || ""}`,
        Comisión: fila.socio?.Comision || "",
        Cargo: fila.Cargo || "",
        Categoría:
          fila.CategoriaCargo === "REPRESENTATIVO"
            ? "Representativo"
            : fila.CategoriaCargo === "DIRECTIVO"
            ? "Directivo"
            : "Vocal",
      }));
    
      nombreArchivo = `cargos_${ejercicioSeleccionado || ""}.csv`;

    } else if (listado === "BANDA") {
      filas = sociosMostrados.map((socio) => ({
        NUMCENS: socio.NUMCENS || "",
        Socio: `${socio.Apellidos || ""}, ${socio.Nombre || ""}`,
        Comisión: socio.Comision || "",
        Sexo: socio.SEXE || "",
      }));
    
      nombreArchivo = "banda.csv";

    } else {
      filas = sociosMostrados.map((socio) => ({
        NUMCENS: socio.NUMCENS || "",
        Socio: `${socio.Apellidos || ""}, ${socio.Nombre || ""}`,
    
        ...((listado === "ACTIVOS" || listado === "BAJAS")
  ? {
      Teléfono: socio.TelefonoListado || "",
      "Origen teléfono":
        socio.OrigenTelefono === "Propio"
          ? "Propio"
          : socio.OrigenTelefono === "Titular"
          ? "Titular"
          : socio.OrigenTelefono === "Familiar"
          ? "Familiar"
          : "",
      Contacto: socio.ContactoTelefono || "",
    }
  : {}),
    
        "Fecha nacimiento": socio["FECHA de NACIMIENTO"]
          ? new Date(
              `${socio["FECHA de NACIMIENTO"]}T00:00:00`
            ).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "",
    
        "Com/Sx": `${socio.Comision || "-"} / ${socio.SEXE || "-"}`,
    
        Antigüedad: abreviarAntiguedad(
          socio.Antiguedad_Calculada
        ),
      }));
    
      nombreArchivo =
        listado === "ACTIVOS"
          ? "socios_activos.csv"
          : listado === "BAJAS"
          ? "socios_baja.csv"
          : "listado.csv";
    }
  
    const cabeceras = Object.keys(filas[0] || {});
  
    const contenido = [
      cabeceras.join(";"),
      ...filas.map((fila) =>
        cabeceras
          .map((cabecera) =>
            `"${String(fila[cabecera] ?? "").replace(/"/g, '""')}"`
          )
          .join(";")
      ),
    ].join("\n");
  
    const blob = new Blob(["\ufeff" + contenido], {
      type: "text/csv;charset=utf-8;",
    });
  
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
  
    link.href = url;
    link.download = nombreArchivo;
    link.click();
  
    URL.revokeObjectURL(url);
  }

  const sociosNacimiento = socios
  .filter((socio) => {
    const fecha = socio["FECHA de NACIMIENTO"];
  
    if (!fechaNacimientoDesde || !fechaNacimientoHasta || !fecha) {
      return false;
    }
  
    const textoSocio = normalizarTexto(
      `${socio.Apellidos || ""} ${socio.Nombre || ""} ${socio.NUMCENS || ""}`
    );
  
    const coincideBusqueda =
      normalizarTexto(busquedaSocio) === "" ||
      textoSocio.includes(normalizarTexto(busquedaSocio));
  
    return (
      fecha >= fechaNacimientoDesde &&
      fecha <= fechaNacimientoHasta &&
      socio.Estado === "Activo" &&
      coincideBusqueda
    );
  })
  .sort((a, b) => {
    const nombreA = `${a.Apellidos || ""}, ${a.Nombre || ""}`.toLowerCase();
    const nombreB = `${b.Apellidos || ""}, ${b.Nombre || ""}`.toLowerCase();
    return nombreA.localeCompare(nombreB);
  });

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">
        <section className="mb-8 border border-zinc-200 bg-white shadow-sm print:hidden">
          <div className="border-l-4 border-red-900 px-6 py-5">
  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">
        Listados
      </h1>

      <p className="mt-2 text-sm text-zinc-600">
        Selecciona el tipo de listado que quieres consultar o imprimir.
      </p>
    </div>

    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-zinc-700">
        Ejercicio:
      </span>

      <select
        value={ejercicioSeleccionado || ""}
        onChange={(e) =>
          setEjercicioSeleccionado(Number(e.target.value))
        }
        className="border border-zinc-300 bg-white px-3 py-2 text-sm"
      >
        {ejercicios.map((ejercicio) => (
          <option
            key={ejercicio.Ejercicio}
            value={ejercicio.Ejercicio}
          >
            {ejercicio.Ejercicio}
          </option>
        ))}
      </select>
    </div>
  </div>
</div>
          </section>

          <section className="mb-4 flex flex-wrap gap-2 print:hidden">
          <BotonListado
  titulo="Antigüedad activos"
  activo={listado === "ACTIVOS"}
  onClick={() => setListado("ACTIVOS")}
/>
<BotonListado
  titulo="Nacimiento"
  activo={listado === "NACIMIENTO"}
  onClick={() => setListado("NACIMIENTO")}
/>

<BotonListado
  titulo="Socios de baja"
  activo={listado === "BAJAS"}
  onClick={() => setListado("BAJAS")}
/>

<BotonListado
  titulo="Cuotas"
  activo={listado === "CUOTAS"}
  onClick={() => setListado("CUOTAS")}
/>

<BotonListado
  titulo="Banda"
  activo={listado === "BANDA"}
  onClick={() => setListado("BANDA")}
/>

<BotonListado
  titulo="Pagadores"
  activo={listado === "PAGADORES"}
  onClick={() => setListado("PAGADORES")}
/>

<BotonListado
  titulo="Pagador/Socios"
  activo={listado === "PAGADOR_SOCIOS"}
  onClick={() => setListado("PAGADOR_SOCIOS")}
/>

<BotonListado
  titulo="Directivos y cargos"
  activo={listado === "CARGOS"}
  onClick={() => setListado("CARGOS")}
/>

          </section>

          {listado && (
  <section className="mt-8 border border-zinc-200 bg-white">
    <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
  {listado === "ACTIVOS" && "Socios activos"}
  {listado === "NACIMIENTO" && "Nacimiento"}
  {listado === "BAJAS" && "Socios de baja"}
  {listado === "CUOTAS" && "Cuotas"}
  {listado === "BANDA" && "Banda"}
  {listado === "PAGADORES" && "Pagadores"}
  {listado === "PAGADOR_SOCIOS" && "Pagador / Socios"}
  {listado === "CARGOS" && "Directivos y cargos"}
</h2>


<p className="text-xs text-zinc-500">
  {listado === "CUOTAS"
    ? `Mostrando ${cuotasFiltradas.length} cuotas`
    : listado === "NACIMIENTO"
    ? `Mostrando ${sociosNacimiento.length} socios`
    : listado === "CARGOS"
    ? `Mostrando ${cargosFiltrados.length} socios`
    : listado === "PAGADORES"
    ? `Mostrando ${pagadoresFiltrados.length} pagadores`
    : listado === "PAGADOR_SOCIOS"
    ? `Mostrando ${pagadorSocios.length} relaciones`
    : `Mostrando ${sociosMostrados.length} socios`}
</p>
      </div>

      <div className="flex gap-2 print:hidden">

      <input
  type="text"
  value={busquedaSocio}
  onChange={(e) => setBusquedaSocio(e.target.value)}
  placeholder="Buscar socio..."
  className="w-64 border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
/>
  <button
    onClick={exportarExcel}
    className="bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
  >
    Exportar Excel
  </button>

  <button
    onClick={() => window.print()}
    className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
  >
    Imprimir
  </button>
</div>
    </div>

    {(listado === "ACTIVOS" || listado === "BAJAS") && (

    <div className="border-t border-zinc-200 bg-white px-4 py-4">
    <div className="flex flex-wrap items-center gap-6">
    <GrupoFiltro titulo="Sexo">
      <FiltroButton active={filtroSexo === "TODOS"} onClick={() => setFiltroSexo("TODOS")}>
        Todos
      </FiltroButton>
      <FiltroButton active={filtroSexo === "H"} onClick={() => setFiltroSexo("H")}>
        Hombres
      </FiltroButton>
      <FiltroButton active={filtroSexo === "M"} onClick={() => setFiltroSexo("M")}>
        Mujeres
      </FiltroButton>
    </GrupoFiltro>

    <GrupoFiltro titulo="Comisión">
      <FiltroButton active={filtroComision === "TODAS"} onClick={() => setFiltroComision("TODAS")}>
        Todas
      </FiltroButton>
      <FiltroButton active={filtroComision === "MAY"} onClick={() => setFiltroComision("MAY")}>
        Mayores
      </FiltroButton>
      <FiltroButton active={filtroComision === "INF"} onClick={() => setFiltroComision("INF")}>
        Infantiles
      </FiltroButton>
    </GrupoFiltro>

    <GrupoFiltro titulo="Orden">
      <FiltroButton active={orden === "NOMBRE"} onClick={() => setOrden("NOMBRE")}>
        Nombre
      </FiltroButton>
      <FiltroButton active={orden === "NUMCENS"} onClick={() => setOrden("NUMCENS")}>
        NUMCENS
      </FiltroButton>
      <FiltroButton active={orden === "ANTIGUEDAD_DESC"} onClick={() => setOrden("ANTIGUEDAD_DESC")}>
        Antigüedad +
      </FiltroButton>
      <FiltroButton active={orden === "ANTIGUEDAD_ASC"} onClick={() => setOrden("ANTIGUEDAD_ASC")}>
        Antigüedad -
      </FiltroButton>
      <FiltroButton
  active={orden === "NACIMIENTO_ASC"}
  onClick={() => setOrden("NACIMIENTO_ASC")}
>
  Nacimiento +
</FiltroButton>

<FiltroButton
  active={orden === "NACIMIENTO_DESC"}
  onClick={() => setOrden("NACIMIENTO_DESC")}
>
  Nacimiento -
</FiltroButton>
    </GrupoFiltro>
  </div>
</div>
 )}

{listado === "NACIMIENTO" && (
  <div className="border-t border-zinc-200 bg-white px-4 py-4">
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
        Nacidos desde:
        <input
          type="date"
          value={fechaNacimientoDesde}
          onChange={(e) => setFechaNacimientoDesde(e.target.value)}
          className="border border-zinc-300 px-2 py-1 text-xs font-normal"
        />
      </label>

      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
        Hasta:
        <input
          type="date"
          value={fechaNacimientoHasta}
          onChange={(e) => setFechaNacimientoHasta(e.target.value)}
          className="border border-zinc-300 px-2 py-1 text-xs font-normal"
        />
      </label>
    </div>
  </div>
)}

{listado === "CARGOS" && (
  <div className="border-t border-zinc-200 bg-white px-4 py-4">
    <div className="flex flex-wrap items-center gap-6">
      <GrupoFiltro titulo="Categoría">
        <FiltroButton
          active={filtroCategoriaCargo === "TODOS"}
          onClick={() => setFiltroCategoriaCargo("TODOS")}
        >
          Todos
        </FiltroButton>

        <FiltroButton
          active={filtroCategoriaCargo === "REPRESENTATIVO"}
          onClick={() => setFiltroCategoriaCargo("REPRESENTATIVO")}
        >
          Representativos
        </FiltroButton>

        <FiltroButton
          active={filtroCategoriaCargo === "DIRECTIVO"}
          onClick={() => setFiltroCategoriaCargo("DIRECTIVO")}
        >
          Directivos
        </FiltroButton>

        <FiltroButton
          active={filtroCategoriaCargo === "VOCAL"}
          onClick={() => setFiltroCategoriaCargo("VOCAL")}
        >
          Vocales
        </FiltroButton>
      </GrupoFiltro>
    </div>
  </div>
)}

 {listado === "CUOTAS" && (
  <div className="border-t border-zinc-200 bg-white px-4 py-4 print:hidden">
    <div className="flex flex-wrap items-center gap-4">
      <SelectFiltro
        label="Tipo"
        value={filtroTipoCuota}
        onChange={setFiltroTipoCuota}
        opciones={["TODOS", ...tiposCuota]}
      />

<SelectFiltro
  label="Estado"
  value={filtroEstadoCuota}
  onChange={setFiltroEstadoCuota}
  opciones={["TODOS", ...estadosCuota]}
/>

      <SelectFiltro
        label="Forma pago"
        value={filtroFormaPago}
        onChange={setFiltroFormaPago}
        opciones={["TODAS", ...formasPago]}
      />

      <SelectFiltro
        label="Pendiente"
        value={filtroPendiente}
        onChange={setFiltroPendiente}
        opciones={["TODOS", "SI", "NO"]}
      />
    </div>
  </div>
)}

{listado === "CUOTAS" && (
  <div className="hidden border-t border-zinc-200 px-4 py-2 text-xs text-zinc-600 print:flex print:flex-wrap print:items-center print:gap-x-6">
    <span>
      <strong>Tipo:</strong>{" "}
      {filtroTipoCuota === "TODOS" ? "Todos" : filtroTipoCuota}
    </span>

    <span>
      <strong>Estado:</strong>{" "}
      {filtroEstadoCuota === "TODOS" ? "Todos" : filtroEstadoCuota}
    </span>

    <span>
      <strong>Forma pago:</strong>{" "}
      {filtroFormaPago === "TODAS" ? "Todas" : filtroFormaPago}
    </span>

    <span>
      <strong>Pendiente:</strong>{" "}
      {filtroPendiente === "TODOS"
        ? "Todos"
        : filtroPendiente === "SI"
        ? "Sí"
        : "No"}
    </span>
  </div>
)}

    <div className="overflow-x-auto">
      <table className="w-full text-sm">
      <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
  <tr>
    {listado === "NACIMIENTO" ? (
      <>
        <th className="px-4 py-3">NUMCENS</th>
        <th className="px-4 py-3">Socio</th>
        <th className="px-4 py-3">Fecha nacimiento</th>
        <th className="px-4 py-3">Comisión</th>
        <th className="px-4 py-3">Antigüedad</th>
      </>
    ) : listado === "BANDA" ? (
      <>
        <th className="px-4 py-3">NUMCENS</th>
        <th className="px-4 py-3">Socio</th>
        <th className="px-4 py-3">Comisión</th>
        <th className="px-4 py-3">Sexo</th>
      </>
    ) : listado === "CUOTAS" ? (
      <>
        <th className="px-4 py-3">NUMCENS</th>
        <th className="px-4 py-3">Socio</th>
        <th className="px-4 py-3">Tipo</th>
        <th className="px-4 py-3 text-right">Importe</th>
        <th className="px-4 py-3 text-right">Pagado</th>
        <th className="px-4 py-3 text-right">Pendiente</th>
        <th className="px-4 py-3">Forma pago</th>
        <th className="px-4 py-3">Estado</th>
      </>
    ) : listado === "PAGADOR_SOCIOS" ? (
      <>
        <th className="w-24 px-4 py-3">NUMCENS pagador</th>
        <th className="px-4 py-3">Pagador</th>
        <th className="w-24 px-4 py-3">NUMCENS socio</th>
        <th className="px-4 py-3">Socio</th>
        <th className="px-4 py-3">Método</th>
        <th className="w-28 px-4 py-3 text-right">Cuota</th>
      </>
    ) : listado === "PAGADORES" ? (
      <>
        <th className="w-8 px-4 py-3">Pagador</th>
        <th className="px-4 py-3">Nombre</th>
        <th className="w-20 px-4 py-3">Método</th>
        <th className="px-4 py-3">Titular</th>
        <th className="px-4 py-3 whitespace-nowrap">IBAN</th>
        <th className="w-16 px-4 py-3 text-right">Socios</th>
      </>
    ) : listado === "CARGOS" ? (
      <>
        <th className="px-4 py-3">NUMCENS</th>
        <th className="px-4 py-3">
  <button
    type="button"
    onClick={() =>
      setOrdenCargos((actual) =>
        actual === "NOMBRE_ASC" ? "NOMBRE_DESC" : "NOMBRE_ASC"
      )
    }
    className="flex items-center gap-1 font-semibold uppercase hover:text-red-900"
  >
    Socio
    <span className="text-[10px]">
      {ordenCargos === "NOMBRE_ASC"
        ? "↑"
        : ordenCargos === "NOMBRE_DESC"
        ? "↓"
        : "↕"}
    </span>
  </button>
</th>
        <th className="px-4 py-3">Comisión</th>
        <th className="px-4 py-3">
  <button
    type="button"
    onClick={() =>
      setOrdenCargos((actual) =>
        actual === "CARGO_ASC" ? "CARGO_DESC" : "CARGO_ASC"
      )
    }
    className="flex items-center gap-1 font-semibold uppercase hover:text-red-900"
  >
    Cargo
    <span className="text-[10px]">
      {ordenCargos === "CARGO_ASC"
        ? "↑"
        : ordenCargos === "CARGO_DESC"
        ? "↓"
        : "↕"}
    </span>
  </button>
</th>
        <th className="px-4 py-3">Categoría</th>
        <th className="w-20 px-4 py-3 text-center print:hidden">
  Editar
</th>
      </>
    ) : (
      <>
        <th className="px-4 py-3">NUMCENS</th>
        <th className="px-4 py-3">Socio</th>
        <th className="px-4 py-3">Teléfono / contacto</th>
        <th className="px-4 py-3">Fecha nacimiento</th>
        <th className="px-4 py-3">Com/Sx</th>
        <th className="px-4 py-3 text-right">Antigüedad</th>
      </>
    )}
  </tr>
</thead>

<tbody>
  {listado === "NACIMIENTO" ? (
    sociosNacimiento.map((socio) => (
      <tr
        key={socio.NUMCENS}
        className="border-t border-zinc-200 hover:bg-red-50"
      >
        <td className="px-4 py-3 text-zinc-600">
          {socio.NUMCENS}
        </td>

        <td className="px-4 py-3 font-medium text-zinc-900">
          <LinkSocio numcens={socio.NUMCENS}>
            {socio.Apellidos}, {socio.Nombre}
          </LinkSocio>
        </td>

        <td className="px-4 py-3">
          {socio["FECHA de NACIMIENTO"]
            ? new Date(
                `${socio["FECHA de NACIMIENTO"]}T00:00:00`
              ).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "-"}
        </td>

        <td className="px-4 py-3">
          {socio.Comision || "-"}
        </td>

        <td className="px-4 py-3">
          {abreviarAntiguedad(socio.Antiguedad_Calculada)}
        </td>
      </tr>
    ))
  ) : listado === "CUOTAS" ? (
    cuotasFiltradas.map((cuota) => (
      <tr
        key={cuota.IDCuotaSocio}
        className="border-t border-zinc-200 hover:bg-red-50"
      >
        <td className="px-4 py-3 text-zinc-600">
          {cuota.NUMCENS}
        </td>

        <td className="px-4 py-3 font-medium text-zinc-900">
          <LinkSocio numcens={cuota.NUMCENS}>
            {cuota.Apellidos}, {cuota.Nombre}
          </LinkSocio>
        </td>

        <td className="px-4 py-3 text-zinc-600">
          {cuota.IDCuota}
        </td>

        <td className="px-4 py-3 text-right">
          {Number(cuota.Importe || 0).toFixed(2)} €
        </td>

        <td className="px-4 py-3 text-right text-green-700">
          {Number(cuota.TotalPagado || 0).toFixed(2)} €
        </td>

        <td className="px-4 py-3 text-right font-medium text-red-700">
          {Number(cuota.Pendiente || 0).toFixed(2)} €
        </td>

        <td className="px-4 py-3 text-zinc-600">
          {cuota.Metodo || "-"}
        </td>

        <td className="px-4 py-3 text-zinc-600">
          {cuota.EstadoPago || "-"}
        </td>
      </tr>
    ))
  ) : listado === "PAGADOR_SOCIOS" ? (
    pagadorSocios.map((cuota) => (
      <tr
        key={cuota.IDCuotaSocio}
        className="border-t border-zinc-200 hover:bg-red-50"
      >
        <td className="px-4 py-3 text-zinc-600">
          {cuota.NUMCENS_Pagador || cuota.NUMCENS || "-"}
        </td>

        <td className="px-4 py-3 font-medium text-zinc-900">
          {cuota.PagadorNombre || "Mismo socio"}
        </td>

        <td className="px-4 py-3 text-zinc-600">
          {cuota.NUMCENS}
        </td>

        <td className="px-4 py-3 font-medium text-zinc-900">
          <LinkSocio numcens={cuota.NUMCENS}>
            {cuota.Apellidos}, {cuota.Nombre}
          </LinkSocio>
        </td>

        <td className="px-4 py-3 text-zinc-600">
          {cuota.Metodo || "-"}
        </td>

        <td className="px-4 py-3 text-right">
          {Number(cuota.Importe || 0).toFixed(2)} €
        </td>
      </tr>
    ))
  ) : listado === "PAGADORES" ? (
    pagadoresFiltrados.map((pagador) => (
      <tr
        key={`${pagador.Pagador}-${pagador.Metodo}`}
        className="border-t border-zinc-200 hover:bg-red-50"
      >
        <td className="px-4 py-3 text-zinc-600">
          {pagador.Pagador}
        </td>

        <td className="px-4 py-3 font-medium text-zinc-900">
          {pagador.NombrePagador || "-"}
        </td>

        <td className="px-4 py-3 text-zinc-600">
          {pagador.Metodo || "-"}
        </td>

        <td className="px-4 py-3 text-zinc-600">
          {pagador.TitularCuenta || "-"}
        </td>

        <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
          {pagador.IBAN || "-"}
        </td>

        <td className="px-4 py-3 text-right font-medium">
          {pagador.NumeroSocios || 0}
        </td>
      </tr>
    ))
  ) : listado === "CARGOS" ? (
    cargosFiltrados.map((fila) => (
      <tr
        key={fila.ID}
        className="border-t border-zinc-200 hover:bg-red-50"
      >
        <td className="px-4 py-3 text-zinc-600">
          {fila.NUMCENS}
        </td>

        <td className="px-4 py-3 font-medium text-zinc-900">
          <LinkSocio numcens={fila.NUMCENS}>
            {fila.socio?.Apellidos || "-"}, {fila.socio?.Nombre || "-"}
          </LinkSocio>
        </td>

        <td className="px-4 py-3 text-zinc-600">
          {fila.socio?.Comision || "-"}
        </td>

        <td className="px-4 py-3">
          <span
            className={
              fila.CategoriaCargo === "REPRESENTATIVO"
                ? "bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800"
                : fila.CategoriaCargo === "DIRECTIVO"
                ? "bg-red-100 px-2 py-1 text-xs font-semibold text-red-800"
                : "bg-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700"
            }
          >
            {fila.Cargo || "-"}
          </span>
        </td>

        <td className="px-4 py-3 text-zinc-600">
  {fila.CategoriaCargo === "REPRESENTATIVO"
    ? "Representativo"
    : fila.CategoriaCargo === "DIRECTIVO"
    ? "Directivo"
    : "Vocal"}
</td>

<td className="px-4 py-3 text-center print:hidden">
  <EditarCargoHistorial
    id={Number(fila.ID)}
    numcens={Number(fila.NUMCENS)}
    ejercicio={Number(fila.Ejercicio)}
    ejercicioActivo={ejercicioActivo}
    cargoInicial={fila.Cargo}
    categoriaInicial={fila.CategoriaCargo}
    soloBoton={true}
    onGuardado={() =>
      setRecargarCargos((valor) => valor + 1)
    }
  />
</td>

</tr>
    ))
  ) : (
    sociosMostrados.map((socio) => (
      <tr
        key={socio.NUMCENS}
        className="border-t border-zinc-200 hover:bg-red-50"
      >
        {listado === "BANDA" ? (
          <>
            <td className="px-4 py-3 text-zinc-600">
              {socio.NUMCENS}
            </td>

            <td className="px-4 py-3 font-medium text-zinc-900">
              <LinkSocio numcens={socio.NUMCENS}>
                {socio.Apellidos}, {socio.Nombre}
              </LinkSocio>
            </td>

            <td className="px-4 py-3 text-zinc-600">
              {socio.Comision || "-"}
            </td>

            <td className="px-4 py-3 text-zinc-600">
              {socio.SEXE || "-"}
            </td>
          </>
        ) : (
          <>
            <td className="px-4 py-3 text-zinc-600">
              {socio.NUMCENS}
            </td>

            <td className="px-4 py-3 font-medium text-zinc-900">
              <LinkSocio numcens={socio.NUMCENS}>
                {socio.Apellidos}, {socio.Nombre}
              </LinkSocio>
            </td>

            <td className="px-4 py-3">
  {socio.TelefonoListado ? (
    <div>
      <div className="font-medium text-zinc-900">
        {socio.OrigenTelefono === "Titular"
          ? "T · "
          : socio.OrigenTelefono === "Familiar"
          ? "F · "
          : ""}
        {socio.TelefonoListado}
      </div>

      {socio.OrigenTelefono !== "Propio" &&
        socio.ContactoTelefono && (
          <div className="text-xs text-zinc-500">
            {socio.ContactoTelefono}
          </div>
        )}
    </div>
  ) : (
    <span className="text-zinc-400">-</span>
  )}
</td>

            <td className="px-4 py-3 text-zinc-600">
              {socio["FECHA de NACIMIENTO"]
                ? new Date(
                    `${socio["FECHA de NACIMIENTO"]}T00:00:00`
                  ).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "-"}
            </td>

            <td className="px-4 py-3 text-zinc-600">
              {socio.Comision || "-"} / {socio.SEXE || "-"}
            </td>

            <td className="px-4 py-3 text-right font-medium">
              {abreviarAntiguedad(socio.Antiguedad_Calculada)}
            </td>
          </>
        )}
      </tr>
    ))
  )}
</tbody>
      </table>
    </div>
  </section>
)}

{error && (
  <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    Error: {error}
  </div>
)}

        </div>
      </main>
    </div>
  );
}

function BotonListado({
    titulo,
    activo,
    onClick,
  }: {
    titulo: string;
    activo: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        onClick={onClick}
        className={
            activo
              ? "shrink-0 border border-red-900 bg-red-900 px-4 py-2 text-sm text-white"
              : "shrink-0 border border-zinc-200 bg-white px-4 py-2 text-sm hover:border-red-900 hover:bg-red-50"
          }
      >

<span
  className={
    activo
      ? "font-medium text-white"
      : "font-medium text-zinc-800"
  }
>
  {titulo}
</span>
      </button>
    );
  }
  function GrupoFiltro({
    titulo,
    children,
  }: {
    titulo: string;
    children: React.ReactNode;
  }) {
    return (
      <div>
        <p className="mr-2 text-xs font-semibold text-zinc-600">
          {titulo}
        </p>
  
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
    );
  }
  
  function FiltroButton({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) {
    return (
      <button
        onClick={onClick}
        className={
          active
            ? "bg-red-900 px-4 py-2 text-sm font-medium text-white"
            : "bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
        }
      >
        {children}
      </button>
    );
  }

  function SelectFiltro({
    label,
    value,
    onChange,
    opciones,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    opciones: string[];
  }) {
    return (
      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
        {label}:
  
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border border-zinc-300 bg-white px-2 py-1 text-xs font-normal text-zinc-700"
        >
          {opciones.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
      </label>
    );
  }