import type { Metadata } from "next";
import { IllustrationsReference } from "@/features/design-system/IllustrationsReference";

export const metadata: Metadata = { title: "Ilustrações · Atrium" };

export default function IllustrationsPage() {
  return <IllustrationsReference />;
}
