import type { Metadata } from "next";
import { FlowLibrary } from "@/components/flow-library";
import { areas, subareas } from "@/lib/data";

export const metadata: Metadata = { title: "Flujogramas por área" };

export default function FlowchartsPage() {
  return <FlowLibrary areas={areas} initialSubareas={subareas}/>;
}
