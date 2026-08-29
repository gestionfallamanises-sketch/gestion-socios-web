"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabase";

export default function ConfiguracionLoteriasPage() {
  const [reglas, setReglas] = useState<any[]>([]);
  const [diagnostico, setDiagnostico] = useState<any[]>([]);
const [resumen, setResumen] = useState({
  correctos: 0,
  incidencias: 0,
  sinGrupo: 0,
  repetidos: 0,
  responsableSinLoteria: 0,
});

useEffect(() => {
    cargarReglas();
    cargarDiagnostico();
  }, []);

  async function cargarReglas() {
    const { data, error } = await (supabase as any)
      .from("LOTERIA_PAPELETAS")
      .select("*")
      .order("NumMiembrosLoteriaMin", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setReglas(data || []);
  }

  function actualizarRegla(index: number, campo: string, valor: any) {
    setReglas((prev) =>
      prev.map((regla, i) =>
        i === index ? { ...regla, [campo]: Number(valor) } : regla
      )
    );
  }

  async function guardarRegla(regla: any) {
    const { error } = await (supabase as any)
      .from("LOTERIA_PAPELETAS")
      .update({
        NumMiembrosLoteriaMin: regla.NumMiembrosLoteriaMin,
        NumMiembrosLoteriaMax: regla.NumMiembrosLoteriaMax,
        PapeletasSemanal: regla.PapeletasSemanal,
        PapeletasNavidad: regla.PapeletasNavidad,
        PapeletasNino: regla.PapeletasNino,
      })
      .eq("ID", regla.ID);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Regla guardada correctamente.");
    cargarReglas();
  }

  async function cargarDiagnostico() {
    const { data: grupos } = await (supabase as any)
      .from("SOCIOS_LOTERIA")
      .select("*")
      .eq("Activo", true);
  
    const { data: detalles } = await (supabase as any)
      .from("SOCIOS_LOTERIA_DETALLE")
      .select("IDSocioLoteria, NUMCENS");
  
    const { data: socios } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS, Nombre, Apellidos, ConLoteria");
  
    const lista = (grupos || []).map((grupo: any) => {
      const miembros = (detalles || []).filter(
        (d: any) => Number(d.IDSocioLoteria) === Number(grupo.ID)
      );
  
      const sociosGrupo = miembros
        .map((d: any) =>
          (socios || []).find((s: any) => Number(s.NUMCENS) === Number(d.NUMCENS))
        )
        .filter(Boolean);
  
      const conLoteria = sociosGrupo.filter(
        (s: any) => s.ConLoteria === true
      ).length;
  
      const regla = reglas.find(
        (r: any) =>
          conLoteria >= Number(r.NumMiembrosLoteriaMin) &&
          conLoteria <= Number(r.NumMiembrosLoteriaMax)
      );
  
      const semanal = Number(regla?.PapeletasSemanal || 0);
      const esperadoFalla = Math.ceil(semanal / 2);
      const esperadoVirgen = Math.floor(semanal / 2);
      const esperadoNavidad = Number(regla?.PapeletasNavidad || 0);
      const esperadoNino = Number(regla?.PapeletasNino || 0);
  
      const tieneFalla = Number(grupo.PapeletasFalla || 0);
      const tieneVirgen = Number(grupo.PapeletasVirgen || 0);
      const tieneNavidad = Number(grupo.PapeletasNavidad || 0);
      const tieneNino = Number(grupo.PapeletasNino || 0);
  
      const correcto =
        tieneFalla === esperadoFalla &&
        tieneVirgen === esperadoVirgen &&
        tieneNavidad === esperadoNavidad &&
        tieneNino === esperadoNino;
  
      const responsable = (socios || []).find(
        (s: any) => Number(s.NUMCENS) === Number(grupo.NUMCENS_Responsable)
      );
  
      return {
        ...grupo,
        ResponsableNombre: grupo.EsExterno
          ? grupo.NombreExterno || "Externo"
          : responsable
          ? `${responsable.Apellidos}, ${responsable.Nombre}`
          : "-",
        ResponsableExtra: grupo.EsExterno
          ? "EXT"
          : grupo.NUMCENS_Responsable || "",
        conLoteria,
        esperadoFalla,
        esperadoVirgen,
        esperadoNavidad,
        esperadoNino,
        tieneFalla,
        tieneVirgen,
        tieneNavidad,
        tieneNino,
        correcto,
        responsableSinLoteria:
          !grupo.EsExterno && responsable && responsable.ConLoteria !== true,
      };
    });
  
    const numcensEnGrupos = (detalles || []).map((d: any) => Number(d.NUMCENS));
    const repetidos = numcensEnGrupos.filter(
      (num: number, index: number) => numcensEnGrupos.indexOf(num) !== index
    );
  
    const sociosConLoteriaSinGrupo = (socios || []).filter(
      (s: any) =>
        s.ConLoteria === true &&
        !numcensEnGrupos.includes(Number(s.NUMCENS))
    );
  
    setDiagnostico(lista);
  
    setResumen({
      correctos: lista.filter((g: any) => g.correcto).length,
      incidencias: lista.filter((g: any) => !g.correcto).length,
      sinGrupo: sociosConLoteriaSinGrupo.length,
      repetidos: new Set(repetidos).size,
      responsableSinLoteria: lista.filter((g: any) => g.responsableSinLoteria)
        .length,
    });
  }
  
  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-5xl">
          <section className="mb-6 border border-zinc-200 bg-white p-6">
            <h1 className="text-2xl font-bold text-zinc-900">
              Configuración loterías
            </h1>

            <p className="mt-2 text-sm text-zinc-600">
              Reglas de papeletas según el número de miembros con cuota de lotería.
            </p>
          </section>

          <section className="border border-zinc-200 bg-white">
            <div className="bg-zinc-100 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Papeletas por socio/cuota
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                  <tr>
                    <th className="px-4 py-3 text-center">Desde</th>
                    <th className="px-4 py-3 text-center">Hasta</th>
                    <th className="px-4 py-3 text-center">Semanal</th>
                    <th className="px-4 py-3 text-center">Navidad</th>
                    <th className="px-4 py-3 text-center">Niño</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {reglas.map((regla, index) => (
                    <tr
                      key={regla.ID}
                      className="border-t border-zinc-200 hover:bg-red-50"
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={regla.NumMiembrosLoteriaMin || 0}
                          onChange={(e) =>
                            actualizarRegla(
                              index,
                              "NumMiembrosLoteriaMin",
                              e.target.value
                            )
                          }
                          className="w-20 border border-zinc-300 px-2 py-1 text-center"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={regla.NumMiembrosLoteriaMax || 0}
                          onChange={(e) =>
                            actualizarRegla(
                              index,
                              "NumMiembrosLoteriaMax",
                              e.target.value
                            )
                          }
                          className="w-20 border border-zinc-300 px-2 py-1 text-center"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={regla.PapeletasSemanal || 0}
                          onChange={(e) =>
                            actualizarRegla(index, "PapeletasSemanal", e.target.value)
                          }
                          className="w-20 border border-zinc-300 px-2 py-1 text-center"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={regla.PapeletasNavidad || 0}
                          onChange={(e) =>
                            actualizarRegla(index, "PapeletasNavidad", e.target.value)
                          }
                          className="w-20 border border-zinc-300 px-2 py-1 text-center"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={regla.PapeletasNino || 0}
                          onChange={(e) =>
                            actualizarRegla(index, "PapeletasNino", e.target.value)
                          }
                          className="w-20 border border-zinc-300 px-2 py-1 text-center"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => guardarRegla(regla)}
                          className="bg-red-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-950"
                        >
                          Guardar
                        </button>
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