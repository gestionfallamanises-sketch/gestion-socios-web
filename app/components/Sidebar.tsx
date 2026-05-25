"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="sticky top-0 h-screen w-56 overflow-y-auto bg-zinc-500 p-6 text-white">
      <h2 className="mb-8 text-2xl font-bold">
        Gestión Socios
      </h2>

      <nav className="space-y-2">
        <Link
          href="/"
          className="block rounded-lg px-4 py-2 hover:bg-zinc-600"
        >
          Socios
        </Link>

        <Link
          href="/familias"
          className="block rounded-lg px-4 py-2 hover:bg-zinc-600"
        >
          Familias
        </Link>

        <Link
          href="/antiguedad"
          className="block rounded-lg px-4 py-2 hover:bg-zinc-600"
        >
          Listados
        </Link>

        <Link
          href="/cuotas"
          className="block rounded-lg px-4 py-2 hover:bg-zinc-600"
        >
          Cuotas
        </Link>

        <Link
  href="/remesas"
  className="block rounded-lg px-4 py-2 hover:bg-zinc-600"
>
  Remesas
</Link>

        <Link
          href="/configuracion"
          className="block rounded-lg px-4 py-2 hover:bg-zinc-600"
        >
          Configuración
        </Link>
      </nav>
    </aside>
  );
}