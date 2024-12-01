mapToConversation(stepConversation) {
    return {
      id: stepConversation.stepConversationId,
      messages: stepConversation.messages.map(msg => {
        const cost = typeof msg.cost === 'number' ? msg.cost : 0;
        if (msg.role === 'user') {
          const userMessage: UserMessage = {
            type: 'user',
            text: msg.originalMessage || '',
            contextFilePaths: msg.contextPaths?.map(path => ({
              path,
              type: 'text',
            })) || [],
            timestamp: new Date(msg.timestamp),
            cost,  // Ensure cost is a number
          };
          return userMessage;
        } else {
          const aiMessage: AIMessage = {
            type: 'ai',
            text: msg.message || '',
            timestamp: new Date(msg.timestamp),
            cost,  // Ensure cost is a number
          };
          return aiMessage;
        }
      }),
      totalCost: typeof stepConversation.totalCost === 'number' ? stepConversation.totalCost : 0,
      createdAt: stepConversation.createdAt,
      updatedAt: stepConversation.createdAt,
    };
  }