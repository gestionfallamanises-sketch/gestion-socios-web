"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { normalizarTexto } from "@/lib/texto";

function normalizar(texto: string) {
  return normalizarTexto(texto);
}

export default function TrasladarFamiliaButton({
  idFamiliaOrigen,
}: {
  idFamiliaOrigen: number;
}) {
  const router = useRouter();

  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [familias, setFamilias] = useState<any[]>([]);
  const [familiaDestino, setFamiliaDestino] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [miembros, setMiembros] = useState<any[]>([]);
  const [miembrosSeleccionados, setMiembrosSeleccionados] = useState<number[]>([]);
  const [sociosPagadores, setSociosPagadores] = useState<any[]>([]);
const [pagadoresExternos, setPagadoresExternos] = useState<any[]>([]);
const [formasPago, setFormasPago] = useState<any[]>([]);
const [pagadoresSeleccionados, setPagadoresSeleccionados] = useState<
  Record<number, string>
>({});
const [pagadoresOriginales, setPagadoresOriginales] = useState<
  Record<number, string>
>({});
const [cambiarPagador, setCambiarPagador] = useState<
  Record<number, boolean>
>({});
const [busquedaPagador, setBusquedaPagador] = useState<
  Record<number, string>
>({});
const [nuevoTitular, setNuevoTitular] = useState<number | null>(null);
const [titularOrigen, setTitularOrigen] = useState<number | null>(null);

useEffect(() => {
  cargarFamilias();
  cargarMiembros();
  cargarPagadores();
}, []);

async function cargarFamilias() {
  const { data: familiasData, error: errorFamilias } = await (supabase as any)
    .from("FAMILIAS")
    .select("ID_Familia, Nombre_Familia, Titular_NUMCENS")
    .neq("ID_Familia", idFamiliaOrigen)
    .order("Nombre_Familia", { ascending: true });

  if (errorFamilias) {
    alert("Error cargando familias: " + errorFamilias.message);
    return;
  }

  const { data: sociosData, error: errorSocios } = await (supabase as any)
    .from("SOCIOS")
    .select("ID_Familia")
    .not("ID_Familia", "is", null);

  if (errorSocios) {
    alert("Error comprobando familias: " + errorSocios.message);
    return;
  }

  const familiasConMiembros = new Set(
    (sociosData || []).map((socio: any) => Number(socio.ID_Familia))
  );

  const familiasActivas = (familiasData || []).filter((familia: any) =>
    familiasConMiembros.has(Number(familia.ID_Familia))
  );

  setFamilias(familiasActivas);
}

  async function cargarMiembros() {
    const { data, error } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS, Nombre, Apellidos")
      .eq("ID_Familia", idFamiliaOrigen)
      .order("Apellidos", { ascending: true });
  
    if (error) {
      alert("Error cargando miembros: " + error.message);
      return;
    }
  
    setMiembros(data || []);

    const { data: familiaData, error: errorFamilia } =
  await (supabase as any)
    .from("FAMILIAS")
    .select("Titular_NUMCENS")
    .eq("ID_Familia", idFamiliaOrigen)
    .maybeSingle();

if (errorFamilia) {
  alert("Error cargando titular: " + errorFamilia.message);
  return;
}

setTitularOrigen(
  familiaData?.Titular_NUMCENS
    ? Number(familiaData.Titular_NUMCENS)
    : null
);
  }

  async function cargarPagadores() {
    const { data: sociosData, error: errorSocios } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS, Nombre, Apellidos")
      .order("Apellidos", { ascending: true });
  
    if (errorSocios) {
      alert("Error cargando socios: " + errorSocios.message);
      return;
    }
  
    const { data: externosData, error: errorExternos } = await (supabase as any)
      .from("PAGADORES_EXTERNOS")
      .select("*")
      .eq("Activo", true)
      .order("Apellidos", { ascending: true });
  
    if (errorExternos) {
      alert("Error cargando pagadores externos: " + errorExternos.message);
      return;
    }
  
    const { data: formasData, error: errorFormas } = await (supabase as any)
      .from("FORMAS_PAGO_SOCIOS")
      .select("*")
      .eq("Activo", true);
  
    if (errorFormas) {
      alert("Error cargando formas de pago: " + errorFormas.message);
      return;
    }
  
    setSociosPagadores(sociosData || []);
    setPagadoresExternos(externosData || []);
    setFormasPago(formasData || []);
  
    const iniciales: Record<number, string> = {};
  
    (formasData || []).forEach((forma: any) => {
      if (forma.IDPagadorExterno) {
        iniciales[Number(forma.NUMCENS)] =
          `externo-${forma.IDPagadorExterno}`;
      } else if (forma.NUMCENS_Pagador) {
        iniciales[Number(forma.NUMCENS)] =
          String(forma.NUMCENS_Pagador);
      }
    });
  
    setPagadoresOriginales(iniciales);
setPagadoresSeleccionados(iniciales);
  }

  const familiasFiltradas = familias.filter((familia) =>
    normalizar(familia.Nombre_Familia || "").includes(normalizar(busqueda))
  );

  function cambiarSeleccion(numcens: number) {
    setMiembrosSeleccionados((actuales) =>
      actuales.includes(numcens)
        ? actuales.filter((n) => n !== numcens)
        : [...actuales, numcens]
    );
  }
  
  function seleccionarTodos() {
    if (miembrosSeleccionados.length === miembros.length) {
      setMiembrosSeleccionados([]);
    } else {
      setMiembrosSeleccionados(
        miembros.map((miembro) => Number(miembro.NUMCENS))
      );
    }
  }

  function nombrePagador(numcensSocio: number) {
    const valor = pagadoresOriginales[numcensSocio];
  
    if (!valor) {
      return "Sin pagador asignado";
    }
  
    if (valor.startsWith("externo-")) {
      const idExterno = Number(valor.replace("externo-", ""));
  
      const externo = pagadoresExternos.find(
        (p) => Number(p.IDPagadorExterno) === idExterno
      );
  
      return externo
        ? `${externo.Nombre || ""} ${externo.Apellidos || ""}`.trim()
        : "Pagador externo";
    }
  
    const socio = sociosPagadores.find(
      (s) => Number(s.NUMCENS) === Number(valor)
    );
  
    return socio
      ? `${socio.Nombre || ""} ${socio.Apellidos || ""}`.trim()
      : `Socio nº ${valor}`;
  }

  function obtenerFormaPagoParaNuevoPagador(
    numcensSocio: number,
    nuevoPagador: string
  ) {
    const formaActualSocio = formasPago.find(
      (fp) =>
        Number(fp.NUMCENS) === Number(numcensSocio) &&
        fp.Activo === true
    );
  
    // PAGADOR EXTERNO:
    // mantiene la forma de pago actual del socio.
    if (nuevoPagador.startsWith("externo-")) {
      return formaActualSocio || null;
    }
  
    const numcensNuevoPagador = Number(nuevoPagador);
  
    // ÉL MISMO:
    // mantiene su propia forma de pago.
    if (numcensNuevoPagador === Number(numcensSocio)) {
      return formaActualSocio || null;
    }
  
    // OTRO SOCIO:
    // utiliza la forma de pago activa del nuevo pagador.
    const formaNuevoPagador = formasPago.find(
      (fp) =>
        Number(fp.NUMCENS) === numcensNuevoPagador &&
        fp.Activo === true
    );
  
    return formaNuevoPagador || null;
  }

  async function trasladar() {
  if (!familiaDestino) {
    alert("Selecciona una familia destino.");
    return;
  }

  if (miembrosSeleccionados.length === 0) {
    alert("Selecciona al menos un miembro.");
    return;
  }

  if (necesitaNuevoTitular && !nuevoTitular) {
    alert(
      "El titular actual está incluido en el traslado. Selecciona un nuevo titular para la familia de origen."
    );
    return;
  }

  const socioSinNuevoPagador = miembrosSeleccionados.find(
    (numcens) =>
      cambiarPagador[numcens] === true &&
      !pagadoresSeleccionados[numcens]
  );

  if (socioSinNuevoPagador) {
    const socio = miembros.find(
      (miembro) =>
        Number(miembro.NUMCENS) === Number(socioSinNuevoPagador)
    );

    alert(
      `Has indicado que quieres cambiar el pagador de ${
        socio
          ? `${socio.Nombre} ${socio.Apellidos}`
          : `socio nº ${socioSinNuevoPagador}`
      }, pero no has seleccionado un nuevo pagador.`
    );

    return;
  }

  // Comprobar que los nuevos pagadores socio tienen
  // una forma de pago activa.
  for (const numcens of miembrosSeleccionados) {
    if (cambiarPagador[numcens] !== true) continue;

    const nuevoPagador = pagadoresSeleccionados[numcens];

    if (!nuevoPagador) continue;

    const formaPagoNueva = obtenerFormaPagoParaNuevoPagador(
      numcens,
      nuevoPagador
    );

    if (!formaPagoNueva) {
      const socio = miembros.find(
        (miembro) =>
          Number(miembro.NUMCENS) === Number(numcens)
      );

      alert(
        `No se puede cambiar el pagador de ${
          socio
            ? `${socio.Nombre} ${socio.Apellidos}`
            : `socio nº ${numcens}`
        } porque no se ha encontrado una forma de pago válida.`
      );

      return;
    }
  }

  const miembrosQueQuedan = miembros.filter(
    (miembro) =>
      !miembrosSeleccionados.includes(Number(miembro.NUMCENS))
  );

  let mensajeConfirmacion = `¿Trasladar ${
    miembrosSeleccionados.length === 1
      ? "1 miembro"
      : `${miembrosSeleccionados.length} miembros`
  } a "${familiaDestino.Nombre_Familia}"?`;

  if (miembrosQueQuedan.length === 1) {
    mensajeConfirmacion += `

⚠️ La familia de origen quedará con un solo socio.

Una familia debe tener al menos 2 miembros. Si continúas, el socio restante quedará sin familia y la familia de origen quedará bloqueada y dejará de aparecer en la gestión de familias.`;
  }

  if (miembrosQueQuedan.length === 0) {
    mensajeConfirmacion += `

⚠️ Se trasladarán todos los miembros.

La familia de origen quedará vacía, se bloqueará y dejará de aparecer en la gestión de familias.`;
  }

  const confirmar = confirm(mensajeConfirmacion);

  if (!confirmar) return;

  setCargando(true);

  try {
    // 1. Obtener ejercicio activo
    const { data: ejercicioData, error: errorEjercicio } =
      await (supabase as any)
        .from("EJERCICIOS")
        .select("Ejercicio")
        .eq("Activo", true)
        .maybeSingle();

    if (errorEjercicio) {
      throw new Error(errorEjercicio.message);
    }

    const ejercicioActivo = Number(
      ejercicioData?.Ejercicio || 0
    );

    if (!ejercicioActivo) {
      throw new Error(
        "No se ha encontrado un ejercicio activo."
      );
    }

    // 2. Trasladar los socios seleccionados
    const { error: errorSocios } = await (supabase as any)
      .from("SOCIOS")
      .update({
        ID_Familia: familiaDestino.ID_Familia,
      })
      .in("NUMCENS", miembrosSeleccionados);

    if (errorSocios) {
      throw new Error(errorSocios.message);
    }

    // 3. Si queda un único socio en la familia de origen,
    // deja de pertenecer a una familia.
    if (miembrosQueQuedan.length === 1) {
      const numcensRestante = Number(
        miembrosQueQuedan[0].NUMCENS
      );

      const { error: errorSocioRestante } =
        await (supabase as any)
          .from("SOCIOS")
          .update({
            ID_Familia: null,
          })
          .eq("NUMCENS", numcensRestante);

      if (errorSocioRestante) {
        throw new Error(errorSocioRestante.message);
      }
    }

    // 4. Si la familia continúa y se traslada al titular,
    // guardar el nuevo titular seleccionado.
    if (miembrosQueQuedan.length >= 2) {
      const { data: familiaOrigen, error: errorFamiliaOrigen } =
        await (supabase as any)
          .from("FAMILIAS")
          .select("Titular_NUMCENS")
          .eq("ID_Familia", idFamiliaOrigen)
          .maybeSingle();

      if (errorFamiliaOrigen) {
        throw new Error(errorFamiliaOrigen.message);
      }

      const titularActual = Number(
        familiaOrigen?.Titular_NUMCENS || 0
      );

      if (
        miembrosSeleccionados.includes(titularActual)
      ) {
        const { error: errorNuevoTitular } =
          await (supabase as any)
            .from("FAMILIAS")
            .update({
              Titular_NUMCENS: nuevoTitular,
            })
            .eq("ID_Familia", idFamiliaOrigen);

        if (errorNuevoTitular) {
          throw new Error(errorNuevoTitular.message);
        }
      }
    }

    // 5. Cambiar el pagador únicamente de los socios
    // para los que se haya pulsado "Cambiar".
    for (const numcens of miembrosSeleccionados) {
      if (cambiarPagador[numcens] !== true) {
        continue;
      }

      const nuevoPagador =
        pagadoresSeleccionados[numcens];

      const formaPagoNueva =
        obtenerFormaPagoParaNuevoPagador(
          numcens,
          nuevoPagador
        );

      if (!formaPagoNueva) {
        throw new Error(
          `No se ha encontrado una forma de pago válida para el socio nº ${numcens}.`
        );
      }

      const esExterno =
        nuevoPagador.startsWith("externo-");

      const idPagadorExterno = esExterno
        ? Number(
            nuevoPagador.replace("externo-", "")
          )
        : null;

      const numcensPagador = esExterno
        ? null
        : Number(nuevoPagador);

      // Desactivar la forma de pago anterior del socio.
      const { error: errorDesactivar } =
        await (supabase as any)
          .from("FORMAS_PAGO_SOCIOS")
          .update({
            Activo: false,
          })
          .eq("NUMCENS", numcens)
          .eq("Activo", true);

      if (errorDesactivar) {
        throw new Error(errorDesactivar.message);
      }

      // Crear la nueva forma de pago.
      //
      // Otro socio:
      //   hereda método y plazos del nuevo pagador.
      //
      // Él mismo o externo:
      //   conserva la forma de pago que tenía el socio.
      const { error: errorNuevaForma } =
        await (supabase as any)
          .from("FORMAS_PAGO_SOCIOS")
          .insert({
            NUMCENS: numcens,
            Metodo: formaPagoNueva.Metodo,
            NumeroPlazos:
              formaPagoNueva.NumeroPlazos || 1,
            Fraccionado:
              formaPagoNueva.Fraccionado ??
              Number(formaPagoNueva.NumeroPlazos || 1) > 1,
            Activo: true,
            NUMCENS_Pagador: numcensPagador,
            IDPagadorExterno: idPagadorExterno,
            Observaciones:
              formaPagoNueva.Observaciones || null,
          });

      if (errorNuevaForma) {
        throw new Error(errorNuevaForma.message);
      }
    }

    // 6. Recalcular las cuotas después de cambiar
    // familia y, en su caso, pagador.
    const { error: errorRecalculo } =
      await (supabase as any).rpc(
        "generar_actualizar_cuotas_completo",
        {
          p_ejercicio: ejercicioActivo,
        }
      );

    if (errorRecalculo) {
      throw new Error(errorRecalculo.message);
    }

    alert("Miembros trasladados correctamente.");

    setAbierto(false);
    router.refresh();
  } catch (error: any) {
    alert(
      "No se ha podido completar el traslado: " +
        (error?.message || "Error desconocido")
    );
  } finally {
    setCargando(false);
  }
}

  const miembrosQueQuedan = miembros.filter(
    (miembro) =>
      !miembrosSeleccionados.includes(Number(miembro.NUMCENS))
  );
  
  const titularSeTraslada =
    titularOrigen !== null &&
    miembrosSeleccionados.includes(titularOrigen);
  
  const necesitaNuevoTitular =
    titularSeTraslada && miembrosQueQuedan.length >= 2;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        Trasladar miembros
      </button>
  
      {abierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-xl">
  
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  Trasladar miembros
                </h2>
  
                <p className="mt-1 text-xs text-zinc-500">
  Selecciona los miembros que quieres trasladar y la familia de destino.
</p>
              </div>
  
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  setBusqueda("");
                  setFamiliaDestino(null);
                }}
                disabled={cargando}
                className="text-xl text-zinc-400 hover:text-zinc-700"
              >
                ×
              </button>
            </div>
  
            <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-5">
  <div className="mb-2 flex items-center justify-between">
    <label className="text-xs font-medium uppercase text-zinc-600">
      Miembros a trasladar
    </label>

    <button
      type="button"
      onClick={seleccionarTodos}
      className="text-xs font-medium text-red-900 hover:underline"
    >
      {miembrosSeleccionados.length === miembros.length
        ? "Quitar todos"
        : "Seleccionar todos"}
    </button>
  </div>

  <div className="border border-zinc-200">
    {miembros.map((miembro) => {
      const seleccionado = miembrosSeleccionados.includes(
        Number(miembro.NUMCENS)
      );

      return (
        <label
          key={miembro.NUMCENS}
          className={`flex cursor-pointer items-center gap-3 border-b border-zinc-100 px-3 py-3 last:border-b-0 ${
            seleccionado ? "bg-red-50" : "hover:bg-zinc-50"
          }`}
        >
          <input
            type="checkbox"
            checked={seleccionado}
            onChange={() =>
              cambiarSeleccion(Number(miembro.NUMCENS))
            }
            className="h-4 w-4"
          />

          <div>
            <div className="text-sm font-medium text-zinc-900">
              {miembro.Nombre} {miembro.Apellidos}
            </div>

            <div className="text-xs text-zinc-400">
              Nº {miembro.NUMCENS}
            </div>
          </div>
        </label>
      );
    })}
  </div>
