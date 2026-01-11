import type { Agent } from "shared";
import type { findAgents } from "./repository.js";

type AgentData = Awaited<ReturnType<typeof findAgents>>[number];

export function mapAgentToResponse(agent: AgentData): Agent {
  return {
    id: agent.id,
    firstName: agent.firstName,
    lastName: agent.lastName,
    email: agent.email,
    phone: agent.phone,
    licenseNumber: agent.licenseNumber,
    agencyName: agent.agencyName,
    isActive: agent.isActive,
    hasAccount: agent.userId !== null,
    clientCount: agent._count.clients,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
  };
}
