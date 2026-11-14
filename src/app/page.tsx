import { redirect } from "next/navigation";

// Até o dashboard existir (Fase 8), a raiz leva à primeira tela do projeto.
export default function Home() {
  redirect("/design-system/colors");
}
