import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { handleToolApprovalRequested, handleToolAutoExecuting, handleToolLog } from '../toolLifecycleHandler';
import { useAgentActivityStore } from '~/stores/agentActivityStore';
import type { AgentContext } from '~/types/agent/AgentContext';
import type { EditFileSegment } from '~/types/segments';
import type { ToolApprovalRequestedPayload, ToolAutoExecutingPayload, ToolLogPayload } from '../../protocol/messageTypes';

vi.mock('~/stores/agentActivityStore', () => ({
  useAgentActivityStore: vi.fn(),
}));

describe('toolLifecycleHandler', () => {
  const agentId = 'test-agent-id';
  let mockContext: AgentContext;
  let mockActivityStore: any;

  const buildEditFileSegment = (invocationId: string): EditFileSegment => ({
    type: 'edit_file',
    invocationId,
    toolName: 'edit_file',
    arguments: {},
    status: 'parsing',
    logs: [],
    result: null,
    error: null,
    path: '',
    originalContent: '',
    language: 'diff',
  });

  const buildContextWithSegment = (segment: EditFileSegment, segmentId: string): AgentContext => ({
    state: { agentId },
    conversation: {
      messages: [
        {
          type: 'ai',
          text: '',
          timestamp: new Date(),
          isComplete: false,
          segments: [Object.assign(segment, { _segmentId: segmentId })],
        },
      ],
      updatedAt: '',
    },
  }) as AgentContext;

  beforeEach(() => {
    setActivePinia(createPinia());

    mockActivityStore = {
      updateActivityStatus: vi.fn(),
      updateActivityArguments: vi.fn(),
      setHighlightedActivity: vi.fn(),
      addActivityLog: vi.fn(),
      setActivityResult: vi.fn(),
    };

    (useAgentActivityStore as any).mockReturnValue(mockActivityStore);
  });

  it('hydrates edit_file on TOOL_AUTO_EXECUTING', () => {
    const invocationId = 'patch-1';
    const segment = buildEditFileSegment(invocationId);
    mockContext = buildContextWithSegment(segment, invocationId);

    const payload: ToolAutoExecutingPayload = {
      invocation_id: invocationId,
      tool_name: 'edit_file',
      arguments: {
        path: '/tmp/example.txt',
        patch: '--- a\n+++ b\n@@\n+line\n',
      },
    };

    handleToolAutoExecuting(payload, mockContext);

    expect(segment.status).toBe('executing');
    expect(segment.toolName).toBe('edit_file');
    expect(segment.arguments).toEqual(payload.arguments);
    expect(segment.path).toBe('/tmp/example.txt');
    expect(segment.originalContent).toBe('--- a\n+++ b\n@@\n+line\n');
    expect(mockActivityStore.updateActivityStatus).toHaveBeenCalledWith(agentId, invocationId, 'executing');
    expect(mockActivityStore.updateActivityArguments).toHaveBeenCalledWith(agentId, invocationId, payload.arguments);
    expect(mockActivityStore.setHighlightedActivity).toHaveBeenCalledWith(agentId, invocationId);
  });

  it('hydrates edit_file on TOOL_APPROVAL_REQUESTED', () => {
    const invocationId = 'patch-approve-1';
    const segment = buildEditFileSegment(invocationId);
    mockContext = buildContextWithSegment(segment, invocationId);

    const payload: ToolApprovalRequestedPayload = {
      invocation_id: invocationId,
      tool_name: 'edit_file',
      arguments: {
        path: '/tmp/approved.txt',
        patch: '--- a\n+++ b\n@@\n+approved\n',
      },
    };

    handleToolApprovalRequested(payload, mockContext);

    expect(segment.status).toBe('awaiting-approval');
    expect(segment.toolName).toBe('edit_file');
    expect(segment.arguments).toEqual(payload.arguments);
    expect(segment.path).toBe('/tmp/approved.txt');
    expect(segment.originalContent).toBe('--- a\n+++ b\n@@\n+approved\n');
    expect(mockActivityStore.updateActivityStatus).toHaveBeenCalledWith(agentId, invocationId, 'awaiting-approval');
    expect(mockActivityStore.updateActivityArguments).toHaveBeenCalledWith(agentId, invocationId, payload.arguments);
    expect(mockActivityStore.setHighlightedActivity).toHaveBeenCalledWith(agentId, invocationId);
  });

  it('handles edit_file TOOL_LOG success updates', () => {
    const invocationId = 'patch-log-1';
    const segment = buildEditFileSegment(invocationId);
    mockContext = buildContextWithSegment(segment, invocationId);

    const payload: ToolLogPayload = {
      tool_invocation_id: invocationId,
      tool_name: 'edit_file',
      log_entry:
        '[TOOL_RESULT_SUCCESS_PROCESSED] Agent_ID: test, Tool: edit_file, Invocation_ID: patch-log-1, Result: {"ok": true}',
    };

    handleToolLog(payload, mockContext);

    expect(segment.status).toBe('success');
    expect(segment.result).toEqual({ ok: true });
    expect(segment.error).toBeNull();
    expect(segment.logs).toContain(payload.log_entry);
    expect(mockActivityStore.addActivityLog).toHaveBeenCalledWith(agentId, invocationId, payload.log_entry);
    expect(mockActivityStore.updateActivityStatus).toHaveBeenCalledWith(agentId, invocationId, 'success');
    expect(mockActivityStore.setActivityResult).toHaveBeenCalledWith(agentId, invocationId, { ok: true }, null);
  });
});
