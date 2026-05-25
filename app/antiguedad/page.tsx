"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { supabase } from "../../lib/supabase";

export default function ListadosPage() {
  const [socios, setSocios] = useState<any[]>([]);
  const [estado, setEstado] = useState<"Activo" | "Baja">("Activo");
  const [comision, setComision] = useState<string[]>([]);
  const [sexe, setSexe] = useState<string[]>([]);
  const [loteria, setLoteria] = useState<string[]>([]);
  const [banda, setBanda] = useState<string[]>([]);
  const [orden, setOrden] = useState("ANTIGUEDAD_DESC");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSocios() {
      const { data, error } = await supabase
        .from("SOCIOS")
        .select(
          "NUMCENS, Nombre, Apellidos, Estado, Comision, SEXE, Antiguedad, Antiguedad_Dias, ConLoteria, NumPapeletas, EsBanda"
        );

      if (error) {
        setError(error.message);
      } else {
        setSocios(data || []);
      }
    }

    fetchSocios();
  }, []);

  function toggle(lista: string[], valor: string, setter: (v: string[]) => void) {
    if (lista.includes(valor)) {
      setter(lista.filter((item) => item !== valor));
    } else {
      setter([...lista, valor]);
    }
  }

  function abreviarAntiguedad(texto: string | null) {
    if (!texto) return "-";

    return texto
      .replace(" años", " A")
      .replace(" año", " A")
      .replace(" meses", " M")
      .replace(" mes", " M")
      .replace(" días", " D")
      .replace(" día", " D");
  }

  const sociosFiltrados = socios
    .filter((socio) => {
      const coincideEstado = socio.Estado === estado;

      const coincideComision =
        comision.length === 0 || comision.includes(socio.Comision);

      const coincideSexe =
        sexe.length === 0 || sexe.includes(socio.SEXE);

      const coincideLoteria =
        loteria.length === 0 ||
        (loteria.includes("CON") && socio.ConLoteria === true) ||
        (loteria.includes("SIN") && socio.ConLoteria !== true);

      const coincideBanda =
        banda.length === 0 ||
        (banda.includes("SI") && socio.EsBanda === true) ||
        (banda.includes("NO") && socio.EsBanda !== true);

      return (
        coincideEstado &&
        coincideComision &&
        coincideSexe &&
        coincideLoteria &&
        coincideBanda
      );
    })
    .sort((a, b) => {
      if (orden === "ANTIGUEDAD_DESC") {
        return Number(b.Antiguedad_Dias || 0) - Number(a.Antiguedad_Dias || 0);
      }

      if (orden === "ANTIGUEDAD_ASC") {
        return Number(a.Antiguedad_Dias || 0) - Number(b.Antiguedad_Dias || 0);
      }

      return 0;
    });

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <div className="no-print">
        <Sidebar />
      </div>

      <main className="min-w-0 flex-1 p-8 print:p-0">
        <div className="mx-auto max-w-7xl print:max-w-none">
          <style jsx global>{`
            @media print {
              .no-print {
                display: none !important;
              }

              body {
                background: white !important;
              }

              a {
                color: black !important;
                text-decoration: none !important;
              }

              @page {
                margin: 1.2cm;
              }
            }
          `}</style>

          <section className="mb-8 border border-zinc-200 bg-white shadow-sm print:mb-4 print:border-0 print:shadow-none">
            <div className="border-l-4 border-red-900 px-6 py-5 print:border-l-0 print:px-0 print:py-2">
              <h1 className="text-2xl font-bold text-zinc-900 print:text-xl">
                Listados
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                Estado: {estado} · Comisión:{" "}
                {comision.length ? comision.join(", ") : "Todas"} · Sexo:{" "}
                {sexe.length ? sexe.join(", ") : "Todos"} · Lotería:{" "}
                {loteria.length ? loteria.join(", ") : "Todas"} · Banda:{" "}
                {banda.length ? banda.join(", ") : "Todas"} · Orden: {orden}
              </p>
            </div>
          </section>

          <section className="no-print mb-8 border border-zinc-200 bg-white">
            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Filtros
                </h2>

                <p className="text-xs text-zinc-500">
                  Estado obligatorio. El resto de filtros son opcionales.
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
              >
                Imprimir listado
              </button>
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-6">
              <GrupoFiltro titulo="Estado">
                <FiltroButton
                  active={estado === "Activo"}
                  onClick={() => setEstado("Activo")}
                >
                  Activo
                </FiltroButton>

                <FiltroButton
                  active={estado === "Baja"}
                  onClick={() => setEstado("Baja")}
                >
                  Baja
                </FiltroButton>
              </GrupoFiltro>

              <GrupoFiltro titulo="Comisión">
                <FiltroButton
                  active={comision.includes("MAY")}
                  onClick={() => toggle(comision, "MAY", setComision)}
                >
                  MAY
                </FiltroButton>

                <FiltroButton
                  active={comision.includes("INF")}
                  onClick={() => toggle(comision, "INF", setComision)}
                >
                  INF
                </FiltroButton>
              </GrupoFiltro>

              <GrupoFiltro titulo="Sexo">
                <FiltroButton
                  active={sexe.includes("H")}
                  onClick={() => toggle(sexe, "H", setSexe)}
                >
                  H
                </FiltroButton>

                <FiltroButton
                  active={sexe.includes("M")}
                  onClick={() => toggle(sexe, "M", setSexe)}
                >
                  M
                </FiltroButton>
              </GrupoFiltro>

              <GrupoFiltro titulo="Lotería">
                <FiltroButton
                  active={loteria.includes("CON")}
                  onClick={() => toggle(loteria, "CON", setLoteria)}
                >
                  Con
                </FiltroButton>

                <FiltroButton
                  active={loteria.includes("SIN")}
                  onClick={() => toggle(loteria, "SIN", setLoteria)}
                >
                  Sin
                </FiltroButton>
              </GrupoFiltro>

              <GrupoFiltro titulo="Banda">
                <FiltroButton
                  active={banda.includes("SI")}
                  onClick={() => toggle(banda, "SI", setBanda)}
                >
                  Sí
                </FiltroButton>

                <FiltroButton
                  active={banda.includes("NO")}
                  onClick={() => toggle(banda, "NO", setBanda)}
                >
                  No
                </FiltroButton>
              </GrupoFiltro>

              <GrupoFiltro titulo="Antiguedad">
                <FiltroButton
                  active={orden === "ANTIGUEDAD_DESC"}
                  onClick={() =>
                    setOrden(
                      orden === "ANTIGUEDAD_DESC"
                        ? ""
                        : "ANTIGUEDAD_DESC"
                    )
                  }
                >
                  +
                </FiltroButton>

                <FiltroButton
                  active={orden === "ANTIGUEDAD_ASC"}
                  onClick={() =>
                    setOrden(
                      orden === "ANTIGUEDAD_ASC"
                        ? ""
                        : "ANTIGUEDAD_ASC"
                    )
                  }
                >
                  -
                </FiltroButton>
              </GrupoFiltro>
            </div>
          </section>

          {error && (
            <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Error: {error}
            </div>
          )}

          <section className="border border-zinc-200 bg-white print:border-0">
            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3 print:bg-white print:px-0">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Resultado del listado
                </h2>

                <p className="text-xs text-zinc-500">
                  Mostrando {sociosFiltrados.length} socios
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600 print:bg-white">
                  <tr>
                    <th className="px-4 py-3 print:px-1 print:py-1">Socio</th>
                    <th className="px-4 py-3 print:px-1 print:py-1">NUMCENS</th>
                    <th className="px-4 py-3 print:px-1 print:py-1">Com/Sx</th>
                    <th className="px-4 py-3 print:px-1 print:py-1">Estado</th>
                    <th className="px-4 py-3 print:px-1 print:py-1">Lotería</th>
                    <th className="px-4 py-3 print:px-1 print:py-1">Banda</th>
                    <th className="px-4 py-3 print:px-1 print:py-1">
                      Papeletas
                    </th>
                    <th className="px-4 py-3 text-right print:px-1 print:py-1">
                      Antigüedad
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sociosFiltrados.map((socio) => (
                    <tr
                      key={socio.NUMCENS}
                      className="border-t border-zinc-200 hover:bg-red-50 print:hover:bg-white"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 print:px-1 print:py-1">
                        <Link href={`/socios/${socio.NUMCENS}`}>
                          {socio.Apellidos}, {socio.Nombre}
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-zinc-600 print:px-1 print:py-1">
                        {socio.NUMCENS}
                      </td>

                      <td className="px-4 py-3 text-zinc-600 print:px-1 print:py-1">
                        {socio.Comision || "-"} / {socio.SEXE || "-"}
                      </td>

                      <td className="px-4 py-3 print:px-1 print:py-1">
                        <span
                          className={
                            socio.Estado === "Activo"
                              ? "bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 print:bg-white print:px-0 print:text-black"
                              : "bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 print:bg-white print:px-0 print:text-black"
                          }
                        >
                          {socio.Estado || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-zinc-600 print:px-1 print:py-1">
                        {socio.ConLoteria ? "Sí" : "No"}
                      </td>

                      <td className="px-4 py-3 text-zinc-600 print:px-1 print:py-1">
                        {socio.Banda ? "Sí" : "No"}
                      </td>

                      <td className="px-4 py-3 text-zinc-600 print:px-1 print:py-1">
                        {socio.NumPapeletas || 0}
                      </td>

                      <td className="px-4 py-3 text-right font-medium print:px-1 print:py-1">
                        {abreviarAntiguedad(socio.Antiguedad)}
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

function GrupoFiltro({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
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