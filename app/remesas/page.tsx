"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";

export default function RemesasPage() {
  const [remesas, setRemesas] = useState<any[]>([]);
  const [ejercicios, setEjercicios] = useState<any[]>([]);
  const [ejercicio, setEjercicio] = useState(2027);
  const [numeroPlazo, setNumeroPlazo] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarEjercicios();
    cargarRemesas();
  }, []);

  useEffect(() => {
    cargarRemesas();
  }, [ejercicio]);

  async function cargarEjercicios() {
    const { data } = await supabase
      .from("EJERCICIOS")
      .select("*")
      .order("Ejercicio", { ascending: false });

    setEjercicios(data || []);

    if (data && data.length > 0) {
      const activo = data.find((e) => e.Activo);
      setEjercicio(activo?.Ejercicio || data[0].Ejercicio);
    }
  }

  async function cargarRemesas() {
    const { data, error } = await supabase
      .from("REMESAS")
      .select("*")
      .order("IDRemesa", { ascending: false });
  
    if (error) {
      alert(error.message);
      return;
    }
  
    setRemesas(data || []);
  }

  async function generarRemesa() {
    setLoading(true);
  
    const { data, error } = await supabase.rpc(
      "generar_remesa_banco",
      {
        p_ejercicio: ejercicio,
        p_numero_plazo: numeroPlazo,
      }
    );
  
    setLoading(false);
  
    if (error) {
      alert(error.message);
      return;
    }
  
    alert("Remesa creada ID: " + data);
  
    await cargarRemesas();
    window.location.reload();
  }

  async function borrarRemesa(remesa: any) {
    if (remesa.Estado === "Cobrada") {
      alert(
        "No se puede borrar una remesa ya cobrada."
      );
      return;
    }
  
    if (!confirm("¿Borrar remesa?")) return;
  
    setLoading(true);
  
    await supabase
      .from("CUOTAS_PLAZOS")
      .update({
        IDRemesa: null,
        Estado: "Pendiente",
      })
      .eq("IDRemesa", remesa.IDRemesa);
  
    await supabase
      .from("REMESAS_DETALLE")
      .delete()
      .eq("IDRemesa", remesa.IDRemesa);
  
    await supabase
      .from("REMESAS")
      .delete()
      .eq("IDRemesa", remesa.IDRemesa);
  
    setLoading(false);
  
    await cargarRemesas();
  }

  async function confirmarCobrada(idRemesa: number) {
    const confirmar = confirm(
      "¿Seguro que quieres marcar esta remesa como cobrada?"
    );

    if (!confirmar) return;

    const { error } = await supabase.rpc(
      "confirmar_remesa_cobrada_real",
      {
        p_id_remesa: idRemesa,
      }
    );

    if (error) {
      alert(error.message);
      return;
    }

    cargarRemesas();
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <h1 className="text-2xl font-bold text-zinc-900">
                Remesas
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                Generación y control de remesas bancarias
              </p>
            </div>
          </section>

          <section className="mb-8 border border-zinc-200 bg-white">
            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Generar remesa
                </h2>

                <p className="text-xs text-zinc-500">
                  Selecciona ejercicio y número de plazo
                </p>
              </div>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
                  Ejercicio
                </label>

                <select
                  value={ejercicio}
                  onChange={(e) => setEjercicio(Number(e.target.value))}
                  className="w-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-900"
                >
                  {ejercicios.map((e) => (
                    <option key={e.Ejercicio} value={e.Ejercicio}>
                      Ejercicio {e.Ejercicio}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
                  Nº plazo
                </label>

                <select
                  value={numeroPlazo}
                  onChange={(e) => setNumeroPlazo(Number(e.target.value))}
                  className="w-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-red-900"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      Plazo {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={generarRemesa}
                  disabled={loading}
                  className="w-full bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
                >
                  {loading ? "Generando..." : "Generar remesa"}
                </button>
              </div>
            </div>
          </section>

          <section className="border border-zinc-200 bg-white">
            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Remesas generadas
                </h2>

                <p className="text-xs text-zinc-500">
                  Listado de remesas del ejercicio seleccionado
                </p>
              </div>
            </div>

            {remesas.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500">
                No hay remesas generadas para este ejercicio.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Ejercicio</th>
                      <th className="px-4 py-3">Plazo</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3">Estado</th>
<th className="px-4 py-3 text-right">Borrar</th>
<th className="px-4 py-3 text-right">Detalle</th>
<th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>

                  <tbody>
  {remesas.map((remesa) => (
    <tr
      key={remesa.IDRemesa}
      className="border-t border-zinc-200 hover:bg-red-50"
    >
      <td className="px-4 py-3 font-medium">
        {remesa.IDRemesa}
      </td>

      <td className="px-4 py-3">
        {remesa.Ejercicio}
      </td>

      <td className="px-4 py-3">
        {remesa.NumeroPlazo || "-"}
      </td>

      <td className="px-4 py-3">
        {remesa.FechaRemesa || "-"}
      </td>

      <td className="px-4 py-3 text-right">
        {Number(remesa.TotalRemesa || 0).toFixed(2)} €
      </td>

      <td className="px-4 py-3">
        <EstadoBadge estado={remesa.Estado} />
      </td>

      <td className="px-4 py-3 text-right">
  <button
    onClick={() => borrarRemesa(remesa)}
    className="bg-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-300"
  >
    Borrar
  </button>
</td>

      <td className="px-4 py-3 text-right">
        <a
          href={`/remesas/${remesa.IDRemesa}`}
          className="bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-900"
        >
          Ver detalle
        </a>
      </td>

      <td className="px-4 py-3 text-right">
        {remesa.Estado === "Cobrada" ? (
          <span className="text-xs text-zinc-400">
            Cobrada
          </span>
        ) : (
          <button
            onClick={() =>
              confirmarCobrada(remesa.IDRemesa)
            }
            className="bg-red-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-950"
          >
            Confirmar cobrada
          </button>
        )}
      </td>
    </tr>
  ))}
</tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={
        estado === "Cobrada"
          ? "bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
          : estado === "Generada" || estado === "Enviada"
          ? "bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700"
          : "bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
      }
    >
      {estado || "-"}
    </span>
  );
}