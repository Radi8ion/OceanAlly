import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Bot, User, Mic, MicOff, Volume2, VolumeX, Upload } from "lucide-react";

// Define the structure for a chat message
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  audioUrl?: string;
  isError?: boolean;
}

export const ChatbotOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I am OceanAlly. How can I help you with ocean hazards today?",
      sender: 'bot',
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false); // Prevent duplicate requests

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Initialize MediaRecorder
  useEffect(() => {
    const initMediaRecorder = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Media Devices API not supported.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);

        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setAudioChunks(prev => [...prev, event.data]);
          }
        };

        recorder.onstop = async () => {
          setAudioChunks(currentChunks => {
            if (currentChunks.length > 0) {
              const audioBlob = new Blob(currentChunks, { type: 'audio/wav' });
              handleAudioRecording(audioBlob);
            }
            return []; // Clear chunks after processing
          });
        };

        setMediaRecorder(recorder);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Microphone access denied. Please allow microphone access in your browser settings to use voice input.');
      }
    };

    initMediaRecorder();

    // Cleanup function to stop tracks when the component unmounts
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleAudioRecording = async (audioBlob: Blob) => {
    // Prevent duplicate processing
    if (isProcessingAudio) {
      console.log('Audio already being processed, ignoring duplicate call');
      return;
    }
    
    setIsProcessingAudio(true);
    setIsLoading(true);
    
    const userMessageId = Date.now() + Math.random(); // Ensure unique ID
    const userMessage: Message = {
      id: userMessageId,
      text: "🎤 Processing voice message...",
      sender: 'user',
    };
    setMessages(prev => [...prev, userMessage]);

    let processedSuccessfully = false;

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');

      console.log('Sending audio to server...');
      const response = await fetch('http://localhost:5001/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Server response:', data);

      // Validate response data
      if (!data.query || !data.answer) {
        throw new Error("Invalid response from server");
      }

      // Update the user message with the actual transcript
      setMessages(prev => prev.map(msg => 
        msg.id === userMessageId ? { ...msg, text: `🎤: "${data.query}"` } : msg
      ));

      // Add bot response - Use setTimeout to ensure proper state update
      setTimeout(() => {
        const botMessage: Message = {
          id: Date.now() + Math.random() + 1000, // Ensure unique ID
          text: data.answer,
          sender: 'bot',
          audioUrl: data.audio ? `http://localhost:5001/audio/${data.audio.split('/').pop()}` : undefined,
        };
        
        setMessages(prev => {
          // Check if this exact message already exists to prevent duplicates
          const messageExists = prev.some(msg => msg.text === botMessage.text && msg.sender === 'bot' && msg.id !== botMessage.id);
          if (messageExists) {
            console.log('Duplicate bot message detected, not adding');
            return prev;
          }
          return [...prev, botMessage];
        });
        
        if (botMessage.audioUrl && isAudioEnabled) {
          setTimeout(() => playAudio(botMessage.audioUrl!), 500);
        }
      }, 100);

      processedSuccessfully = true;

    } catch (error) {
      console.error('Error processing audio recording:', error);
      
      // Only add error message if processing wasn't successful
      if (!processedSuccessfully) {
        // Remove the temporary user message
        setMessages(prev => prev.filter(msg => msg.id !== userMessageId));
        
        const errorMessage: Message = {
          id: Date.now() + Math.random(),
          text: "Sorry, I couldn't process your voice message. Please try again or check your microphone.",
          sender: 'bot',
          isError: true,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setIsProcessingAudio(false);
    }
  };
  
  const startListening = () => {
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
      setAudioChunks([]); // Clear previous chunks
      mediaRecorder.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsListening(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size too large. Please upload a file smaller than 10MB.');
      return;
    }
    
    setIsLoading(true);
    const userMessageId = Date.now();
    const userMessage: Message = {
      id: userMessageId,
      text: `🎵 Audio file uploaded: ${file.name}`,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5001/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      // Update the user message with the transcript
      setMessages(prev => prev.map(msg => 
        msg.id === userMessageId ? { ...msg, text: `🎵: "${data.query}"` } : msg
      ));

      // Only add bot response if we got a valid answer
      if (data.answer && data.answer.trim()) {
        const botMessage: Message = {
          id: Date.now() + 1,
          text: data.answer,
          sender: 'bot',
          audioUrl: data.audio ? `http://localhost:5001/audio/${data.audio.split('/').pop()}` : undefined,
        };
        setMessages(prev => [...prev, botMessage]);

        if (botMessage.audioUrl && isAudioEnabled) {
          setTimeout(() => playAudio(botMessage.audioUrl!), 500);
        }
      } else {
        throw new Error("No valid response from server");
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      
      // Remove the temporary user message and add error message
      setMessages(prev => prev.filter(msg => msg.id !== userMessageId));
      
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "Sorry, I couldn't process that audio file. Please try again with a different file.",
        sender: 'bot',
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current && isAudioEnabled) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: trimmedInput,
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: Date.now() + 1,
        text: data.response || data.answer || "I'm sorry, I couldn't process that.",
        sender: 'bot',
        audioUrl: data.audio ? `http://localhost:5001/audio/${data.audio.split('/').pop()}` : undefined,
      };
      setMessages((prev) => [...prev, botMessage]);

      if (botMessage.audioUrl && isAudioEnabled) {
        setTimeout(() => playAudio(botMessage.audioUrl!), 500);
      }
    } catch (error) {
      console.error("Failed to fetch chat response:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting. Please check if the server is running on localhost:5001.",
        sender: 'bot',
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I am OceanAlly. How can I help you with ocean hazards today?",
        sender: 'bot',
      },
    ]);
  };

  return (
    <>
      <audio ref={audioRef} preload="none" />
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.5 }}>
          <Button onClick={toggleChat} className="rounded-full w-16 h-16 bg-blue-600 hover:bg-blue-700 shadow-lg" aria-label={isOpen ? "Close chat" : "Open chat"}>
            {isOpen ? <X size={30} /> : <MessageCircle size={30} />}
          </Button>
        </motion.div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }} className="fixed bottom-24 right-6 z-50">
            <Card className="w-80 sm:w-96 h-[32rem] shadow-xl border-slate-300 flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="text-blue-600"/>
                    OceanAlly
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setIsAudioEnabled(!isAudioEnabled)} className="h-8 w-8 p-0" title={isAudioEnabled ? "Disable audio" : "Enable audio"}>
                      {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearChat} className="h-8 w-8 p-0 text-xs" title="Clear chat">
                      🗑️
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>Your AI assistant for ocean safety & disasters</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.sender === 'bot' && <Bot className="w-6 h-6 text-slate-400 flex-shrink-0" />}
                    <div className="flex flex-col max-w-[80%]">
                      <div className={`rounded-lg px-3 py-2 text-sm ${
                        message.sender === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : message.isError 
                            ? 'bg-red-100 text-red-800 rounded-bl-none border border-red-200'
                            : 'bg-slate-200 text-slate-800 rounded-bl-none'
                      }`}>
                        {message.text}
                      </div>
                      {message.audioUrl && message.sender === 'bot' && !message.isError && (
                        <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs self-start" onClick={() => playAudio(message.audioUrl!)} title="Play audio response">
                          🔊 Play
                        </Button>
                      )}
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
              <CardFooter className="border-t p-4 flex flex-col items-start">
                <div className="flex w-full items-center space-x-2">
                  <Input type="text" placeholder="Ask about hazards..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} disabled={isLoading} className="flex-1"/>
                  <input type="file" ref={fileInputRef} accept="audio/*" onChange={handleFileUpload} className="hidden"/>
                  <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading} variant="outline" className="h-10 w-10 p-0" title="Upload audio file">
                    <Upload size={18} />
                  </Button>
                  <Button type="button" onClick={isListening ? stopListening : startListening} disabled={isLoading} variant={isListening ? "destructive" : "outline"} className="h-10 w-10 p-0" title={isListening ? "Stop recording" : "Start recording"}>
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </Button>
                  <Button type="submit" onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className="h-10 w-10 p-0" title="Send message">
                    <Send size={18} />
                  </Button>
                </div>
                {isListening && (
                  <div className="w-full mt-2 text-center text-sm text-red-600 flex items-center justify-center gap-2">
                     <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                     Recording...
                  </div>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotOverlay;