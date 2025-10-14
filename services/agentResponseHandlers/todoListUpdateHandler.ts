import { type GraphQLToDoListUpdateData } from '~/generated/graphql'
import type { AgentContext } from '~/types/agent/AgentContext'
import { ToDoStatus, type ToDo } from '~/types/todo'

/**
 * Processes a to-do list update event by replacing the to-do list in the agent's state.
 * @param eventData The to-do list data from the GraphQL subscription.
 * @param agentContext The full context for the agent run.
 */
export function handleToDoListUpdate(
  eventData: GraphQLToDoListUpdateData,
  agentContext: AgentContext
): void {
  if (eventData.todos) {
    const normalizedTodos: ToDo[] = eventData.todos.map(todo => ({
      todoId: todo.todoId,
      description: todo.description,
      // The GQL enum and local enum have identical string values, and the field is non-nullable.
      // A direct type assertion is safe and consistent with other handlers.
      status: todo.status as ToDoStatus,
    }))

    agentContext.state.todoList = normalizedTodos
    console.log(`Updated ToDo list for agent ${agentContext.state.agentId} with ${eventData.todos.length} items.`)
  }
}
