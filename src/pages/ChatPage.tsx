import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useThesisStore } from "@/stores/thesisStore";
import { useKnowledgeStore } from "@/stores/knowledgeStore";
import { generateOnaResponse, evaluateSupervisorIntercept, type ThesisContextData } from "@/services/aiService";
import {
  Send,
  Lightbulb,
  Mail,
  BookOpen,
  Calendar,
  Sparkles,
  Info,
  MessagesSquare,
  User,
  Bell,
  Plus,
  Clock,
  ShieldAlert,
} from "lucide-react";
import type { ChatMessage } from "@/data/types";
import type { SupervisorMessage } from "@/stores/thesisStore";
import studentsData from "@/data/students.json";
import universitiesData from "@/data/universities.json";

// Ona's prompt suggestions based on thesis state
function getPromptSuggestions(thesisState: string): Array<{ text: string; icon: typeof Lightbulb; category: string }> {
  switch (thesisState) {
    case "exploring":
      return [
        { text: "Help me narrow down my thesis topic", icon: Lightbulb, category: "Planning" },
        { text: "What makes a good research question?", icon: BookOpen, category: "Research" },
        { text: "How do I approach a supervisor?", icon: Mail, category: "Communication" },
        { text: "Explain the thesis process at my university", icon: Info, category: "Orientation" },
      ];
    case "topic_selected":
      return [
        { text: "Draft a registration email to my supervisor", icon: Mail, category: "Communication" },
        { text: "What should my expose include?", icon: BookOpen, category: "Planning" },
        { text: "Help me formulate my research question", icon: Lightbulb, category: "Research" },
        { text: "What methodology fits my topic?", icon: BookOpen, category: "Research" },
      ];
    case "registered":
    case "planning":
      return [
        { text: "Review my research question for clarity", icon: Lightbulb, category: "Research" },
        { text: "Help me plan a realistic timeline", icon: Calendar, category: "Planning" },
        { text: "What sources should I start with?", icon: BookOpen, category: "Research" },
        { text: "Draft an email to request data access", icon: Mail, category: "Communication" },
      ];
    case "executing":
      return [
        { text: "How do I structure my literature review?", icon: BookOpen, category: "Writing" },
        { text: "I am stuck on my analysis, what should I try?", icon: Lightbulb, category: "Research" },
        { text: "Prepare me for my next supervisor meeting", icon: Mail, category: "Communication" },
        { text: "Help me document my methodology", icon: BookOpen, category: "Writing" },
      ];
    case "writing":
      return [
        { text: "Review my discussion section structure", icon: BookOpen, category: "Writing" },
        { text: "How do I write a strong conclusion?", icon: Lightbulb, category: "Writing" },
        { text: "Check my citation format", icon: BookOpen, category: "Writing" },
        { text: "Help me write the abstract", icon: BookOpen, category: "Writing" },
      ];
    default:
      return [
        { text: "What should I do next?", icon: Lightbulb, category: "General" },
      ];
  }
}

// We removed getOnaResponse completely as we now use real LLM integration!

