import type { Metadata } from "next";
import { ColorsReference } from "@/features/design-system/ColorsReference";

export const metadata: Metadata = { title: "Cores · Design system" };

export default function ColorsPage() {
  return <ColorsReference />;
}
