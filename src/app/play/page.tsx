import { Suspense } from "react";
import { PlayScreen } from "@/components/play/PlayScreen";

export const dynamic = "force-dynamic";

export default function PlayPage() {
  return (
    <Suspense>
      <PlayScreen />
    </Suspense>
  );
}
