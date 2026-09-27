import { INITIAL_CLIENTS } from "@/lib/mock-data";
import ClienteDetallePage from "@/components/admin/ClienteDetalleClient";

export function generateStaticParams() {
  return INITIAL_CLIENTS.map((c) => ({ id: c.id }));
}

export default function Page() {
  return <ClienteDetallePage />;
}
