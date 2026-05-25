"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import GenerarCuotasButton from "@/app/components/GenerarCuotasButton";

export default function CuotasPage() {
  const [cuotas, setCuotas] = useState<any[]>([]);
  const [ejercicios, setEjercicios] = useState<any[]>([]);
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState(2027);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  useEffect(() => {
    cargarEjercicios();
  }, []);

  useEffect(() => {
    cargarCuotas();
  }, [ejercicioSeleccionado]);

  async function cargarEjercicios() {
    const { data } = await supabase
      .from("EJERCICIOS")
      .select("*")
      .order("Ejercicio", { ascending: false });

    if (data) {
      setEjercicios(data);

      if (data.length > 0) {
        setEjercicioSeleccionado(data[0].Ejercicio);
      }
    }
  }

  async function cargarCuotas() {
    const { data } = await supabase
      .from("vista_cuotas_socios")
      .select("*")
      .eq("Ejercicio", ejercicioSeleccionado)
      .order("Apellidos", { ascending: true });

    if (data) {
      setCuotas(data);
    }
  }

  const cuotasFiltradas = cuotas.filter((cuota) => {
    const texto = `${cuota.Nombre || ""} ${cuota.Apellidos || ""} ${
      cuota.NUMCENS || ""
    }`.toLowerCase();

    const coincideBusqueda = texto.includes(busqueda.toLowerCase());

    const coincideEstado =
      filtroEstado === "Todos" || cuota.EstadoPago === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

  const totalCuotas = cuotas.length;

  const totalImporte = cuotas.reduce(
    (acc, cuota) => acc + Number(cuota.Importe || 0),
    0
  );

  const totalPagado = cuotas.reduce(
    (acc, cuota) => acc + Number(cuota.TotalPagado || 0),
    0
  );

  const totalPendiente = cuotas.reduce(
    (acc, cuota) => acc + Number(cuota.Pendiente || 0),
    0
  );

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900">
                    Cuotas
                  </h1>

                  <p className="mt-2 text-sm text-zinc-600">
                    Gestión de cuotas y pagos · Ejercicio {ejercicioSeleccionado}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    value={ejercicioSeleccionado}
                    onChange={(e) =>
                      setEjercicioSeleccionado(Number(e.target.value))
                    }
                    className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-900"
                  >
                    {ejercicios.length === 0 ? (
                      <option value={ejercicioSeleccionado}>
                        Ejercicio {ejercicioSeleccionado}
                      </option>
                    ) : (
                      ejercicios.map((ejercicio) => (
                        <option
                          key={ejercicio.Ejercicio}
                          value={ejercicio.Ejercicio}
                        >
                          Ejercicio {ejercicio.Ejercicio}
                        </option>
                      ))
                    )}
                  </select>

                  <GenerarCuotasButton ejercicio={ejercicioSeleccionado} />
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8 border border-zinc-200 bg-white">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              <Resumen label="Total cuotas" value={totalCuotas} />
              <Resumen label="Total a cobrar" value={`${totalImporte.toFixed(2)} €`} />
              <Resumen
                label="Total cobrado"
                value={`${totalPagado.toFixed(2)} €`}
                color="green"
              />
              <Resumen
                label="Pendiente"
                value={`${totalPendiente.toFixed(2)} €`}
                color="red"
              />
            </div>
          </section>

          <section className="mb-8 border border-zinc-200 bg-white">
            <div className="flex flex-col gap-4 bg-zinc-100 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Filtros
                </h2>

                <p className="text-xs text-zinc-500">
                  Busca socios y filtra por estado de pago
                </p>
              </div>

              <input
                type="text"
                placeholder="Buscar socio o NUMCENS..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-900 lg:w-96"
              />
            </div>

            <div className="flex flex-wrap gap-2 p-4">
              {["Todos", "Pendiente", "Parcial", "Pagada"].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  className={
                    filtroEstado === estado
                      ? "bg-red-900 px-4 py-2 text-sm font-medium text-white"
                      : "bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
                  }
                >
                  {estado}
                </button>
              ))}
            </div>
          </section>

          <section className="border border-zinc-200 bg-white">
            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Listado de cuotas
                </h2>

                <p className="text-xs text-zinc-500">
                  Mostrando {cuotasFiltradas.length} de {cuotas.length} cuotas
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                  <tr>
                    <th className="px-4 py-3">Socio</th>
                    <th className="px-4 py-3">NUMCENS</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3 text-right">Importe</th>
                    <th className="px-4 py-3 text-right">Pagado</th>
                    <th className="px-4 py-3 text-right">Pendiente</th>
                    <th className="px-4 py-3">Forma pago</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {cuotasFiltradas.map((cuota) => {
                    const estado = cuota.EstadoPago;

                    return (
                      <tr
                        key={cuota.IDCuotaSocio}
                        className="border-t border-zinc-200 hover:bg-red-50"
                      >
                        <td className="px-4 py-3 font-medium text-zinc-900">
                          {cuota.Apellidos}, {cuota.Nombre}
                        </td>

                        <td className="px-4 py-3 text-zinc-600">
                          {cuota.NUMCENS}
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

                        <td className="px-4 py-3">
                          {cuota.Metodo ? (
                            <div>
                              <p className="font-medium text-zinc-800">
                                {cuota.Metodo}
                              </p>

                              {cuota.Fraccionado && (
                                <p className="text-xs text-zinc-500">
                                  {cuota.NumeroPlazos} plazos
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-400">Sin configurar</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span
                              className={
                                estado === "Pagada"
                                  ? "bg-green-100 px-3 py-1 text-center text-xs font-semibold text-green-700"
                                  : estado === "Parcial"
                                  ? "bg-yellow-100 px-3 py-1 text-center text-xs font-semibold text-yellow-700"
                                  : "bg-red-100 px-3 py-1 text-center text-xs font-semibold text-red-700"
                              }
                            >
                              {estado}
                            </span>

                            {cuota.RevisarCuota && (
                              <span className="bg-orange-100 px-3 py-1 text-center text-xs font-semibold text-orange-700">
                                Revisar
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <a
                            href={`/cuotas/${cuota.IDCuotaSocio}/pago`}
                            className="bg-red-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-950"
                          >
                            Registrar pago
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Resumen({
  label,
  value,
  color,
}: {
  label: string;
  value: any;
  color?: "green" | "red";
}) {
  return (
    <div className="border-r border-b border-zinc-200">
      <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
        {label}
      </div>

      <div
        className={
          "bg-white px-4 py-3 text-sm font-medium " +
          (color === "green"
            ? "text-green-700"
            : color === "red"
            ? "text-red-700"
            : "text-zinc-900")
        }
      >
        {value}
      </div>
    </div>
  );
}