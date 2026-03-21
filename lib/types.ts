export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'working' | 'blocked' | 'offline';
  currentFocus: string;
  lastActivity: string;
  capabilities: string[];
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedAgent: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string;
  project: string;
  status: 'Backlog' | 'In Progress' | 'Review' | 'Done';
  activityLog: ActivityEntry[];
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  action: string;
  agent: string;
}

export type ColumnType = 'Backlog' | 'In Progress' | 'Review' | 'Done';

// Project types
export type ProjectStatus = 'Planning' | 'Active' | 'Paused' | 'Completed';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: ProjectStatus;
  linkedTaskCount: number;
  linkedDocumentCount: number;
  milestones: Milestone[];
  lastUpdated: string;
  createdAt: string;
  category: string;
}

// Calendar types
export type EventType = 'task' | 'automation' | 'workflow' | 'trading' | 'meeting';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: EventType;
  allDay?: boolean;
  relatedTaskId?: string;
  relatedProjectId?: string;
}

// Memory types
export type MemoryTag = 'Research' | 'Content' | 'Strategy' | 'Technical' | 'Decisions';

export interface MemoryEntry {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags: MemoryTag[];
  createdAt: string;
  updatedAt: string;
  relatedProjectId?: string;
}

// Document types
export type DocumentCategory = 'Strategy' | 'Content' | 'Technical' | 'Operations' | 'Research';

export interface Document {
  id: string;
  title: string;
  category: DocumentCategory;
  createdAt: string;
  updatedAt: string;
  relatedProjectId?: string;
  content?: string;
}

// Operations types
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'paused' | 'error' | 'idle';
  lastRun: string;
  nextRun?: string;
  runCount: number;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  type: 'task' | 'agent' | 'workflow' | 'system' | 'project';
  description: string;
  agent?: string;
}

export interface SystemStatus {
  database: 'connected' | 'disconnected';
  agentWorkers: 'online' | 'offline' | 'degraded';
  integrations: 'operational' | 'partial' | 'down';
  health: 'good' | 'fair' | 'poor';
}

// Architect types
export interface FocusArea {
  id: string;
  title: string;
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  progress: number;
  relatedProjectId?: string;
}

export interface PriorityItem {
  id: string;
  rank: number;
  title: string;
  description: string;
  estimatedEffort: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface DecisionItem {
  id: string;
  title: string;
  description: string;
  context: string;
  options: string[];
  recommendedOption?: number;
  dueDate?: string;
  status: 'pending' | 'decided' | 'deferred';
}

// Workflow Run
type WorkflowRunStatus = 'queued' | 'assigned' | 'running' | 'waiting' | 'completed' | 'failed' | 'blocked' | 'canceled';

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  assignedAgent: string;
  input: Record<string, any>;
  status: WorkflowRunStatus;
  startedAt: string;
  endedAt?: string;
  output?: WorkflowOutput;
  logs: WorkflowLog[];
  error?: string;
  retryCount: number;
  parentRunId?: string;
  childRunIds?: string[];
}

export { type WorkflowRunStatus };

export interface WorkflowOutput {
  summary: string;
  data: Record<string, any>;
  recommendations?: string[];
  nextActions?: string[];
}

export interface WorkflowLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  agent?: string;
  metadata?: Record<string, any>;
}

// Agent Config
export interface AgentConfig {
  id: string;
  displayName: string;
  role: string;
  description: string;
  capabilities: string[];
  acceptedJobTypes: string[];
  endpoint: string;
  status: 'idle' | 'working' | 'blocked' | 'offline';
  currentRunId?: string;
}

// Workflow Definition
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  defaultAgent: string;
  steps: WorkflowStep[];
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agent: string;
  inputMapping: Record<string, string>;
  outputMapping: Record<string, string>;
  condition?: string;
}

// Agent Execution Response
export interface AgentExecutionResponse {
  success: boolean;
  agentId: string;
  workflowId: string;
  summary: string;
  output: Record<string, any>;
  logs: WorkflowLog[];
  nextRecommendedAction?: string;
  timestamp: string;
}
