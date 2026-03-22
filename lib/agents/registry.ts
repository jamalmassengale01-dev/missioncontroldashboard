import { AgentConfig } from '@/lib/types';

export type { AgentConfig };

export const agentRegistry: AgentConfig[] = [
  {
    id: 'edgepilot',
    displayName: 'EdgePilot',
    role: 'Chief of Staff',
    description: 'Strategic coordinator, advisor, and execution manager for the team',
    capabilities: [
      'workflow_orchestration',
      'agent_coordination',
      'priority_management',
      'task_routing',
      'strategic_planning',
      'decision_support',
    ],
    acceptedJobTypes: [
      'orchestrate',
      'coordinate',
      'plan_workflow',
      'route_task',
      'multi_step_workflow',
    ],
    endpoint: '/api/agents/edgepilot/run',
    status: 'idle',
  },
  {
    id: 'deepforge',
    displayName: 'DeepForge',
    role: 'Research & Analysis',
    description: 'Market research, competitor analysis, and opportunity discovery',
    capabilities: [
      'market_research',
      'competitor_analysis',
      'trend_identification',
      'opportunity_scoring',
      'data_analysis',
      'validation_research',
    ],
    acceptedJobTypes: [
      'research',
      'analyze',
      'validate_idea',
      'market_study',
      'competitor_deep_dive',
    ],
    endpoint: '/api/agents/deepforge/run',
    status: 'idle',
  },
  {
    id: 'scriptforge',
    displayName: 'ScriptForge',
    role: 'Content Creation',
    description: 'Script writing, educational content, and creative production',
    capabilities: [
      'script_writing',
      'content_creation',
      'educational_materials',
      'storytelling',
      'hook_generation',
      'copywriting',
    ],
    acceptedJobTypes: [
      'create_content',
      'write_script',
      'generate_hooks',
      'draft_article',
      'create_course_outline',
    ],
    endpoint: '/api/agents/scriptforge/run',
    status: 'idle',
  },
  {
    id: 'growthforge',
    displayName: 'GrowthForge',
    role: 'Marketing Strategy',
    description: 'Funnel design, offer creation, and growth optimization',
    capabilities: [
      'funnel_design',
      'offer_creation',
      'pricing_strategy',
      'audience_targeting',
      'conversion_optimization',
      'go_to_market',
    ],
    acceptedJobTypes: [
      'create_marketing_plan',
      'design_funnel',
      'build_offer',
      'pricing_analysis',
      'go_to_market_strategy',
    ],
    endpoint: '/api/agents/growthforge/run',
    status: 'idle',
  },
  {
    id: 'buildforge',
    displayName: 'BuildForge',
    role: 'Development & Automation',
    description: 'Full-stack development, architecture, and automation',
    capabilities: [
      'full_stack_dev',
      'system_architecture',
      'api_integration',
      'automation_workflows',
      'mvp_development',
      'code_generation',
    ],
    acceptedJobTypes: [
      'build_mvp',
      'design_architecture',
      'write_code',
      'create_automation',
      'api_integration',
    ],
    endpoint: '/api/agents/buildforge/run',
    status: 'idle',
  },
  {
    id: 'signalforge',
    displayName: 'SignalForge',
    role: 'Social Media Strategy',
    description: 'Social content, viral structures, and platform optimization',
    capabilities: [
      'social_strategy',
      'content_calendar',
      'viral_hooks',
      'platform_optimization',
      'hashtag_strategy',
      'engagement_tactics',
    ],
    acceptedJobTypes: [
      'create_social_content',
      'plan_content_calendar',
      'generate_hooks',
      'optimize_for_platform',
      'engagement_strategy',
    ],
    endpoint: '/api/agents/signalforge/run',
    status: 'idle',
  },
  {
    id: 'haven',
    displayName: 'Haven',
    role: 'Personal Life Executive Assistant',
    description: 'Organizes and supports personal life, routines, family coordination, and life priorities',
    capabilities: [
      'Daily planning',
      'Weekly planning',
      'Personal organization',
      'Habit tracking',
      'Family coordination',
      'Scheduling',
      'Health routines',
      'Education progress tracking',
      'Retirement preparation',
      'Reminders and checklists',
      'Travel preparation',
      'Stress reduction through structure'
    ],
    acceptedJobTypes: ['personal', 'family', 'health', 'scheduling', 'education', 'travel', 'routines', 'life_admin'],
    endpoint: '/api/agents/haven/run',
    status: 'idle',
  },
];

