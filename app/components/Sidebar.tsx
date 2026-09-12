"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {

  const router = useRouter();

async function cerrarSesion() {
  await supabase.auth.signOut();
  router.push("/login");
}

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
  href="/listados"
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
  href="/loterias"
  className="block rounded-lg px-4 py-2 hover:bg-zinc-600"
>
  Loterías
</Link>

        <Link
          href="/configuracion"
          className="block rounded-lg px-4 py-2 hover:bg-zinc-600"
        >
          Configuración
        </Link>
      </nav>

      <button
  type="button"
  onClick={cerrarSesion}
  className="mt-8 w-full rounded-lg bg-zinc-600 px-4 py-2 text-left hover:bg-zinc-700"
>
  Cerrar sesión
</button>
    </aside>
  );
}