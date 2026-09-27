import Sidebar from "../components/Sidebar";
import Link from "next/link";

export default function MonederoPage() {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-zinc-900">
              Monedero
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Gestión de monederos, recargas, cobros y movimientos
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
  <Link
    href="/monedero/gestion"
    className="border border-zinc-200 bg-white p-5 transition hover:border-red-900 hover:shadow-sm"
  >
    <h2 className="font-semibold text-zinc-900">
      Gestión de monederos
    </h2>

    <p className="mt-1 text-sm text-zinc-500">
      Consulta, activa y gestiona los monederos de los socios.
    </p>
  </Link>

  <Link
    href="/monedero/cobrar"
    className="border border-zinc-200 bg-white p-5 transition hover:border-red-900 hover:shadow-sm"
  >
    <h2 className="font-semibold text-zinc-900">
      Cobrar con QR
    </h2>

    <p className="mt-1 text-sm text-zinc-500">
      Escanea el QR de un socio y realiza un cobro.
    </p>
  </Link>

</div>
        </div>
      </main>
    </div>
  );
}