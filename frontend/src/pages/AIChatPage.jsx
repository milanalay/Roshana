import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { MessageCircle, Send, Copy, ThumbsUp, ThumbsDown, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const suggestedQuestions = [
  "What is the antidote for warfarin overdose?",
  "Explain how beta blockers work",
  "What are signs of digoxin toxicity?",
  "Normal adult vital sign ranges?",
  "What is the Sepsis 6 bundle?",
  "EN vs RN scope of practice?",
];

const TypingIndicator = () => (
  <div className="chat-ai inline-flex items-center gap-1 px-4 py-3">
    <div className="typing-dot" />
    <div className="typing-dot" />
    <div className="typing-dot" />
  </div>
);

const Message = ({ message, onCopy, onFeedback }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={isUser ? "chat-user" : "chat-ai"}>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        {!isUser && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
            <button
              onClick={() => onCopy(message.content)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#00A99D] transition-colors"
              data-testid="copy-message-btn"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
            <button
              onClick={() => onFeedback(message.id, "up")}
              className="p-1 text-gray-400 hover:text-green-500 transition-colors"
              data-testid="thumbs-up-btn"
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => onFeedback(message.id, "down")}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              data-testid="thumbs-down-btn"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AIChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: uuidv4(),
      role: "user",
      content: messageText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        message: messageText,
        session_id: sessionId,
      });

      const aiMessage = {
        id: uuidv4(),
        role: "assistant",
        content: response.data.response,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Unable to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (question) => {
    sendMessage(question);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleFeedback = (messageId, type) => {
    toast.success(type === "up" ? "Thanks for the feedback!" : "We'll work on improving");
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen flex flex-col" data-testid="chat-page">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 px-5 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1B3A6B] rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1B3A6B] dark:text-white">
              NurseReady AI
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your nursing study assistant
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            AI responses are for study purposes only. Verify with Australian clinical guidelines before any clinical application.
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-5" ref={scrollRef}>
        <div className="py-4">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-[#00A99D]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1B3A6B] dark:text-white mb-2">
                Ask me anything about nursing
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Medications, procedures, assessments, Australian guidelines...
              </p>

              {/* Suggested Questions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestion(question)}
                    className="pill-button text-left"
                    data-testid={`suggestion-${index}`}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              onCopy={handleCopy}
              onFeedback={handleFeedback}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <TypingIndicator />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="sticky bottom-24 bg-white dark:bg-slate-900 px-5 py-4 border-t border-gray-100 dark:border-slate-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about medications, procedures..."
            className="flex-1 h-12 px-4 bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl text-base outline-none focus:ring-2 focus:ring-[#00A99D] dark:text-white"
            disabled={isLoading}
            data-testid="chat-input"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 bg-[#1B3A6B] hover:bg-[#152e55] rounded-2xl p-0"
            data-testid="send-btn"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
