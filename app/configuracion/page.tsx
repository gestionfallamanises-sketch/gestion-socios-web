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

  useEffect(() => {
    cargarEjercicios();
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

  async function marcarActivo(ejercicio: number) {
    await supabase
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

          <section className="mb-8 border border-zinc-200 bg-white">

            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Ejercicios
                </h2>

                <p className="text-xs text-zinc-500">
                  Gestión de ejercicios activos
                </p>
              </div>
            </div>

            <div className="border-b border-zinc-200 p-4">
              <div className="flex flex-wrap gap-3">

                <input
                  type="number"
                  placeholder="Nuevo ejercicio"
                  value={nuevoEjercicio}
                  onChange={(e) =>
                    setNuevoEjercicio(e.target.value)
                  }
                  className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-900"
                />

                <button
                  onClick={crearEjercicio}
                  className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
                >
                  + Nuevo ejercicio
                </button>

              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                  <tr>
                    <th className="px-4 py-3">Ejercicio</th>
                    <th className="px-4 py-3">Inicio</th>
                    <th className="px-4 py-3">Fin</th>
                    <th className="px-4 py-3">Activo</th>
                    <th className="px-4 py-3">
                      Observaciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {ejercicios.map((ejercicio) => (
                    <tr
                      key={ejercicio.Ejercicio}
                      className="border-t border-zinc-200 hover:bg-red-50"
                    >
                      <td className="px-4 py-3 font-medium">
                        {ejercicio.Ejercicio}
                      </td>

                      <td className="px-4 py-3">
                        {ejercicio.FechaInicio}
                      </td>

                      <td className="px-4 py-3">
                        {ejercicio.FechaFin}
                      </td>

                      <td className="px-4 py-3">

                        {ejercicio.Activo ? (
                          <span className="bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Activo
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              marcarActivo(
                                ejercicio.Ejercicio
                              )
                            }
                            className="bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-300"
                          >
                            Marcar activo
                          </button>
                        )}

                      </td>

                      <td className="px-4 py-3">
                        {ejercicio.Observaciones || "-"}
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
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
        </div>
      </main>
    </div>
  );
}