</div>

{necesitaNuevoTitular && (
  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
    <div className="text-sm font-semibold text-amber-900">
      Nuevo titular necesario
    </div>

    <p className="mt-1 text-xs text-amber-800">
      El titular actual está incluido en el traslado. Selecciona
      quién será el nuevo titular de la familia de origen.
    </p>

    <select
      value={nuevoTitular ?? ""}
      onChange={(e) =>
        setNuevoTitular(
          e.target.value ? Number(e.target.value) : null
        )
      }
      className="mt-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
    >
      <option value="">Seleccionar nuevo titular</option>

      {miembrosQueQuedan.map((miembro) => (
        <option
          key={miembro.NUMCENS}
          value={miembro.NUMCENS}
        >
          {miembro.Apellidos}, {miembro.Nombre} · Nº{" "}
          {miembro.NUMCENS}
        </option>
      ))}
    </select>
  </div>
)}
              <label className="mb-1 block text-xs font-medium uppercase text-zinc-600">
                Familia destino
              </label>
  
              <input
                autoFocus
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setFamiliaDestino(null);
                }}
                placeholder="Buscar familia..."
                className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
              />
  
              {busqueda && !familiaDestino && (
                <div className="mt-1 max-h-60 overflow-y-auto border border-zinc-200 bg-white">
                  {familiasFiltradas.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-zinc-500">
                      No hay resultados.
                    </div>
                  ) : (
                    familiasFiltradas.slice(0, 20).map((familia) => (
                      <button
                        key={familia.ID_Familia}
                        type="button"
                        onClick={() => {
                          setFamiliaDestino(familia);
                          setBusqueda(familia.Nombre_Familia || "");
                        }}
                        className="block w-full border-b border-zinc-100 px-3 py-2 text-left text-sm hover:bg-red-50"
                      >
                        <span className="font-medium text-zinc-900">
                          {familia.Nombre_Familia ||
                            `Familia ${familia.ID_Familia}`}
                        </span>
  
                        <span className="ml-2 text-xs text-zinc-400">
                          ID {familia.ID_Familia}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
  
              {familiaDestino && (
                <div className="mt-3 border border-green-200 bg-green-50 px-3 py-3">
                  <div className="text-xs font-medium uppercase text-green-700">
                    Familia seleccionada
                  </div>
  
                  <div className="mt-1 text-sm font-medium text-zinc-900">
                    {familiaDestino.Nombre_Familia ||
                      `Familia ${familiaDestino.ID_Familia}`}
                  </div>
                </div>
              )}
  
  {miembrosSeleccionados.length > 0 && (
  <div className="mt-5">
    <div className="mb-2 text-xs font-medium uppercase text-zinc-600">
      Pagador
    </div>

    <div className="border border-zinc-200">
      {miembros
        .filter((miembro) =>
          miembrosSeleccionados.includes(Number(miembro.NUMCENS))
        )
        .map((miembro) => {
          const numcens = Number(miembro.NUMCENS);
          const estaCambiando = cambiarPagador[numcens] === true;

          return (
            <div
              key={miembro.NUMCENS}
              className="border-b border-zinc-100 px-3 py-3 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-zinc-900">
                    {miembro.Nombre} {miembro.Apellidos}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    Pagador actual:{" "}
                    <span className="font-medium text-zinc-700">
                      {nombrePagador(numcens)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (estaCambiando) {
                      setCambiarPagador((actual) => ({
                        ...actual,
                        [numcens]: false,
                      }));
                  
                      setPagadoresSeleccionados((actual) => ({
                        ...actual,
                        [numcens]: pagadoresOriginales[numcens] || "",
                      }));
                  
                      setBusquedaPagador((actual) => ({
                        ...actual,
                        [numcens]: "",
                      }));
                    } else {
                      setCambiarPagador((actual) => ({
                        ...actual,
                        [numcens]: true,
                      }));
                  
                      setBusquedaPagador((actual) => ({
                        ...actual,
                        [numcens]: "",
                      }));
                    }
                  }}

                  className="shrink-0 text-xs font-medium text-red-900 hover:underline"
                >
                  {estaCambiando ? "Mantener actual" : "Cambiar"}
                </button>
              </div>

              {estaCambiando && (
                <div className="mt-3">
                  <div className="relative">
  <input
    type="text"
    value={busquedaPagador[numcens] || ""}
    onChange={(e) => {
      setBusquedaPagador((actual) => ({
        ...actual,
        [numcens]: e.target.value,
      }));

      setPagadoresSeleccionados((actual) => ({
        ...actual,
        [numcens]: "",
      }));
    }}
    placeholder="Buscar socio o pagador externo..."
    className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
  />

  {busquedaPagador[numcens] &&
    !pagadoresSeleccionados[numcens] && (
      <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto border border-zinc-200 bg-white shadow-lg">

        <button
          type="button"
          onClick={() => {
            setPagadoresSeleccionados((actual) => ({
              ...actual,
              [numcens]: String(numcens),
            }));

            setBusquedaPagador((actual) => ({
              ...actual,
              [numcens]: "Él mismo",
            }));
          }}
          className="block w-full border-b border-zinc-100 px-3 py-2 text-left text-sm font-medium hover:bg-red-50"
        >
          Él mismo
        </button>

        {sociosPagadores
          .filter((socio) => {
            const texto = normalizar(
              `${socio.NUMCENS} ${socio.Apellidos || ""} ${
                socio.Nombre || ""
              }`
            );

            return texto.includes(
              normalizar(busquedaPagador[numcens] || "")
            );
          })
          .slice(0, 20)
          .map((socio) => (
            <button
              key={`socio-${socio.NUMCENS}`}
              type="button"
              onClick={() => {
                setPagadoresSeleccionados((actual) => ({
                  ...actual,
                  [numcens]: String(socio.NUMCENS),
                }));

                setBusquedaPagador((actual) => ({
                  ...actual,
                  [numcens]: `${socio.Apellidos}, ${socio.Nombre} · Nº ${socio.NUMCENS}`,
                }));
              }}
              className="block w-full border-b border-zinc-100 px-3 py-2 text-left text-sm hover:bg-red-50"
            >
              <span className="font-medium">
                {socio.Apellidos}, {socio.Nombre}
              </span>

              <span className="ml-2 text-xs text-zinc-400">
                Nº {socio.NUMCENS}
              </span>
            </button>
          ))}

        {pagadoresExternos
          .filter((externo) => {
            const texto = normalizar(
              `${externo.Apellidos || ""} ${externo.Nombre || ""} ${
                externo.NIF || ""
              }`
            );

            return texto.includes(
              normalizar(busquedaPagador[numcens] || "")
            );
          })
          .slice(0, 20)
          .map((externo) => (
            <button
              key={`externo-${externo.IDPagadorExterno}`}
              type="button"
              onClick={() => {
                setPagadoresSeleccionados((actual) => ({
                  ...actual,
                  [numcens]: `externo-${externo.IDPagadorExterno}`,
                }));

                setBusquedaPagador((actual) => ({
                  ...actual,
                  [numcens]: `${externo.Apellidos}, ${externo.Nombre} · Externo`,
                }));
              }}
              className="block w-full border-b border-zinc-100 px-3 py-2 text-left text-sm hover:bg-red-50"
            >
              <span className="font-medium">
                {externo.Apellidos}, {externo.Nombre}
              </span>

              <span className="ml-2 text-xs font-medium text-red-900">
                Externo
              </span>
            </button>
          ))}
      </div>
    )}
</div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  </div>
)}
              <div className="mt-4 border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-800">
  {miembrosSeleccionados.length === miembros.length
    ? "Se trasladarán todos los miembros. La familia de origen quedará bloqueada y dejará de aparecer en la gestión de familias."
    : miembros.length - miembrosSeleccionados.length === 1
    ? "Tras el traslado quedará un único socio. Como una familia debe tener al menos 2 miembros, ese socio quedará sin familia y la familia de origen quedará bloqueada."
    : `Se trasladarán ${miembrosSeleccionados.length} miembros.`}
</div>
            </div>
  
            <div className="flex justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-3">
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  setBusqueda("");
                  setFamiliaDestino(null);
                }}
                disabled={cargando}
                className="border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
  
              <button
                type="button"
                onClick={trasladar}
                disabled={
  cargando ||
  !familiaDestino ||
  miembrosSeleccionados.length === 0 ||
  (necesitaNuevoTitular && !nuevoTitular) ||
  miembrosSeleccionados.some(
    (numcens) =>
      cambiarPagador[numcens] === true &&
      !pagadoresSeleccionados[numcens]
  )
}
                className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
              >
                {cargando ? "Trasladando..." : "Trasladar miembros"}
              </button>
            </div>
  
          </div>
        </div>
      )}
    </>
  );
}