export function ChatPage() {
  const { 
    thesisState, 
    thesisContext, 
    phases, 
    currentPhase, 
    selectedTopicId, 
    studentId, 
    supervisorMessages, 
    addSupervisorMessage,
    checkProgressHealth,
    requestMeeting,
    notifications,
    markNotificationRead,
    isOnaListening,
    setIsOnaListening,
    getOverallProgress,
  } = useThesisStore();
  
  const currentStudent = studentsData.find(s => s.id === studentId);
  const universityName = universitiesData.find(u => u.id === currentStudent?.universityId)?.name || "ETH Zurich";
  const { getAllRelevantItems } = useKnowledgeStore();
  const kbItems = getAllRelevantItems(selectedTopicId ?? undefined);
  
  // Create static AI context data structure from the current states
  const contextData: ThesisContextData = {
    studentName: currentStudent ? `${currentStudent.firstName} ${currentStudent.lastName}` : "Student",
    topic: thesisContext.topicArea || "Undeclared Topic",
    university: universityName,
    degree: currentStudent?.degree || "M.Sc.",
    progress: getOverallProgress(),
    currentPhase: phases[currentPhase]?.title || "Orientation",
    kbItems: kbItems.map(k => ({ title: k.title, content: k.content }))
  };

  // Support tab param from sidebar "Supervisor Chat" link
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "supervisor" ? "supervisor" as const : "ona" as const;
  const [activeTab, setActiveTab] = useState<"ona" | "supervisor">(initialTab);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // AI Interceptor states for Supervisor Chat
  const [interceptedMessage, setInterceptedMessage] = useState<{ studentText: string; onaResponse: string } | null>(null);
  const [isIntercepting, setIsIntercepting] = useState(false);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Disabling automatic health check as per user request
  // useEffect(() => {
  //   checkProgressHealth();
  // }, []);

  // Handle prefilled query from Journey Ona quicklinks
  const prefillProcessed = useRef(false);
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && activeTab === "ona" && !prefillProcessed.current) {
      prefillProcessed.current = true;
      setSearchParams({});
      sendMessage(decodeURIComponent(q));
    }
  }, [searchParams]);

  const suggestions = getPromptSuggestions(thesisState);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const mappedHistory = messages.map(m => ({ role: m.role, text: m.content }));
    const response = await generateOnaResponse(contextData, mappedHistory, text);
    
    const assistantMsg: ChatMessage = { id: `msg-${Date.now() + 1}`, role: "assistant", content: response, timestamp: Date.now() + 1 };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsTyping(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || isIntercepting) return;
    const currentInput = input;
    setInput("");
    
    if (activeTab === "ona") {
      await sendMessage(currentInput);
    } else {
      // If AI interceptor is on, we evaluate the text first
      if (isOnaListening && !interceptedMessage) {
        setIsIntercepting(true);
        const intercept = await evaluateSupervisorIntercept(contextData, currentInput);
        setIsIntercepting(false);
        
        if (intercept.knows_answer && intercept.response) {
          // Temporarily showcase Ona's capability to answer this
          setInterceptedMessage({ studentText: currentInput, onaResponse: intercept.response });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          return;
        }
      }
      
      // Send directly if not listening, or if LLM doesn't know the answer
      addSupervisorMessage(currentInput, "student");
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  return (
    <div className="flex h-full">
      {/* Chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-background px-6 py-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
              activeTab === "ona" ? "bg-ai text-white" : "bg-primary text-primary-foreground"
            }`}>
              {activeTab === "ona" ? <Sparkles className="h-4 w-4" /> : <MessagesSquare className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="ds-label text-foreground">{activeTab === "ona" ? "Ona" : "Supervisor Chat"}</h2>
              <p className="ds-caption text-muted-foreground flex items-center gap-1.5">
                {activeTab === "ona" ? "Your thesis companion" : "Prof. Dr. Sibylle Hechberger"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg border border-border bg-secondary/30 p-1">
              <button
                onClick={() => setActiveTab("ona")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 ds-small transition-colors duration-200 ${
                  activeTab === "ona" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Sparkles className="h-4 w-4" /> Ona
              </button>
              <button
                onClick={() => setActiveTab("supervisor")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 ds-small transition-colors duration-200 ${
                  activeTab === "supervisor" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <MessagesSquare className="h-4 w-4" /> Supervisor
              </button>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 border-2 border-background" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-border bg-secondary/30 flex items-center justify-between">
                  <span className="ds-label text-sm">Notifications</span>
                  {notifications.length > 0 && (
                    <button className="ds-caption text-primary hover:underline">Clear all</button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="ds-small text-muted-foreground text-center py-6">No new notifications</p>
                  ) : (
                    notifications.map(n => (
                      <button 
                        key={n.id} 
                        onClick={() => markNotificationRead(n.id)}
                        className={`w-full text-left p-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                      >
                        <p className={`ds-small ${!n.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{n.content}</p>
                        <p className="ds-caption text-muted-foreground mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === "ona" ? (
            messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ai mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="ds-title-sm text-foreground mb-1">Ona, your thesis companion</h2>
              <p className="ds-small text-muted-foreground mb-6">
                I know your thesis context, your supervisor's guidelines, and where you are in your journey.
                Ask me anything.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="flex items-start gap-2.5 rounded-lg border border-border p-3 text-left transition-all duration-200 hover:shadow-lg hover:border-muted-foreground/30"
                  >
                    <s.icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="ds-small text-foreground">{s.text}</p>
                      <p className="ds-caption text-muted-foreground">{s.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="h-3 w-3 text-ai-solid" />
                        <span className="ds-badge text-ai-solid">Ona</span>
                      </div>
                    )}
                    <div className="ds-small whitespace-pre-line">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-muted-foreground rounded-lg px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="h-3 w-3 text-ai-solid" />
                      <span className="ds-badge text-ai-solid">Ona</span>
                    </div>
                    <span className="ds-small">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* EU AI Act compliance banner */}
              <div className="flex items-start justify-between rounded-lg border border-ai/20 bg-ai/5 p-4 mb-4">
                <div className="flex gap-3">
                  <ShieldAlert className="h-5 w-5 text-ai flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="ds-label text-foreground">EU AI Act Notice</h4>
                    <p className="ds-caption text-muted-foreground mt-1">
                      To help save your supervisor time, the "Ona Support Agent" listens to this channel and automatically intercepts questions that can be answered by the central Knowledge Base.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <span className={`ds-caption ${isOnaListening ? "text-ai font-medium" : "text-muted-foreground"}`}>
                    {isOnaListening ? "Listening" : "Disabled"}
                  </span>
                  <button 
                    onClick={() => setIsOnaListening(!isOnaListening)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      isOnaListening ? "bg-ai" : "bg-border"
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isOnaListening ? "translate-x-4.5" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              </div>
              
              {supervisorMessages.map((msg: SupervisorMessage) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderRole === "student" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-start gap-3 max-w-[85%] ${msg.senderRole === "student" ? "flex-row-reverse" : ""}`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 mt-0.5 ${
                      msg.senderRole === "student" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}>
                      {msg.senderRole === "student" ? <User className="h-4 w-4" /> : <MessagesSquare className="h-4 w-4" />}
                    </div>
                    <div className={`flex flex-col ${msg.senderRole === "student" ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="ds-caption text-foreground">{msg.senderRole === "student" ? "You" : "Prof. Hechberger"}</span>
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-2.5 ds-small shadow-sm ${
                          msg.senderRole === "student"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted border border-border text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Intercepting / Loading State */}
              {isIntercepting && (
                <div className="flex justify-start">
                  <div className="bg-ai/10 text-muted-foreground rounded-lg px-4 py-3 border border-ai/20 w-fit">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="h-3 w-3 text-ai" />
                      <span className="ds-badge text-ai">Ona Interceptor</span>
                    </div>
                    <span className="ds-small">Checking Knowledge Base before notifying supervisor...</span>
                  </div>
                </div>
              )}
              
              {/* Intercepted Message Overlay */}
              {interceptedMessage && (
                <div className="flex justify-start mt-6">
                  <div className="bg-card border border-ai/30 shadow-sm rounded-xl px-5 py-4 w-full max-w-xl">
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                      <Sparkles className="h-4 w-4 text-ai" />
                      <span className="ds-label text-foreground">Ona Intercepted Your Message</span>
                      <span className="ds-badge bg-primary/10 text-primary ml-auto flex items-center gap-1"><BookOpen className="h-3 w-3" /> Answer in Knowledge Base</span>
                    </div>
                    <p className="ds-caption text-muted-foreground italic mb-3">"{interceptedMessage.studentText}"</p>
                    <p className="ds-small text-foreground whitespace-pre-wrap">{interceptedMessage.onaResponse}</p>
                    
                    <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-border">
                      <button
                        onClick={() => {
                          addSupervisorMessage(interceptedMessage.studentText, "student");
                          setInterceptedMessage(null);
                        }}
                        className="ds-small font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Send to supervisor anyway
                      </button>
                      <button
                        onClick={() => {
                          // Add both the student's question and Ona's answer to the store
                          addSupervisorMessage(interceptedMessage.studentText, "student");
                          
                          // We manually add Ona's response as a 'supervisor' message (acting as an assistant) 
                          // to ensure it persists in the supervisor chat log
                          const assistantMsg: SupervisorMessage = {
                            id: `ona-${Date.now()}`,
                            senderId: "ona-assistant",
                            senderRole: "supervisor", // Using supervisor role so it shows up on the left
                            text: `[Ona AI Answer]: ${interceptedMessage.onaResponse}`,
                            timestamp: Date.now() + 1
                          };
                          
                          // We need a way to add this to the store. 
                          // Currently addSupervisorMessage only takes (text, role). 
                          // I'll use addSupervisorMessage with the prefix for now, 
                          // but I'll make sure it's clear it's from Ona.
                          addSupervisorMessage(`Ona: ${interceptedMessage.onaResponse}`, "supervisor");
                          
                          setInterceptedMessage(null);
                        }}
                        className="rounded-lg bg-ai px-4 py-2 ds-label text-white hover:opacity-90 transition-opacity"
                      >
                        Accept Answer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
              {activeTab === "supervisor" && (
                <div className="flex justify-center mt-4">
                  <button 
                    onClick={() => {
                      const topic = prompt("Enter meeting topic (e.g. Discuss Research Question):");
                      if (topic) requestMeeting(studentId, "Next available slot", topic);
                    }}
                    className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 ds-caption text-muted-foreground hover:border-primary hover:text-primary transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> Request Sync Meeting
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border px-6 py-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-2xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeTab === "ona" ? "Ask about your thesis..." : "Message your supervisor..."}
              className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 ds-small text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!input.trim() || (activeTab === "ona" && isTyping)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors duration-150 hover:opacity-90 disabled:opacity-30 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="ds-caption text-muted-foreground text-center mt-1.5">
            {activeTab === "ona" 
              ? "Ona gives suggestions based on your supervisor's guidelines. Academic decisions stay with your professor."
              : "Messages are sent directly to your supervisor's dashboard."}
          </p>
        </div>
      </div>

      {/* Context panel */}
      <div className="hidden w-72 flex-col border-l border-border bg-card overflow-y-auto xl:flex">
        <div className="p-4 border-b border-border">
          <h3 className="ds-label text-foreground">Thesis context</h3>
          <p className="ds-caption text-muted-foreground">What Ona knows about you</p>
        </div>
        <div className="p-4 space-y-3">
          <ContextEntry label="Status" value={thesisState.replace(/_/g, " ")} />
          <ContextEntry label="Degree" value={currentStudent ? currentStudent.degree : "M.Sc."} />
          <ContextEntry label="University" value={universityName} />
          {thesisContext.topicArea && <ContextEntry label="Topic area" value={thesisContext.topicArea} />}
          {thesisContext.researchQuestion && <ContextEntry label="Research question" value={thesisContext.researchQuestion} />}
          {thesisContext.methodology && <ContextEntry label="Methodology" value={thesisContext.methodology} />}
          {thesisContext.supervisor && <ContextEntry label="Supervisor" value={thesisContext.supervisor} />}
          {currentStudent?.skills?.length && <ContextEntry label="Skills" value={currentStudent.skills.join(", ")} />}
          {thesisState !== "exploring" && (
            <ContextEntry label="Phase" value={`${currentPhase + 1}. ${phases[currentPhase]?.shortTitle}`} />
          )}
        </div>

        {/* KB items available */}
        {kbItems.length > 0 && (
          <div className="border-t border-border p-4">
            <h4 className="ds-badge text-ai-solid mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Knowledge base
            </h4>
            <div className="space-y-1.5">
              {kbItems.slice(0, 6).map((item) => (
                <div key={item.id} className="ds-caption text-muted-foreground flex items-start gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40 flex-shrink-0 mt-1.5" />
                  {item.title}
                </div>
              ))}
              {kbItems.length > 6 && (
                <p className="ds-caption text-muted-foreground">+ {kbItems.length - 6} more items</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContextEntry({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="ds-caption text-muted-foreground">{label}</p>
      <p className="ds-small text-foreground capitalize">{value}</p>
    </div>
  );
}
