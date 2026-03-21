import { TelegramCommand, TelegramMessage } from './config';
import { TelegramAdapter } from './adapter';
import { workflowStore } from '@/lib/store/workflowStore';
import { getAllAgents } from '@/lib/agents/registry';
import { workflowDefinitions } from '@/lib/workflows/definitions';
import { createAndExecuteWorkflow } from '@/lib/agents/executor';

// Format system status for Telegram
function formatSystemStatus(): string {
  const stats = workflowStore.getStats();
  const agents = getAllAgents();

  const status = agents.map((agent) => {
    const statusEmoji =
      agent.status === 'idle'
        ? '🟢'
        : agent.status === 'working'
        ? '🔵'
        : agent.status === 'blocked'
        ? '🔴'
        : '⚫';
    return `${statusEmoji} ${agent.displayName}: ${agent.status}`;
  });

  return `
📊 <b>Mission Control System Status</b>

<b>Workflows:</b>
• Total: ${stats.total}
• Active: ${stats.byStatus.running + stats.byStatus.queued + stats.byStatus.assigned}
• Completed: ${stats.byStatus.completed}
• Failed: ${stats.byStatus.failed + stats.byStatus.blocked}

<b>Agents:</b>
${status.join('\n')}
  `.trim();
}

// Format workflows list
function formatWorkflowsList(): string {
  const workflows = workflowDefinitions;

  if (workflows.length === 0) {
    return '❌ No workflows defined.';
  }

  const list = workflows.map((wf) => {
    return `• <b>${wf.name}</b> (${wf.id})\n  ${wf.description}`;
  });

  return `
📋 <b>Available Workflows</b>

${list.join('\n\n')}

Use <code>/run &lt;workflow-id&gt;</code> to execute a workflow.
  `.trim();
}

// Format agents status
function formatAgentsStatus(): string {
  const agents = getAllAgents();

  const list = agents.map((agent) => {
    const statusEmoji =
      agent.status === 'idle'
        ? '🟢'
        : agent.status === 'working'
        ? '🔵'
        : agent.status === 'blocked'
        ? '🔴'
        : '⚫';
    const currentTask = agent.currentRunId
      ? `\n   <i>Working on: ${agent.currentRunId}</i>`
      : '';
    return `${statusEmoji} <b>${agent.displayName}</b> (${agent.id})\n   Role: ${agent.role}${currentTask}`;
  });

  return `
🤖 <b>Agent Status</b>

${list.join('\n\n')}
  `.trim();
}

// Format workflow logs
function formatWorkflowLogs(runId: string): string {
  const run = workflowStore.getRun(runId);

  if (!run) {
    return `❌ Workflow run <code>${runId}</code> not found.`;
  }

  const logs = run.logs.slice(-10).map((log) => {
    const emoji =
      log.level === 'error' ? '🔴' : log.level === 'warn' ? '🟡' : '🟢';
    const time = new Date(log.timestamp).toLocaleTimeString();
    return `${emoji} [${time}] ${log.agent ? `[${log.agent}] ` : ''}${log.message}`;
  });

  return `
📜 <b>Workflow Logs: ${run.workflowName}</b>
ID: <code>${runId}</code>
Status: ${run.status}

${logs.join('\n')}

${run.logs.length > 10 ? `<i>...and ${run.logs.length - 10} more logs</i>` : ''}
  `.trim();
}

// Format help message
function formatHelp(): string {
  return `
🤖 <b>Mission Control Bot Commands</b>

<b>System Commands:</b>
/status - Show system status
/agents - Show agent status
/help - Show this help message

<b>Workflow Commands:</b>
/workflows - List available workflows
/run &lt;workflow&gt; [params] - Execute a workflow
/logs &lt;runId&gt; - Get workflow logs

<b>Examples:</b>
<code>/run market-research query=AI+tools</code>
<code>/logs run-1234567890</code>
  `.trim();
}

