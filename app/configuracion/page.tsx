"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";

export default function ConfiguracionPage() {
  const [ejercicios, setEjercicios] = useState<any[]>([]);
  const [tarifas, setTarifas] = useState<any[]>([]);
  const [nuevoEjercicio, setNuevoEjercicio] = useState("");
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState(2027);
  const [editandoTarifas, setEditandoTarifas] = useState(false);
  const [numcensEspecial, setNumcensEspecial] = useState("");
  const [socios, setSocios] = useState<any[]>([]);
const [busquedaSocio, setBusquedaSocio] = useState("");
const [numcensCargo, setNumcensCargo] = useState("");
const [busquedaSocioCargo, setBusquedaSocioCargo] = useState("");

  useEffect(() => {
    cargarEjercicios();
    cargarSocios();
  }, []);

  useEffect(() => {
    cargarTarifas();
  }, [ejercicioSeleccionado]);

  async function cargarEjercicios() {
    const { data } = await (supabase as any)
      .from("EJERCICIOS")
      .select("*")
      .order("Ejercicio", { ascending: false });
  
    setEjercicios(data || []);
  
    if (data && data.length > 0) {
      const activo = (data as any[]).find((e) => e.Activo);
  
      setEjercicioSeleccionado(
        activo?.Ejercicio || (data as any[])[0].Ejercicio
      );
    }
  }

  async function cargarTarifas() {
    const { data } = await supabase
      .from("TIPOS_CUOTA")
      .select("*")
      .eq("Ejercicio", ejercicioSeleccionado)
      .order("CodigoCuota", { ascending: true });

    setTarifas(data || []);
  }

  async function actualizarImporte(
    idCuota: string,
    importe: number
  ) {
    const { error } = await (supabase as any)
      .from("TIPOS_CUOTA")
      .update({
        Importe: importe,
      })
      .eq("IDCuota", idCuota);

    if (error) {
      alert(error.message);
      return;
    }

    cargarTarifas();
  }

  async function recalcularCuotasEjercicio() {
    const confirmar = confirm(
      `¿Recalcular todas las cuotas del ejercicio ${ejercicioSeleccionado}?`
    );
  
    if (!confirmar) return;
  
    const { error } = await (supabase as any).rpc(
      "generar_actualizar_cuotas_completo",
      {
        p_ejercicio: ejercicioSeleccionado,
      }
    );
  
    if (error) {
      alert(error.message);
      return;
    }
  
    alert("Cuotas recalculadas correctamente");
  }
  
  async function marcarActivo(ejercicio: number) {
    await (supabase as any)
  .from("EJERCICIOS")
  .update({ Activo: false })
  .neq("Ejercicio", ejercicio);

      const { error } = await (supabase as any)
      .from("EJERCICIOS")
      .update({ Activo: true })
      .eq("Ejercicio", ejercicio);

    if (error) {
      alert(error.message);
      return;
    }

    setEjercicioSeleccionado(ejercicio);

    cargarEjercicios();
  }

  async function cargarSocios() {
    const { data } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS, Nombre, Apellidos")
      .order("Apellidos", { ascending: true });
  
    setSocios((data as any[]) || []);
  }

  async function aplicarTarifaEspecial() {
    if (!numcensEspecial) {
      alert("Selecciona un socio");
      return;
    }
  
    const idCuotaEspecial = `${ejercicioSeleccionado}_ESPECIAL`;

const { error } = await (supabase as any)
  .from("SOCIOS")
  .update({
    IDCuotaManual: idCuotaEspecial,
  })
  .eq("NUMCENS", Number(numcensEspecial));

if (error) {
  alert(error.message);
  return;
}
  
    await (supabase as any).rpc("generar_actualizar_cuotas_completo", {
      p_ejercicio: ejercicioSeleccionado,
    });
  
    alert("Tarifa especial aplicada y cuotas actualizadas");
    setNumcensEspecial("");
    setBusquedaSocio("");
  }

  async function quitarTarifaManual(numcens: string) {
    if (!numcens) {
      alert("Selecciona un socio");
      return;
    }
  
    const { error } = await (supabase as any)
      .from("SOCIOS")
      .update({
        IDCuotaManual: null,
      })
      .eq("NUMCENS", Number(numcens));
  
    if (error) {
      alert(error.message);
      return;
    }
  
    await (supabase as any).rpc("generar_actualizar_cuotas_completo", {
      p_ejercicio: ejercicioSeleccionado,
    });
  
    alert("Tarifa manual quitada y cuotas actualizadas");
  
    setNumcensEspecial("");
    setBusquedaSocio("");
    setNumcensCargo("");
    setBusquedaSocioCargo("");
  }
  
  async function aplicarTarifaCargo() {
    if (!numcensCargo) {
      alert("Selecciona un socio");
      return;
    }
  
    const idCuotaCargo = `${ejercicioSeleccionado}_CARGO`;
  
    const { error } = await (supabase as any)
      .from("SOCIOS")
      .update({
        IDCuotaManual: idCuotaCargo,
      })
      .eq("NUMCENS", Number(numcensCargo));
  
    if (error) {
      alert(error.message);
      return;
    }
  
    await (supabase as any).rpc("generar_actualizar_cuotas_completo", {
      p_ejercicio: ejercicioSeleccionado,
    });
  
    alert("Tarifa por cargo aplicada y cuotas actualizadas");
  
    setNumcensCargo("");
    setBusquedaSocioCargo("");
  }
  
  async function quitarTarifaCargo() {
    await quitarTarifaManual(numcensCargo);
  }

  async function crearEjercicio() {
    const ejercicio = Number(nuevoEjercicio);

    if (!ejercicio) {
      alert("Introduce un ejercicio válido");
      return;
    }

    const ejercicioAnterior = ejercicio - 1;

    await (supabase as any)
  .from("EJERCICIOS")
  .update({ Activo: false })
  .neq("Ejercicio", ejercicio);

const { error } = await (supabase as any)
  .from("EJERCICIOS")
  .insert({
    Ejercicio: ejercicio,
    FechaInicio: `${ejercicio - 1}-04-01`,
    FechaFin: `${ejercicio}-03-31`,
    Activo: true,
        Observaciones:
          "Ejercicio creado desde configuración",
      });

    if (error) {
      alert(error.message);
      return;
    }

    await (supabase as any).rpc(
      "copiar_tarifas_ejercicio",
      {
        p_origen: ejercicioAnterior,
        p_destino: ejercicio,
      }
    );

    setNuevoEjercicio("");
    setEjercicioSeleccionado(ejercicio);

    cargarEjercicios();
    cargarTarifas();
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">

          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <h1 className="text-2xl font-bold text-zinc-900">
                Configuración
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                Gestión de ejercicios,
                tarifas y parámetros generales
              </p>
            </div>
          </section>

          <section className="border border-zinc-200 bg-white">

            <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-100 px-4 py-3">

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Tarifas
                </h2>

                <p className="text-xs text-zinc-500">
                  Tarifas configuradas por ejercicio
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">

  <select
    value={ejercicioSeleccionado}
    onChange={(e) =>
      setEjercicioSeleccionado(
        Number(e.target.value)
      )
    }
    className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-900"
  >
    {ejercicios.map((ejercicio) => (
      <option
        key={ejercicio.Ejercicio}
        value={ejercicio.Ejercicio}
      >
        Ejercicio {ejercicio.Ejercicio}
      </option>
    ))}
  </select>

  <button
    onClick={recalcularCuotasEjercicio}
    title="Recalcular tarifas socios"
    className="flex h-10 w-10 items-center justify-center border border-zinc-300 bg-white text-zinc-600 hover:border-red-900 hover:text-red-900"
  >
    ↻
  </button>

                <button
                  onClick={() =>
                    setEditandoTarifas(
                      !editandoTarifas
                    )
                  }
                  className={
                    editandoTarifas
                      ? "bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-400"
                      : "bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
                  }
                >
                  {editandoTarifas
                    ? "Bloquear edición"
                    : "Editar tarifas"}
                </button>

              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Comisión</th>
                    <th className="px-4 py-3">Lotería</th>
                    <th className="px-4 py-3">Banda</th>
                    <th className="px-4 py-3">+70</th>
                    <th className="px-4 py-3">Edad</th>
                    <th className="px-4 py-3">Miembros</th>
                    <th className="px-4 py-3 text-right">
                      Importe
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tarifas.map((tarifa) => (
                    <tr
                      key={tarifa.IDCuota}
                      className="border-t border-zinc-200 hover:bg-red-50"
                    >

                      <td className="px-4 py-3 font-medium">
                        {tarifa.CodigoCuota ||
                          tarifa.IDCuota}
                      </td>

                      <td className="px-4 py-3">
                        {tarifa.Comision}
                      </td>

                      <td className="px-4 py-3">
                        {tarifa.ConLoteria
                          ? "Sí"
                          : "No"}
                      </td>

                      <td className="px-4 py-3">
                        {tarifa.EsBanda
                          ? "Sí"
                          : "No"}
                      </td>

                      <td className="px-4 py-3">
                        {tarifa.EsMayor70
                          ? "Sí"
                          : "No"}
                      </td>

                      <td className="px-4 py-3">
                        {tarifa.EdadMin} -{" "}
                        {tarifa.EdadMax}
                      </td>

                      <td className="px-4 py-3">
                        {tarifa.NumMiembrosMin} -{" "}
                        {tarifa.NumMiembrosMax}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">

                          <input
                            type="number"
                            step="0.01"
                            disabled={
                              !editandoTarifas
                            }
                            defaultValue={Number(
                              tarifa.Importe || 0
                            ).toFixed(2)}
                            onBlur={(e) =>
                              actualizarImporte(
                                tarifa.IDCuota,
                                Number(
                                  e.target.value
                                )
                              )
                            }
                            className={
                              editandoTarifas
                                ? "w-24 border border-zinc-300 bg-white px-2 py-1 text-right outline-none focus:border-red-900"
                                : "w-24 border border-transparent bg-zinc-100 px-2 py-1 text-right text-zinc-600"
                            }
                          />

                          <span className="text-sm text-zinc-500">
                            €
                          </span>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

          </section>

          <section className="mt-8 border border-zinc-200 bg-white">

  <div className="bg-zinc-100 px-4 py-3">
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
      Tarifas especiales
    </h2>

    <p className="text-xs text-zinc-500">
      Solo para casos excepcionales
    </p>
  </div>

  <div className="grid gap-6 p-4 md:grid-cols-2">

    {/* ESPECIAL */}

    <div className="border border-zinc-200 p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-700">
        Tarifa especial
      </h3>

      <input
        value={busquedaSocio}
        onChange={(e) => setBusquedaSocio(e.target.value)}
        placeholder="Nombre, apellidos o NUMCENS"
        className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
      />

      {busquedaSocio && (
        <div className="mt-2 max-h-48 overflow-y-auto border border-zinc-200 bg-white">
          {socios
            .filter((socio) =>
              `${socio.NUMCENS} ${socio.Nombre || ""} ${socio.Apellidos || ""}`
                .toLowerCase()
                .includes(busquedaSocio.toLowerCase())
            )
            .slice(0, 10)
            .map((socio) => (
              <button
                key={socio.NUMCENS}
                type="button"
                onClick={() => {
                  setNumcensEspecial(String(socio.NUMCENS));
                  setBusquedaSocio(
                    `${socio.Apellidos}, ${socio.Nombre} · ${socio.NUMCENS}`
                  );
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50"
              >
                {socio.Apellidos}, {socio.Nombre} · NUMCENS {socio.NUMCENS}
              </button>
            ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={aplicarTarifaEspecial}
          className="bg-red-900 px-3 py-2 text-xs font-medium text-white hover:bg-red-950"
        >
          Aplicar especial
        </button>

        <button
          onClick={() => quitarTarifaManual(numcensEspecial)}
          className="bg-zinc-300 px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-400"
        >
          Quitar especial
        </button>
      </div>
    </div>

    {/* CARGO */}

    <div className="border border-zinc-200 p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-700">
        Tarifa cargo (0 €)
      </h3>

      <input
        value={busquedaSocioCargo}
        onChange={(e) => setBusquedaSocioCargo(e.target.value)}
        placeholder="Nombre, apellidos o NUMCENS"
        className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
      />

      {busquedaSocioCargo && (
        <div className="mt-2 max-h-48 overflow-y-auto border border-zinc-200 bg-white">
          {socios
            .filter((socio) =>
              `${socio.NUMCENS} ${socio.Nombre || ""} ${socio.Apellidos || ""}`
                .toLowerCase()
                .includes(busquedaSocioCargo.toLowerCase())
            )
            .slice(0, 10)
            .map((socio) => (
              <button
                key={socio.NUMCENS}
                type="button"
                onClick={() => {
                  setNumcensCargo(String(socio.NUMCENS));
                  setBusquedaSocioCargo(
                    `${socio.Apellidos}, ${socio.Nombre} · ${socio.NUMCENS}`
                  );
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50"
              >
                {socio.Apellidos}, {socio.Nombre} · NUMCENS {socio.NUMCENS}
              </button>
            ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={aplicarTarifaCargo}
          className="bg-red-900 px-3 py-2 text-xs font-medium text-white hover:bg-red-950"
        >
          Aplicar cargo
        </button>

        <button
          onClick={quitarTarifaCargo}
          className="bg-zinc-300 px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-400"
        >
          Quitar cargo
        </button>
      </div>
    </div>

  </div>
</section>

        </div>
      </main>
    </div>
  );
}