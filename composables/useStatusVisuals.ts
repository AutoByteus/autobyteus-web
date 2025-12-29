import { computed, h, type Component, type Ref } from 'vue';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, CogIcon, PlayIcon, ArrowPathIcon } from '@heroicons/vue/24/solid';
import { AgentStatus } from '~/generated/graphql';

interface StatusVisuals {
  text: string;
  colorClass: string;
  iconComponent: Component;
}

export function useStatusVisuals(status: Ref<string | undefined>) {
  const visuals = computed((): StatusVisuals => {
    const currentStatus = status.value || AgentStatus.Uninitialized;

    switch (currentStatus) {
      // Explicitly handle uninitialized state
      case AgentStatus.Uninitialized:
        return { text: 'Uninitialized', colorClass: 'bg-gray-400', iconComponent: CogIcon };

      // Initialization states
      case AgentStatus.Bootstrapping:
        return { text: 'Bootstrapping', colorClass: 'bg-blue-500 animate-pulse', iconComponent: CogIcon };

      // Idle state
      case AgentStatus.Idle:
        return { text: 'Idle', colorClass: 'bg-green-500', iconComponent: CheckCircleIcon };

      // Core processing loop
      case AgentStatus.ProcessingUserInput:
        return { text: 'Processing Input', colorClass: 'bg-blue-500 animate-pulse', iconComponent: CogIcon };
      case AgentStatus.AwaitingLlmResponse:
        return { text: 'Awaiting LLM Response', colorClass: 'bg-purple-500 animate-pulse', iconComponent: ArrowPathIcon };
      case AgentStatus.AnalyzingLlmResponse:
        return { text: 'Analyzing Response', colorClass: 'bg-blue-500 animate-pulse', iconComponent: CogIcon };
      case AgentStatus.AwaitingToolApproval:
        return { text: 'Awaiting Approval', colorClass: 'bg-yellow-500', iconComponent: ClockIcon };
      case AgentStatus.ExecutingTool:
        return { text: 'Executing Tool', colorClass: 'bg-cyan-500 animate-pulse', iconComponent: PlayIcon };
      case AgentStatus.ProcessingToolResult:
        return { text: 'Processing Tool Result', colorClass: 'bg-blue-500 animate-pulse', iconComponent: CogIcon };

      // Terminal states
      case AgentStatus.Error:
        return { text: 'Error', colorClass: 'bg-red-500', iconComponent: ExclamationTriangleIcon };
      case AgentStatus.ShuttingDown:
        return { text: 'Shutting Down', colorClass: 'bg-orange-500 animate-pulse', iconComponent: ExclamationTriangleIcon };
      case AgentStatus.ShutdownComplete:
        return { text: 'Offline', colorClass: 'bg-slate-600', iconComponent: ExclamationTriangleIcon };

      // Default/fallback state
      default:
        return { text: 'Initializing', colorClass: 'bg-orange-400', iconComponent: CogIcon };
    }
  });

  return { visuals };
}
