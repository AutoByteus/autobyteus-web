import { computed, h, type Component, type Ref } from 'vue';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, CogIcon, PlayIcon, ArrowPathIcon } from '@heroicons/vue/24/solid';
import { AgentOperationalPhase } from '~/generated/graphql';

interface PhaseVisuals {
  text: string;
  colorClass: string;
  iconComponent: Component;
}

export function usePhaseVisuals(phase: Ref<string | undefined>) {
  const visuals = computed((): PhaseVisuals => {
    const currentPhase = phase.value || AgentOperationalPhase.Uninitialized;

    switch (currentPhase) {
      // Explicitly handle uninitialized state
      case AgentOperationalPhase.Uninitialized:
        return { text: 'Uninitialized', colorClass: 'bg-gray-400', iconComponent: CogIcon };

      // Initialization phases
      case AgentOperationalPhase.Bootstrapping:
        return { text: 'Bootstrapping', colorClass: 'bg-blue-500 animate-pulse', iconComponent: CogIcon };

      // Idle state
      case AgentOperationalPhase.Idle:
        return { text: 'Idle', colorClass: 'bg-green-500', iconComponent: CheckCircleIcon };

      // Core processing loop
      case AgentOperationalPhase.ProcessingUserInput:
        return { text: 'Processing Input', colorClass: 'bg-blue-500 animate-pulse', iconComponent: CogIcon };
      case AgentOperationalPhase.AwaitingLlmResponse:
        return { text: 'Awaiting LLM Response', colorClass: 'bg-purple-500 animate-pulse', iconComponent: ArrowPathIcon };
      case AgentOperationalPhase.AnalyzingLlmResponse:
        return { text: 'Analyzing Response', colorClass: 'bg-blue-500 animate-pulse', iconComponent: CogIcon };
      case AgentOperationalPhase.AwaitingToolApproval:
        return { text: 'Awaiting Approval', colorClass: 'bg-yellow-500', iconComponent: ClockIcon };
      case AgentOperationalPhase.ExecutingTool:
        return { text: 'Executing Tool', colorClass: 'bg-cyan-500 animate-pulse', iconComponent: PlayIcon };
      case AgentOperationalPhase.ProcessingToolResult:
        return { text: 'Processing Tool Result', colorClass: 'bg-blue-500 animate-pulse', iconComponent: CogIcon };

      // Terminal states
      case AgentOperationalPhase.Error:
        return { text: 'Error', colorClass: 'bg-red-500', iconComponent: ExclamationTriangleIcon };
      case AgentOperationalPhase.ShuttingDown:
        return { text: 'Shutting Down', colorClass: 'bg-orange-500 animate-pulse', iconComponent: ExclamationTriangleIcon };
      case AgentOperationalPhase.ShutdownComplete:
        return { text: 'Offline', colorClass: 'bg-slate-600', iconComponent: ExclamationTriangleIcon };

      // Default/fallback state
      default:
        return { text: 'Initializing', colorClass: 'bg-orange-400', iconComponent: CogIcon };
    }
  });

  return { visuals };
}
