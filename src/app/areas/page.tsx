import type { Metadata } from "next";
import { AreasDirectoryClient } from "@/components/areas-directory-client";

export const metadata: Metadata = { title: "Áreas y subáreas" };

export default function AreasPage() {
  return <AreasDirectoryClient />;
}
