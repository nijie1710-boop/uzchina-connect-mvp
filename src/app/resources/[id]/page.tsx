import { ResourceDetailPage } from "@/components/pages/resource-detail-page";

export default async function ResourceDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResourceDetailPage id={id} />;
}
