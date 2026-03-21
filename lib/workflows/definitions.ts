import { WorkflowDefinition } from '@/lib/types';

export type { WorkflowDefinition };

export const workflowDefinitions: WorkflowDefinition[] = [
  {
    id: 'research-viable-saas',
    name: 'Find Viable AI SaaS Idea',
    description: 'Research and identify high-opportunity AI SaaS ideas for a specific target audience',
    defaultAgent: 'deepforge',
    steps: [
      {
        id: 'market-analysis',
        name: 'Market Analysis',
        agent: 'deepforge',
        inputMapping: { targetAudience: 'targetAudience', constraints: 'constraints' },
        outputMapping: { opportunities: 'marketOpportunities' },
      },
      {
        id: 'opportunity-scoring',
        name: 'Opportunity Scoring',
        agent: 'deepforge',
        inputMapping: { opportunities: 'marketOpportunities' },
        outputMapping: { scoredOpportunities: 'rankedOpportunities' },
      },
    ],
    inputSchema: {
      type: 'object',
      properties: {
        targetAudience: {
          type: 'string',
          description: 'Target market or audience (e.g., "retail traders", "content creators")',
        },
        constraints: {
          type: 'string',
          description: 'Constraints or focus areas (e.g., "low competition", "high margin")',
        },
      },
      required: ['targetAudience'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        opportunities: {
          type: 'array',
          description: 'List of viable opportunities with scores',
        },
        recommendations: {
          type: 'array',
          description: 'Actionable next steps',
        },
      },
    },
  },
  {
    id: 'create-youtube-script',
    name: 'Create YouTube Script',
    description: 'Generate a complete YouTube script with hooks, outline, and CTA',
    defaultAgent: 'scriptforge',
    steps: [
      {
        id: 'generate-ideas',
        name: 'Generate Title Ideas',
        agent: 'scriptforge',
        inputMapping: { topic: 'topic', style: 'style' },
        outputMapping: { titleIdeas: 'titles' },
      },
      {
        id: 'create-script',
        name: 'Create Full Script',
        agent: 'scriptforge',
        inputMapping: { topic: 'topic', title: 'selectedTitle', length: 'targetLength' },
        outputMapping: { script: 'finalScript' },
      },
    ],
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Video topic or subject (e.g., "trading psychology", "risk management")',
        },
        targetLength: {
          type: 'string',
          description: 'Target video length (e.g., "10 minutes", "15-20 minutes")',
          default: '10 minutes',
        },
        style: {
          type: 'string',
          description: 'Content style (e.g., "educational", "storytelling", "technical")',
          default: 'educational',
        },
      },
      required: ['topic'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        titleIdeas: {
          type: 'array',
          description: 'List of potential video titles',
        },
        hooks: {
          type: 'array',
          description: 'Opening hook options',
        },
        scriptOutline: {
          type: 'array',
          description: 'Structured outline with timestamps',
        },
        callToAction: {
          type: 'object',
          description: 'CTA recommendations',
        },
      },
    },
  },
  {
    id: 'go-to-market-plan',
    name: 'Go-to-Market Plan',
    description: 'Create a comprehensive go-to-market strategy for a product',
    defaultAgent: 'growthforge',
    steps: [
      {
        id: 'define-offer',
        name: 'Define Offer Structure',
        agent: 'growthforge',
        inputMapping: { product: 'productDescription', target: 'targetTraders' },
        outputMapping: { offer: 'offerStructure' },
      },
      {
        id: 'design-funnel',
        name: 'Design Sales Funnel',
        agent: 'growthforge',
        inputMapping: { offer: 'offerStructure' },
        outputMapping: { funnel: 'salesFunnel' },
      },
      {
        id: 'create-messaging',
        name: 'Create Messaging',
        agent: 'growthforge',
        inputMapping: { offer: 'offerStructure', funnel: 'salesFunnel' },
        outputMapping: { messaging: 'brandMessaging' },
      },
    ],
    inputSchema: {
      type: 'object',
      properties: {
        productDescription: {
          type: 'string',
          description: 'Description of the product or service',
        },
        targetTraders: {
          type: 'string',
          description: 'Target audience (e.g., "beginner forex traders", "prop firm challengers")',
        },
        goal: {
          type: 'string',
          description: 'Launch goal (e.g., "launch", "funnel", "scale")',
          default: 'launch',
        },
      },
      required: ['productDescription', 'targetTraders'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        offer: {
          type: 'object',
          description: 'Complete offer structure with pricing and bonuses',
        },
        funnel: {
          type: 'object',
          description: 'Sales funnel stages and conversion points',
        },
        messaging: {
          type: 'object',
          description: 'Key messaging and positioning',
        },
        launchTimeline: {
          type: 'array',
          description: 'Phase-by-phase launch plan',
        },
      },
    },
  },
  {
    id: 'plan-mvp-architecture',
    name: 'Plan MVP Architecture',
    description: 'Design technical architecture and development plan for an MVP',
    defaultAgent: 'buildforge',
    steps: [
      {
        id: 'analyze-requirements',
        name: 'Analyze Requirements',
        agent: 'buildforge',
        inputMapping: { requirements: 'requirements', preferences: 'techPreferences' },
        outputMapping: { modules: 'systemModules' },
      },
      {
        id: 'design-architecture',
        name: 'Design Architecture',
        agent: 'buildforge',
        inputMapping: { modules: 'systemModules' },
        outputMapping: { architecture: 'systemArchitecture' },
      },
      {
        id: 'create-roadmap',
        name: 'Create Roadmap',
        agent: 'buildforge',
        inputMapping: { architecture: 'systemArchitecture' },
        outputMapping: { roadmap: 'developmentRoadmap' },
      },
    ],
    inputSchema: {
      type: 'object',
      properties: {
        requirements: {
          type: 'string',
          description: 'Project requirements and features needed',
        },
        techPreferences: {
          type: 'string',
          description: 'Technology preferences (e.g., "React, Node.js, PostgreSQL")',
          default: 'modern web stack',
        },
        taskType: {
          type: 'string',
          description: 'Type of planning (architecture, mvp, automation)',
          default: 'architecture',
        },
      },
      required: ['requirements'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        architecture: {
          type: 'object',
          description: 'System architecture overview',
        },
        techStack: {
          type: 'object',
          description: 'Recommended technology stack',
        },
        modules: {
          type: 'array',
          description: 'System modules and responsibilities',
        },
        developmentPhases: {
          type: 'array',
          description: 'Phase-by-phase development plan',
        },
        nextActions: {
          type: 'array',
          description: 'Immediate next steps',
        },
      },
    },
  },
  {
    id: 'create-social-hooks',
    name: 'Create Social Media Hooks',
    description: 'Generate short-form content hooks for social media platforms',
    defaultAgent: 'signalforge',
    steps: [
      {
        id: 'analyze-platform',
        name: 'Analyze Platform Trends',
        agent: 'signalforge',
        inputMapping: { platform: 'platform', voice: 'brandVoice' },
        outputMapping: { trends: 'platformTrends' },
      },
      {
        id: 'generate-hooks',
        name: 'Generate Hook Variations',
        agent: 'signalforge',
        inputMapping: { trends: 'platformTrends', topic: 'topic' },
        outputMapping: { hooks: 'hookVariations' },
      },
    ],
    inputSchema: {
      type: 'object',
      properties: {
        brandVoice: {
          type: 'string',
          description: 'Brand voice/style (e.g., "educational and authentic", "bold and contrarian")',
          default: 'Educational and authentic',
        },
        platform: {
          type: 'string',
          description: 'Target platform (e.g., "TikTok", "Instagram", "YouTube Shorts", "multi-platform")',
          default: 'multi-platform',
        },
        topic: {
          type: 'string',
          description: 'Content topic (e.g., "trading psychology", "risk management")',
          default: 'trading education',
        },
        goal: {
          type: 'string',
          description: 'Content goal (hooks, calendar, strategy)',
          default: 'hooks',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        hooks: {
          type: 'array',
          description: 'List of hooks with captions and hashtags',
        },
        postingAngles: {
          type: 'array',
          description: 'Content angle suggestions',
        },
        hashtagStrategy: {
          type: 'object',
          description: 'Hashtag recommendations by category',
        },
      },
    },
  },
];

// Get workflow definition by ID
export function getWorkflowDefinition(id: string): WorkflowDefinition | undefined {
  return workflowDefinitions.find(d => d.id === id);
}

// Get all workflow definitions
export function getAllWorkflowDefinitions(): WorkflowDefinition[] {
  return [...workflowDefinitions];
}

// Get definitions by agent
export function getWorkflowsByAgent(agentId: string): WorkflowDefinition[] {
  return workflowDefinitions.filter(d => d.defaultAgent === agentId);
}