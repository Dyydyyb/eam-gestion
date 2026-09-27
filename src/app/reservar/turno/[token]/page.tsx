import { INITIAL_LESSONS } from "@/lib/mock-data";
import TurnoAutogestionPage from "@/components/turnos/TurnoAutogestionClient";

export function generateStaticParams() {
  return INITIAL_LESSONS.map((l) => ({ token: l.public_token }));
}

export default function Page() {
  return <TurnoAutogestionPage />;
}
