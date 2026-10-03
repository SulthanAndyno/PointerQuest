import type { Metadata } from "next";
import { CekForm } from "@/components/CekForm";

export const metadata: Metadata = {
  title: "Cek Kode · Pointer Quest",
  robots: { index: false, follow: false, nocache: true },
};

export default function CekPage() {
  return <CekForm />;
}
