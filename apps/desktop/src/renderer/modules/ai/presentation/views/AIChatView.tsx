/**
 * AIChatView
 *
 * AI 对话页面
 * Story-009: AI Module UI
 */

import { useEffect, useRef } from 'react';
import { useAI } from '../hooks/useAI';
import { ChatMessage, ChatInput, ConversationList } from '../components';

export function AIChatView() {
  const {
    conversations,
    currentConversation,
    messages,
    loading,
    streaming,
    error,
    loadConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    clearMessages,
    clearError,
  } = useAI();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle new conversation
  const handleNewConversation = async () => {
    clearMessages();
    clearError();
  };

  // Handle send message
  const handleSend = async (content: string) => {
    await sendMessage(content);
  };

  return (
    <div className="h-full flex bg-background">
      {/* Sidebar - Conversation List */}
      <ConversationList
        conversations={conversations}
        currentId={currentConversation?.id}
        onSelect={selectConversation}
        onDelete={deleteConversation}
        onNewConversation={handleNewConversation}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {currentConversation?.title || 'AI 助手'}
            </h1>
            {currentConversation && (
              <p className="text-sm text-muted-foreground">
                {currentConversation.messageCount} 条消息 ·{' '}
                {currentConversation.isClosed ? '已关闭' : '活跃中'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadConversations()}
              disabled={loading}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title="刷新"
            >
              🔄
            </button>
            {currentConversation && (
              <button
                onClick={() => createConversation()}
                className="py-2 px-4 border rounded-md hover:bg-muted transition-colors"
              >
                新对话
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-xl font-semibold mb-2">开始对话</h2>
              <p className="text-muted-foreground max-w-md">
                我是你的 AI 助手，可以帮助你规划目标、安排日程、分解任务。
                有什么我可以帮助你的吗？
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {[
                  '帮我制定一个学习计划',
                  '如何提高工作效率？',
                  '帮我分解这个目标',
                  '建议一些今日任务',
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(suggestion)}
                    className="px-4 py-2 border rounded-full text-sm hover:bg-muted transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                  isStreaming={message.isStreaming}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}

          {/* Loading indicator */}
          {loading && messages.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <span className="animate-spin text-2xl">⏳</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInput
          onSend={handleSend}
          disabled={streaming || currentConversation?.isClosed}
          placeholder={
            currentConversation?.isClosed
              ? '此对话已关闭'
              : streaming
                ? '正在回复中...'
                : '输入消息...'
          }
        />
      </div>
    </div>
  );
}

export default AIChatView;