// Register all commands
export function registerTelegramCommands(adapter: TelegramAdapter): void {
  // /status command
  adapter.registerCommand({
    command: 'status',
    description: 'Show system status',
    handler: async (message: TelegramMessage) => {
      await adapter.sendMessage(message.chatId, formatSystemStatus(), {
        parseMode: 'HTML',
      });
    },
  });

  // /workflows command
  adapter.registerCommand({
    command: 'workflows',
    description: 'List available workflows',
    handler: async (message: TelegramMessage) => {
      await adapter.sendMessage(message.chatId, formatWorkflowsList(), {
        parseMode: 'HTML',
      });
    },
  });

  // /run command
  adapter.registerCommand({
    command: 'run',
    description: 'Execute a workflow: /run <workflow> [params]',
    handler: async (message: TelegramMessage, args: string[]) => {
      if (args.length === 0) {
        await adapter.sendMessage(
          message.chatId,
          '❌ Please specify a workflow ID.\nUsage: /run <workflow-id> [params]',
          { parseMode: 'HTML' }
        );
        return;
      }

      const workflowId = args[0];
      const params: Record<string, string> = {};

      // Parse additional params (key=value format)
      for (let i = 1; i < args.length; i++) {
        const [key, ...valueParts] = args[i].split('=');
        if (key && valueParts.length > 0) {
          params[key] = valueParts.join('=').replace(/\+/g, ' ');
        }
      }

      // Check if workflow exists
      const definition = workflowDefinitions.find((d) => d.id === workflowId);
      if (!definition) {
        await adapter.sendMessage(
          message.chatId,
          `❌ Workflow <code>${workflowId}</code> not found.\nUse /workflows to see available workflows.`,
          { parseMode: 'HTML' }
        );
        return;
      }

      // Send initial message
      await adapter.sendMessage(
        message.chatId,
        `🚀 Starting workflow: <b>${definition.name}</b>...`,
        { parseMode: 'HTML' }
      );

      try {
        // Execute workflow
        const response = await createAndExecuteWorkflow(workflowId, params);

        if (response.success) {
          await adapter.sendMessage(
            message.chatId,
            `✅ <b>Workflow Completed</b>\n\n${response.summary}\n\nRun ID: <code>${response.workflowId}</code>`,
            { parseMode: 'HTML' }
          );
        } else {
          await adapter.sendMessage(
            message.chatId,
            `❌ <b>Workflow Failed</b>\n\n${response.summary}\n\nRun ID: <code>${response.workflowId}</code>`,
            { parseMode: 'HTML' }
          );
        }
      } catch (error) {
        await adapter.sendMessage(
          message.chatId,
          `❌ <b>Error</b>\n\n${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          { parseMode: 'HTML' }
        );
      }
    },
  });

  // /agents command
  adapter.registerCommand({
    command: 'agents',
    description: 'Show agent status',
    handler: async (message: TelegramMessage) => {
      await adapter.sendMessage(message.chatId, formatAgentsStatus(), {
        parseMode: 'HTML',
      });
    },
  });

  // /logs command
  adapter.registerCommand({
    command: 'logs',
    description: 'Get workflow logs: /logs <runId>',
    handler: async (message: TelegramMessage, args: string[]) => {
      if (args.length === 0) {
        await adapter.sendMessage(
          message.chatId,
          '❌ Please specify a run ID.\nUsage: /logs <run-id>',
          { parseMode: 'HTML' }
        );
        return;
      }

      const runId = args[0];
      await adapter.sendMessage(message.chatId, formatWorkflowLogs(runId), {
        parseMode: 'HTML',
      });
    },
  });

  // /help command
  adapter.registerCommand({
    command: 'help',
    description: 'Show command reference',
    handler: async (message: TelegramMessage) => {
      await adapter.sendMessage(message.chatId, formatHelp(), {
        parseMode: 'HTML',
      });
    },
  });
}
