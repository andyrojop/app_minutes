import { redirect } from "next/navigation";

/** Punto de entrada `/`; el middleware suele redirigir antes de llegar aquí. */
export default function Home() {
  redirect("/login");
}
