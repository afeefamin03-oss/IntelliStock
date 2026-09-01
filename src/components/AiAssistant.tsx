import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, AlertCircle, HelpCircle, Loader, ArrowRight } from "lucide-react";
import { ChatMessage } from "../types";

interface AiAssistantProps {
  codeContext: string;
}

const tutorPrompts = [
  {
    label: "Explain OOP Encapsulation",
    prompt: "Can you explain how Encapsulation is implemented in our Product.java class and why it is crucial for a secure system?"
  },
  {
    label: "Explain Inheritance & Polymorphism",
    prompt: "Show how PerishableProduct.java inherits from Product.java and how method overriding demonstrates Polymorphism."
  },
  {
    label: "DB Interfaces & Abstraction",
    prompt: "How does our code use the DBOperations.java interface and DatabaseHelper.java to achieve separation of concerns and abstraction?"
  },
  {
    label: "Secure Password Hashing",
    prompt: "Explain how our Java system implements secure password encryption with SHA-256 secure hashing inside DatabaseHelper.java."
  },
  {
    label: "How JDBC Prevents SQL Injection",
    prompt: "How do PreparedStatements in DatabaseHelper.java protect against SQL Injection during search and insert operations?"
  }
];

export default function AiAssistant({ codeContext }: AiAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hello! I am your Professor Devi Kannan AI Tutor. I am here to help you review, optimize, and master the Object-Oriented Design, Swing event dispatch structures, and JDBC persistence logic implemented in your hackathon codebase.\n\nClick on any core query shortcut below, or type your own question to explore our Java architecture!",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState("");
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages are added
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim() || isLoading) return;

    setErrorStatus("");
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      text: msgText.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: msgText.trim(),
          codeContext: codeContext
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred during communication.");
      }

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: data.text,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Failed to reach the AI explanation service.");
      
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: `⚠️ **Service Access Interrupted**\n\nI was unable to process this request. \n\n*Reason:* ${err.message || "Network Timeout"}\n\n*Solution:* Ensure your **GEMINI_API_KEY** is correctly declared inside the **Settings > Secrets** panel in AI Studio. The server requires this key to host server-side model calls.`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#161512] text-stone-200 font-sans">
      
      {/* Assistant Toolbar */}
      <div className="p-3.5 bg-stone-950/20 border-b border-stone-850 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-[#c5a880]" />
          <div>
            <h3 className="text-xs font-serif font-bold tracking-widest text-stone-300 uppercase">
              GEMINI OOP & JAVA CONFLICT TUTOR
            </h3>
            <p className="text-[10px] text-stone-400">
              Engage with our custom AI professor to dissect your Java Swing structures, OOP compliance, and SQL query layers.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 md:flex-row">
        
        {/* Left column - Chat History (Main Panel) */}
        <div className="flex-1 flex flex-col min-h-0 bg-stone-900/10">
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isAssistant = m.role === "model";
              return (
                <div 
                  key={m.id}
                  className={`flex gap-3 max-w-3xl ${isAssistant ? "" : "ml-auto flex-row-reverse"}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-serif text-xs font-semibold ${
                    isAssistant ? "bg-stone-950 border border-stone-800 text-[#c5a880]" : "bg-[#c5a880] text-stone-950 italic"
                  }`}>
                    {isAssistant ? "🎓" : "ME"}
                  </div>

                  {/* Message Bubble */}
                  <div className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                    isAssistant 
                      ? "bg-stone-950/40 text-stone-300 border border-stone-850/60 shadow-sm" 
                      : "bg-[#c5a880]/15 text-stone-200 border border-[#c5a880]/30 shadow-sm"
                  }`}>
                    {m.text}
                    <span className="block text-[9px] text-stone-500 font-mono text-right mt-1.5 select-none">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 max-w-2xl">
                <div className="w-8 h-8 rounded-full bg-stone-950 border border-stone-800 text-[#c5a880] shrink-0 flex items-center justify-center font-mono text-xs">
                  🎓
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/40 border border-stone-850 text-stone-400 text-xs flex items-center gap-2">
                  <Loader className="w-3.5 h-3.5 animate-spin text-[#c5a880]" />
                  <span className="font-mono text-[11px] animate-pulse">Professor Kannan is reviewing the Java OOP models...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Form message input container */}
          <div className="p-3 border-t border-stone-850 bg-stone-950/30">
            {errorStatus && (
              <div className="mb-2 p-2 rounded-xl bg-red-950/20 text-red-400 text-[10px] border border-red-950/30 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorStatus}</span>
              </div>
            )}

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputMessage);
              }}
              className="flex items-center gap-2"
            >
              <input 
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
                placeholder="Ask about Encapsulation, Polymorphism, JDBC prepared statement logic..."
                className="flex-1 bg-stone-950/60 p-2.5 border border-stone-850 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-[#c5a880]"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="bg-[#c5a880] hover:bg-[#b3946b] disabled:bg-stone-800 text-stone-950 p-2.5 px-4 rounded-xl text-xs font-serif font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0 italic shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Ask Tutor
              </button>
            </form>
          </div>

        </div>

        {/* Right column - Preset Questions Sidebar */}
        <div className="w-full md:w-64 bg-stone-950/20 border-t md:border-t-0 md:border-l border-stone-850 p-3 flex flex-col min-h-0">
          <span className="text-[10px] uppercase tracking-wider font-serif font-bold text-stone-400 mb-2 flex items-center gap-1 px-1">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
            OOP Concept Challenges
          </span>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {tutorPrompts.map((p) => (
              <button
                key={p.label}
                onClick={() => handleSendMessage(p.prompt)}
                disabled={isLoading}
                className="w-full text-left p-3 rounded-xl bg-stone-900/40 hover:bg-stone-900/80 border border-stone-850/60 text-xs transition-all hover:border-[#c5a880]/50 flex flex-col gap-1 cursor-pointer group"
              >
                <div className="text-[#c5a880] font-bold font-serif text-[10px] group-hover:text-[#d9be96] tracking-wide">
                  {p.label}
                </div>
                <div className="text-stone-400 text-[10px] line-clamp-2 leading-relaxed font-sans font-medium group-hover:text-stone-300">
                  {p.prompt}
                </div>
                <div className="text-[9px] text-[#c5a880]/70 font-serif mt-0.5 flex items-center gap-0.5 self-end group-hover:text-[#c5a880] italic">
                  Ask Tutor
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-stone-950/40 rounded-xl border border-stone-850 text-[10px] text-stone-400 leading-relaxed flex items-start gap-1.5 font-sans">
            <HelpCircle className="w-3.5 h-3.5 shrink-0 text-[#c5a880] mt-0.5" />
            <div>
              <strong className="font-serif text-[#c5a880]">Professor Devi Kannan:</strong> The evaluator tests your capability to clearly articulate OOP concepts. Select the questions above to prepare!
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
