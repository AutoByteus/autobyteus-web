import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleToDoListUpdate } from '../todoListUpdateHandler'
import { AgentContext } from '~/types/agent/AgentContext'
import type { AgentRunConfig } from '~/types/agent/AgentRunConfig'
import { AgentRunState } from '~/types/agent/AgentRunState'
import type { Conversation } from '~/types/conversation'
import { type GraphQLToDoListUpdateData, ToDoStatus as GqlToDoStatus } from '~/generated/graphql'
import { ToDoStatus as LocalToDoStatus, type ToDo } from '~/types/todo'

const createMockAgentContext = (): AgentContext => {
  const conversation: Conversation = {
    id: 'agent-123',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const agentState = new AgentRunState('agent-123', conversation)
  agentState.todoList = [] // Explicitly initialize for tests
  const agentConfig: AgentRunConfig = {
    launchProfileId: 'lp-1',
    workspaceId: 'ws-1',
    llmModelIdentifier: 'test-model',
    autoExecuteTools: false,
    parseToolCalls: true,
    useXmlToolFormat: false,
  }
  return new AgentContext(agentConfig, agentState)
}

describe('todoListUpdateHandler', () => {
  let mockAgentContext: AgentContext

  beforeEach(() => {
    mockAgentContext = createMockAgentContext()
  })

  it('should update the todoList in agent state', () => {
    expect(mockAgentContext.state.todoList).toEqual([])

    const eventData: GraphQLToDoListUpdateData = {
      __typename: 'GraphQLToDoListUpdateData',
      todos: [
        { __typename: 'GraphQLToDo', todoId: '1', description: 'Test ToDo 1', status: GqlToDoStatus.Pending },
        { __typename: 'GraphQLToDo', todoId: '2', description: 'Test ToDo 2', status: GqlToDoStatus.Done },
      ],
    }

    handleToDoListUpdate(eventData, mockAgentContext)

    expect(mockAgentContext.state.todoList).toHaveLength(2)
    expect(mockAgentContext.state.todoList[0].todoId).toBe('1')
    expect(mockAgentContext.state.todoList[0].description).toBe('Test ToDo 1')
    expect(mockAgentContext.state.todoList[0].status).toBe(LocalToDoStatus.PENDING)
    expect(mockAgentContext.state.todoList[1].todoId).toBe('2')
    expect(mockAgentContext.state.todoList[1].status).toBe(LocalToDoStatus.DONE)
  })

  it('should handle an empty todos array by clearing the list', () => {
    mockAgentContext.state.todoList = [{ todoId: 'old', description: 'Old ToDo', status: LocalToDoStatus.PENDING } as ToDo]

    const eventData: GraphQLToDoListUpdateData = {
      __typename: 'GraphQLToDoListUpdateData',
      todos: [],
    }

    handleToDoListUpdate(eventData, mockAgentContext)

    expect(mockAgentContext.state.todoList).toEqual([])
  })

  it('should handle a null todos property by not changing the list', () => {
    const originalTodoList = [{ todoId: 'old', description: 'Old ToDo', status: LocalToDoStatus.PENDING } as ToDo]
    mockAgentContext.state.todoList = [...originalTodoList]

    const eventData: GraphQLToDoListUpdateData = {
      __typename: 'GraphQLToDoListUpdateData',
      todos: null,
    }

    handleToDoListUpdate(eventData, mockAgentContext)

    expect(mockAgentContext.state.todoList).toEqual(originalTodoList)
  })

  it('should log to console when updating', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const eventData: GraphQLToDoListUpdateData = {
      __typename: 'GraphQLToDoListUpdateData',
      todos: [{ __typename: 'GraphQLToDo', todoId: '1', description: 'Test ToDo 1', status: GqlToDoStatus.Pending }],
    }

    handleToDoListUpdate(eventData, mockAgentContext)
    
    expect(consoleLogSpy).toHaveBeenCalledWith(`Updated ToDo list for agent agent-123 with 1 items.`)
    
    consoleLogSpy.mockRestore()
  })
})
