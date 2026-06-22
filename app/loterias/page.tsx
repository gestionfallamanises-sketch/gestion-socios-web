"use client";

import Link from "next/link";
import Sidebar from "../components/Sidebar";

export default function LoteriasPage() {
  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">

          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <h1 className="text-2xl font-bold text-zinc-900">
                Loterías
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                Gestión de sorteos, papeletas, socios lotería,
                pagos y control semanal.
              </p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 items-stretch">

            <TarjetaModulo
              titulo="Configuración"
              descripcion="Reglas de papeletas y parámetros generales."
              href="/loterias/configuracion"
            />

            <TarjetaModulo
              titulo="Socios lotería"
              descripcion="Responsables y asignaciones de papeletas."
              href="/loterias/socios-loteria"
            />

            <TarjetaModulo
              titulo="Sorteos"
              descripcion="Falla, Virgen, Navidad y Niño."
              href="/loterias/sorteos"
            />

<TarjetaModulo
  titulo="Informes"
  descripcion="Listados, filtros, impresión y exportaciones."
  href="/loterias/informes"
/>

          </section>
        </div>
      </main>
    </div>
  );
}

function TarjetaModulo({
  titulo,
  descripcion,
  href,
}: {
  titulo: string;
  descripcion: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="h-full min-h-[140px] border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-red-900 hover:bg-red-50">
      <h2 className="mb-3 text-lg font-semibold text-zinc-900">
          {titulo}
        </h2>

        <p className="mt-2 text-sm text-zinc-600">
          {descripcion}
        </p>
      </div>
    </Link>
  );
}