// Map job types to best-fit agents
export const jobTypeToAgentMap: Record<string, string[]> = {
  'research': ['deepforge', 'edgepilot'],
  'analyze': ['deepforge', 'edgepilot'],
  'validate_idea': ['deepforge', 'growthforge'],
  'market_study': ['deepforge'],
  'competitor_deep_dive': ['deepforge'],
  'create_content': ['scriptforge', 'signalforge'],
  'write_script': ['scriptforge'],
  'generate_hooks': ['scriptforge', 'signalforge'],
  'draft_article': ['scriptforge'],
  'create_course_outline': ['scriptforge'],
  'create_marketing_plan': ['growthforge', 'edgepilot'],
  'design_funnel': ['growthforge'],
  'build_offer': ['growthforge'],
  'pricing_analysis': ['growthforge'],
  'go_to_market_strategy': ['growthforge', 'edgepilot'],
  'build_mvp': ['buildforge'],
  'design_architecture': ['buildforge', 'edgepilot'],
  'write_code': ['buildforge'],
  'create_automation': ['buildforge'],
  'api_integration': ['buildforge'],
  'create_social_content': ['signalforge'],
  'plan_content_calendar': ['signalforge'],
  'optimize_for_platform': ['signalforge'],
  'engagement_strategy': ['signalforge'],
  'orchestrate': ['edgepilot'],
  'coordinate': ['edgepilot'],
  'plan_workflow': ['edgepilot'],
  'route_task': ['edgepilot'],
  'multi_step_workflow': ['edgepilot'],
  'personal': ['haven'],
  'family': ['haven'],
  'health': ['haven'],
  'scheduling': ['haven'],
  'education': ['haven'],
  'travel': ['haven'],
  'routines': ['haven'],
  'life_admin': ['haven'],
};

// Select best agent for a job type
export function selectAgentForJob(jobType: string, preferredAgent?: string): AgentConfig | null {
  // If preferred agent specified and accepts this job type, use it
  if (preferredAgent) {
    const agent = agentRegistry.find(a => a.id === preferredAgent);
    if (agent && agent.acceptedJobTypes.includes(jobType)) {
      return agent;
    }
  }

  // Otherwise, look up best agents for this job type
  const candidates = jobTypeToAgentMap[jobType];
  if (candidates && candidates.length > 0) {
    // Find first available (idle) agent, or return first in list
    for (const agentId of candidates) {
      const agent = agentRegistry.find(a => a.id === agentId);
      if (agent && agent.status === 'idle') {
        return agent;
      }
    }
    // Return first candidate if none are idle
    return agentRegistry.find(a => a.id === candidates[0]) || null;
  }

  // Default to EdgePilot for unknown job types
  return agentRegistry.find(a => a.id === 'edgepilot') || null;
}

// Get agent by ID
export function getAgentById(agentId: string): AgentConfig | null {
  return agentRegistry.find(a => a.id === agentId) || null;
}

// Update agent status
export function updateAgentStatus(agentId: string, status: AgentConfig['status'], currentRunId?: string): void {
  const agent = agentRegistry.find(a => a.id === agentId);
  if (agent) {
    agent.status = status;
    if (currentRunId !== undefined) {
      agent.currentRunId = currentRunId;
    }
  }
}

// Get all agents
export function getAllAgents(): AgentConfig[] {
  return [...agentRegistry];
}

// Get agents by capability
export function getAgentsByCapability(capability: string): AgentConfig[] {
  return agentRegistry.filter(a => a.capabilities.includes(capability));
}