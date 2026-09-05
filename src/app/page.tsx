import { Suspense } from "react";
import { PlayScreen } from "@/components/play/PlayScreen";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <Suspense>
      <PlayScreen />
    </Suspense>
  );
}
