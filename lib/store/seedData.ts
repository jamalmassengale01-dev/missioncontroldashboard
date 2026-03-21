import { WorkflowRun } from '@/lib/types';
import { workflowStore } from './workflowStore';

// Seed the workflow store with realistic mock data
export function seedWorkflowData(): void {
  const now = new Date();
  
  // Helper to create timestamps
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

  // Mock completed workflow runs
  const completedRuns: WorkflowRun[] = [
    {
      id: 'run-001',
      workflowId: 'research-viable-saas',
      workflowName: 'Find Viable AI SaaS Idea',
      assignedAgent: 'deepforge',
      input: { targetAudience: 'retail traders', constraints: 'low competition, high margin' },
      status: 'completed',
      startedAt: daysAgo(2),
      endedAt: daysAgo(2),
      output: {
        summary: 'AI SaaS market research completed. Identified 3 high-opportunity niches.',
        data: {
          opportunities: [
            { name: 'AI Trading Assistants', score: 8.5, competition: 'Medium' },
            { name: 'Content Automation for Creators', score: 9.0, competition: 'High' },
            { name: 'Micro-SaaS for Prop Traders', score: 7.8, competition: 'Low' },
          ],
        },
        recommendations: ['Validate top opportunity with market testing'],
      },
      logs: [
        { id: 'l1', timestamp: daysAgo(2), level: 'info', message: 'Workflow "Find Viable AI SaaS Idea" created and queued' },
        { id: 'l2', timestamp: daysAgo(2), level: 'info', message: 'DeepForge initializing research workflow', agent: 'deepforge' },
        { id: 'l3', timestamp: daysAgo(2), level: 'info', message: 'Research topic: "retail traders"', agent: 'deepforge' },
        { id: 'l4', timestamp: daysAgo(2), level: 'debug', message: 'Gathering market data...', agent: 'deepforge' },
        { id: 'l5', timestamp: daysAgo(2), level: 'debug', message: 'Analyzing competitor landscape...', agent: 'deepforge' },
        { id: 'l6', timestamp: daysAgo(2), level: 'info', message: 'Research completed in 3.2s', agent: 'deepforge' },
        { id: 'l7', timestamp: daysAgo(2), level: 'info', message: 'Workflow completed successfully: AI SaaS market research completed. Identified 3 high-opportunity niches.' },
      ],
      retryCount: 0,
    },
    {
      id: 'run-002',
      workflowId: 'create-youtube-script',
      workflowName: 'Create YouTube Script',
      assignedAgent: 'scriptforge',
      input: { topic: 'trading psychology', targetLength: '10 minutes', style: 'educational' },
      status: 'completed',
      startedAt: daysAgo(1),
      endedAt: daysAgo(1),
      output: {
        summary: 'YouTube script created: "trading psychology" - 10 minutes educational format',
        data: {
          titleIdeas: [
            'The Truth About Trading Psychology That No One Talks About',
            'Why Most Traders Fail at Psychology (And How to Fix It)',
          ],
          wordCount: 1500,
        },
      },
      logs: [
        { id: 'l8', timestamp: daysAgo(1), level: 'info', message: 'ScriptForge initializing content creation workflow', agent: 'scriptforge' },
        { id: 'l9', timestamp: daysAgo(1), level: 'info', message: 'Creating youtube_script about: "trading psychology"', agent: 'scriptforge' },
        { id: 'l10', timestamp: daysAgo(1), level: 'debug', message: 'Generating title ideas...', agent: 'scriptforge' },
        { id: 'l11', timestamp: daysAgo(1), level: 'debug', message: 'Crafting hook options...', agent: 'scriptforge' },
        { id: 'l12', timestamp: daysAgo(1), level: 'info', message: 'Content creation completed in 2.1s', agent: 'scriptforge' },
      ],
      retryCount: 0,
    },
    {
      id: 'run-003',
      workflowId: 'go-to-market-plan',
      workflowName: 'Go-to-Market Plan',
      assignedAgent: 'growthforge',
      input: { productDescription: 'Pine Script indicator for trend analysis', targetTraders: 'technical forex traders' },
      status: 'completed',
      startedAt: daysAgo(3),
      endedAt: daysAgo(3),
      output: {
        summary: 'Go-to-market strategy created for Pine Script indicator',
        data: {
          offer: { name: 'TrendMaster Pro', price: '$97', priceAnchor: '$297' },
          funnel: { stages: 5, conversionEstimate: '12%' },
        },
        recommendations: ['Build landing page and set up email automation sequences'],
      },
      logs: [
        { id: 'l13', timestamp: daysAgo(3), level: 'info', message: 'GrowthForge initializing marketing strategy workflow', agent: 'growthforge' },
        { id: 'l14', timestamp: daysAgo(3), level: 'info', message: 'Creating go-to-market strategy for: "Pine Script indicator"', agent: 'growthforge' },
        { id: 'l15', timestamp: daysAgo(3), level: 'debug', message: 'Analyzing target market...', agent: 'growthforge' },
        { id: 'l16', timestamp: daysAgo(3), level: 'debug', message: 'Crafting value proposition...', agent: 'growthforge' },
        { id: 'l17', timestamp: daysAgo(3), level: 'info', message: 'Strategy development completed in 4.5s', agent: 'growthforge' },
      ],
      retryCount: 0,
    },
    {
      id: 'run-004',
      workflowId: 'plan-mvp-architecture',
      workflowName: 'Plan MVP Architecture',
      assignedAgent: 'buildforge',
      input: { requirements: 'Trade copier with risk management', techPreferences: 'React, Node.js, PostgreSQL' },
      status: 'completed',
      startedAt: daysAgo(4),
      endedAt: daysAgo(4),
      output: {
        summary: 'MVP architecture designed for Trade copier with risk management',
        data: {
          techStack: { frontend: 'React + TypeScript', backend: 'Node.js + Express', database: 'PostgreSQL' },
          estimatedEffort: '6 weeks for MVP',
        },
        nextActions: ['Set up project repository and begin Phase 1 implementation'],
      },
      logs: [
        { id: 'l18', timestamp: daysAgo(4), level: 'info', message: 'BuildForge initializing development workflow', agent: 'buildforge' },
        { id: 'l19', timestamp: daysAgo(4), level: 'info', message: 'Planning architecture for: "Trade copier with risk management"', agent: 'buildforge' },
        { id: 'l20', timestamp: daysAgo(4), level: 'debug', message: 'Designing system architecture...', agent: 'buildforge' },
        { id: 'l21', timestamp: daysAgo(4), level: 'debug', message: 'Creating development roadmap...', agent: 'buildforge' },
        { id: 'l22', timestamp: daysAgo(4), level: 'info', message: 'Development planning completed in 3.8s', agent: 'buildforge' },
      ],
      retryCount: 0,
    },
    {
      id: 'run-005',
      workflowId: 'create-social-hooks',
      workflowName: 'Create Social Media Hooks',
      assignedAgent: 'signalforge',
      input: { brandVoice: 'Educational and authentic', platform: 'TikTok', topic: 'risk management' },
      status: 'completed',
      startedAt: daysAgo(1),
      endedAt: daysAgo(1),
      output: {
        summary: '5 short-form hooks created for risk management',
        data: {
          hooks: [
            { hook: 'I lost $10K in one day so you don\'t have to...', format: 'Story + Lesson' },
            { hook: 'Stop using this indicator immediately...', format: 'Contrarian + Curiosity' },
          ],
        },
      },
      logs: [
        { id: 'l23', timestamp: daysAgo(1), level: 'info', message: 'SignalForge initializing social media workflow', agent: 'signalforge' },
        { id: 'l24', timestamp: daysAgo(1), level: 'info', message: 'Creating TikTok content strategy', agent: 'signalforge' },
        { id: 'l25', timestamp: daysAgo(1), level: 'debug', message: 'Analyzing platform algorithms...', agent: 'signalforge' },
        { id: 'l26', timestamp: daysAgo(1), level: 'info', message: 'Social content creation completed in 1.8s', agent: 'signalforge' },
      ],
      retryCount: 0,
    },
    {
      id: 'run-006',
      workflowId: 'research-viable-saas',
      workflowName: 'Find Viable AI SaaS Idea',
      assignedAgent: 'deepforge',
      input: { targetAudience: 'content creators', constraints: 'automation focus' },
      status: 'completed',
      startedAt: daysAgo(5),
      endedAt: daysAgo(5),
      output: {
        summary: 'Content creator tools research completed',
        data: { opportunities: 4, marketSize: '$45B' },
      },
      logs: [
        { id: 'l27', timestamp: daysAgo(5), level: 'info', message: 'Research completed', agent: 'deepforge' },
      ],
      retryCount: 0,
    },
    {
      id: 'run-007',
      workflowId: 'create-youtube-script',
      workflowName: 'Create YouTube Script',
      assignedAgent: 'scriptforge',
      input: { topic: 'prop firm evaluation tips', targetLength: '15 minutes' },
      status: 'completed',
      startedAt: daysAgo(6),
      endedAt: daysAgo(6),
      output: {
        summary: 'YouTube script created: "prop firm evaluation tips"',
        data: { titleIdeas: 5, wordCount: 2100 },
      },
      logs: [
        { id: 'l28', timestamp: daysAgo(6), level: 'info', message: 'Script completed', agent: 'scriptforge' },
      ],
      retryCount: 0,
    },
    {
      id: 'run-008',
      workflowId: 'go-to-market-plan',
      workflowName: 'Go-to-Market Plan',
      assignedAgent: 'growthforge',
      input: { productDescription: 'Trading journal app', targetTraders: 'beginner traders' },
      status: 'completed',
      startedAt: daysAgo(7),
      endedAt: daysAgo(7),
      output: {
        summary: 'GTM plan for trading journal app completed',
        data: { offer: { price: '$29/mo' }, funnel: { stages: 4 } },
      },
      logs: [
        { id: 'l29', timestamp: daysAgo(7), level: 'info', message: 'GTM plan completed', agent: 'growthforge' },
      ],
      retryCount: 0,
    },
  ];

  // Mock running workflows
  const runningRuns: WorkflowRun[] = [
    {
      id: 'run-101',
      workflowId: 'research-viable-saas',
      workflowName: 'Find Viable AI SaaS Idea',
      assignedAgent: 'deepforge',
      input: { targetAudience: 'prop traders', constraints: 'evaluation prep tools' },
      status: 'running',
      startedAt: hoursAgo(2),
      logs: [
        { id: 'l30', timestamp: hoursAgo(2), level: 'info', message: 'Workflow created and queued' },
        { id: 'l31', timestamp: hoursAgo(2), level: 'info', message: 'Starting workflow execution: Find Viable AI SaaS Idea' },
        { id: 'l32', timestamp: hoursAgo(2), level: 'info', message: 'DeepForge initializing research workflow', agent: 'deepforge' },
        { id: 'l33', timestamp: hoursAgo(1), level: 'debug', message: 'Gathering market data...', agent: 'deepforge' },
        { id: 'l34', timestamp: hoursAgo(0.5), level: 'debug', message: 'Analyzing competitor landscape...', agent: 'deepforge' },
      ],
      retryCount: 0,
    },
    {
      id: 'run-102',
      workflowId: 'create-youtube-script',
      workflowName: 'Create YouTube Script',
      assignedAgent: 'scriptforge',
      input: { topic: 'risk management mistakes', targetLength: '12 minutes' },
      status: 'running',
      startedAt: hoursAgo(1),
      logs: [
        { id: 'l35', timestamp: hoursAgo(1), level: 'info', message: 'Workflow created and queued' },
        { id: 'l36', timestamp: hoursAgo(1), level: 'info', message: 'Starting workflow execution: Create YouTube Script' },
        { id: 'l37', timestamp: hoursAgo(0.8), level: 'info', message: 'ScriptForge initializing content creation workflow', agent: 'scriptforge' },
        { id: 'l38', timestamp: hoursAgo(0.5), level: 'debug', message: 'Generating title ideas...', agent: 'scriptforge' },
      ],
      retryCount: 0,
    },
  ];

  // Mock failed workflows
  const failedRuns: WorkflowRun[] = [
    {
      id: 'run-201',
      workflowId: 'plan-mvp-architecture',
      workflowName: 'Plan MVP Architecture',
      assignedAgent: 'buildforge',
      input: { requirements: 'Complex multi-tenant system with real-time sync', techPreferences: 'unknown stack' },
      status: 'failed',
      startedAt: daysAgo(1),
      endedAt: daysAgo(1),
      error: 'Requirements too vague for architecture planning',
      logs: [
        { id: 'l39', timestamp: daysAgo(1), level: 'info', message: 'Workflow created and queued' },
        { id: 'l40', timestamp: daysAgo(1), level: 'info', message: 'Starting workflow execution: Plan MVP Architecture' },
        { id: 'l41', timestamp: daysAgo(1), level: 'info', message: 'BuildForge initializing development workflow', agent: 'buildforge' },
        { id: 'l42', timestamp: daysAgo(1), level: 'error', message: 'Requirements too vague for architecture planning', agent: 'buildforge' },
      ],
      retryCount: 0,
    },
    {
      id: 'run-202',
      workflowId: 'create-social-hooks',
      workflowName: 'Create Social Media Hooks',
      assignedAgent: 'signalforge',
      input: { brandVoice: 'Aggressive', platform: 'LinkedIn', topic: 'day trading' },
      status: 'failed',
      startedAt: daysAgo(2),
      endedAt: daysAgo(2),
      error: 'Platform-audience mismatch detected',
      logs: [
        { id: 'l43', timestamp: daysAgo(2), level: 'info', message: 'Workflow created and queued' },
        { id: 'l44', timestamp: daysAgo(2), level: 'warn', message: 'Brand voice may not resonate with LinkedIn audience', agent: 'signalforge' },
        { id: 'l45', timestamp: daysAgo(2), level: 'error', message: 'Platform-audience mismatch detected', agent: 'signalforge' },
      ],
      retryCount: 1,
    },
  ];

  // Additional completed runs for variety
  const moreCompletedRuns: WorkflowRun[] = [
    {
      id: 'run-009',
      workflowId: 'plan-mvp-architecture',
      workflowName: 'Plan MVP Architecture',
      assignedAgent: 'buildforge',
      input: { requirements: 'Automated trading journal with analytics', techPreferences: 'Next.js, Python, PostgreSQL' },
      status: 'completed',
      startedAt: daysAgo(3),
      endedAt: daysAgo(3),
      output: {
        summary: 'Architecture plan for automated trading journal completed',
        data: { techStack: ['Next.js', 'FastAPI', 'PostgreSQL', 'Redis'], phases: 3 },
        nextActions: ['Set up database schema', 'Implement auth system'],
      },
      logs: [
        { id: 'l46', timestamp: daysAgo(3), level: 'info', message: 'Architecture planning started', agent: 'buildforge' },
        { id: 'l47', timestamp: daysAgo(3), level: 'info', message: 'Completed in 4.2s', agent: 'buildforge' },
      ],
      retryCount: 0,
    },
    {
      id: 'run-010',
      workflowId: 'create-social-hooks',
      workflowName: 'Create Social Media Hooks',
      assignedAgent: 'signalforge',
      input: { brandVoice: 'Educational', platform: 'YouTube Shorts', topic: 'trading mindset' },
      status: 'completed',
      startedAt: daysAgo(4),
      endedAt: daysAgo(4),
      output: {
        summary: '8 viral hooks created for YouTube Shorts',
        data: { hooks: 8, estimatedViews: '50K-100K' },
      },
      logs: [
        { id: 'l48', timestamp: daysAgo(4), level: 'info', message: 'Social content generation started', agent: 'signalforge' },
        { id: 'l49', timestamp: daysAgo(4), level: 'info', message: 'Completed in 2.1s', agent: 'signalforge' },
      ],
      retryCount: 0,
    },
    {
      id: 'run-011',
      workflowId: 'research-viable-saas',
      workflowName: 'Find Viable AI SaaS Idea',
      assignedAgent: 'deepforge',
      input: { targetAudience: 'e-commerce store owners', constraints: 'inventory management focus' },
      status: 'completed',
      startedAt: daysAgo(8),
      endedAt: daysAgo(8),
      output: {
        summary: 'E-commerce AI tools research completed',
        data: { opportunities: 3, topScore: 8.2 },
        recommendations: ['Focus on demand forecasting niche'],
      },
      logs: [
        { id: 'l50', timestamp: daysAgo(8), level: 'info', message: 'Research started', agent: 'deepforge' },
        { id: 'l51', timestamp: daysAgo(8), level: 'info', message: 'Completed in 5.1s', agent: 'deepforge' },
      ],
      retryCount: 0,
    },
    {
      id: 'run-012',
      workflowId: 'go-to-market-plan',
      workflowName: 'Go-to-Market Plan',
      assignedAgent: 'growthforge',
      input: { productDescription: 'AI-powered trade journal', targetTraders: 'prop firm traders' },
      status: 'completed',
      startedAt: daysAgo(6),
      endedAt: daysAgo(6),
      output: {
        summary: 'GTM strategy for AI trade journal completed',
        data: { pricing: { tier1: '$19/mo', tier2: '$49/mo' }, funnel: '3-stage' },
      },
      logs: [
        { id: 'l52', timestamp: daysAgo(6), level: 'info', message: 'GTM planning started', agent: 'growthforge' },
        { id: 'l53', timestamp: daysAgo(6), level: 'info', message: 'Completed in 3.8s', agent: 'growthforge' },
      ],
      retryCount: 0,
    },
  ];

  // Add all runs to store using the public API
  [...completedRuns, ...runningRuns, ...failedRuns, ...moreCompletedRuns].forEach(run => {
    // Use the createRun logic but directly set since we're seeding
    (workflowStore as any).runs.set(run.id, run);
  });

  console.log(`Seeded ${completedRuns.length + moreCompletedRuns.length} completed, ${runningRuns.length} running, ${failedRuns.length} failed workflow runs`);
}

// Call seed on module load if in browser
if (typeof window !== 'undefined') {
  seedWorkflowData();
}