import { HostScreen } from "@/components/host/HostScreen";

export const dynamic = "force-dynamic";

export default async function HostRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <HostScreen code={code} />;
}
