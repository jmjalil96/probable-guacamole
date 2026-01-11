import { createFileRoute } from "@tanstack/react-router";
import { AgentDetailView } from "@/features/agents/detail";

export const Route = createFileRoute("/_authenticated/_app/agents/$agentId")({
  component: AgentDetailPage,
});

function AgentDetailPage() {
  const { agentId } = Route.useParams();
  return <AgentDetailView agentId={agentId} />;
}
