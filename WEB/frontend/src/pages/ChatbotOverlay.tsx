import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Bot, User } from "lucide-react";

// Define the structure for a chat message
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

export const ChatbotOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I am Aqua Assistant. How can I help you with ocean hazards today?",
      sender: 'bot',
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    // Add user message to the chat immediately for good UX
    const userMessage: Message = {
      id: Date.now(),
      text: trimmedInput,
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // API call to your Flask backend
      const response = await fetch('http://localhost:5001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmedInput }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: Date.now() + 1,
        text: data.response || "I'm sorry, I couldn't process that.",
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("Failed to fetch chat response:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Bubble / Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Button
            onClick={toggleChat}
            className="rounded-full w-16 h-16 bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            {isOpen ? <X size={30} /> : <MessageCircle size={30} />}
          </Button>
        </motion.div>
      </div>

      {/* Chat Window Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <Card className="w-80 h-[28rem] shadow-xl border-slate-300 flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="text-blue-600"/>
                  Aqua Assistant
                </CardTitle>
                <CardDescription>Your AI guide to ocean safety</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'bot' && <Bot className="w-6 h-6 text-slate-400 flex-shrink-0" />}
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-slate-200 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      {message.text}
                    </div>
                     {message.sender === 'user' && <User className="w-6 h-6 text-slate-400 flex-shrink-0" />}
                  </div>
                ))}
                {isLoading && (
                   <div className="flex items-end gap-2 justify-start">
                      <Bot className="w-6 h-6 text-slate-400"/>
                      <div className="bg-slate-200 rounded-lg px-3 py-2 text-sm flex items-center gap-1">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-0"></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300"></span>
                      </div>
                   </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              <CardFooter className="border-t p-4">
                <div className="flex w-full items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Ask about hazards..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                  />
                  <Button type="submit" onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
                    <Send size={18} />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotOverlay;
