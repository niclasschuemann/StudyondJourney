import { useThesisStore } from "@/stores/thesisStore";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Route,
  MessageCircle,
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  HelpCircle,
  Layout,
  FolderOpen,
  Briefcase,
  GraduationCap,
  X,
  Sparkles,
  PartyPopper,
  Send,
  Loader2,
} from "lucide-react";
import { useKnowledgeStore, type KBCategory, type KBItem } from "@/stores/knowledgeStore";
import { TopicDetailSlideOver } from "@/components/topics/TopicDetailSlideOver";
import { getCompanyName, getFieldName, getTopicById } from "@/utils/topicUtils";
import studyPrograms from "@/data/study-programs.json";
import topics from "@/data/topics.json";
import type { Topic } from "@/data/types";

const typedTopics = topics as Topic[];

const categoryIcons: Record<KBCategory, any> = {
  requirements: FileText,
  faq: HelpCircle,
  guidelines: BookOpen,
  templates: Layout,
  resources: FolderOpen,
};

// Quiz-based topic matching
function getQuizMatchedTopics(quizAnswers: string[]): Topic[] {
  // Filter topics by student's fields, then take top 3
  const matched = typedTopics
    .filter((t) => t.fieldIds.some((f) => ["field-01", "field-03"].includes(f)))
    .slice(0, 3);
  return matched;
}

export function DashboardPage() {
  const { phases, currentPhase, thesisState, selectedTopicId, applicationMessage, getOverallProgress, getPhaseProgress, getNextAction, studentName, degree, applyForTopic } = useThesisStore();
  const navigate = useNavigate();
  const progress = getOverallProgress();
  const nextAction = getNextAction();
  const currentPhaseData = phases[currentPhase];
  const selectedTopic = selectedTopicId ? getTopicById(selectedTopicId) : null;
  const selectedTopicCompany = selectedTopic ? getCompanyName(selectedTopic.companyId) : null;
  const { items: allKbItems } = useKnowledgeStore();
  const [selectedKbItem, setSelectedKbItem] = useState<KBItem | null>(null);
  const [detailTopicId, setDetailTopicId] = useState<string | null>(null);

  // Magic Discovery Quiz state
  const [quizActive, setQuizActive] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>(["", "", ""]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  // Derive the student's study program name
  const studentProgram = studyPrograms.find(p => p.id === "program-01");
  const programName = studentProgram ? studentProgram.name : "Computer Science";

  const quizQuestions = [
    {
      prompt: `Based on your profile, you studied ${programName}. What was the most interesting part of your studies?`,
      placeholder: "e.g. Machine learning, distributed systems, data engineering...",
    },
    {
      prompt: `What specifically excited you about "${quizAnswers[0] || "this topic"}"?`,
      placeholder: "e.g. Building real-time prediction systems, optimizing neural architectures...",
    },
    {
      prompt: `Would you prefer a quantitative or qualitative research approach?`,
      placeholder: "",
      choices: ["Quantitative — data-driven, experiments, metrics", "Qualitative — interviews, case studies, theory"],
    },
  ];

  const handleQuizNext = () => {
    if (quizStep < 2) {
      setQuizStep(quizStep + 1);
    } else {
      // Simulate AI processing
      setQuizLoading(true);
      setTimeout(() => {
        setQuizLoading(false);
        setQuizComplete(true);
      }, 1500);
    }
  };

  const recommendedTopics = getQuizMatchedTopics(quizAnswers);

  return (
    <div className="scroll-area">
      <div className="scroll-area-content max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="ds-title-lg text-foreground">Welcome back, {studentName.split(" ")[0]}</h1>
          <p className="mt-1 ds-body text-muted-foreground">
            {thesisState === "exploring"
              ? "Find the right thesis topic to get started."
              : thesisState === "application_pending"
                ? "Your application has been sent. The supervisor will review it shortly."
                : thesisState === "topic_selected"
                  ? "Your thesis topic has been approved!"
                  : thesisState === "submitted"
                    ? "Your thesis has been submitted. Congratulations."
                    : `Phase ${currentPhase + 1}: ${currentPhaseData?.shortTitle}`
            }
          </p>
        </div>

        {/* ===== MAGIC DISCOVERY QUIZ (only when exploring) ===== */}
        {thesisState === "exploring" && !quizActive && !quizComplete && (
          <button
            onClick={() => setQuizActive(true)}
            className="group w-full mb-6 flex items-center justify-between rounded-2xl border border-ai/30 bg-ai/5 p-6 transition-all duration-300 hover:border-ai/60 hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ai text-white">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h2 className="ds-title-cards text-foreground group-hover:text-primary transition-colors duration-150">Find your thesis topic</h2>
                <p className="ds-small text-muted-foreground mt-0.5">Answer 3 quick questions and we'll match you with the perfect topic</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-150 flex-shrink-0" />
          </button>
        )}

        {/* Quiz Active */}
        {thesisState === "exploring" && quizActive && !quizComplete && (
          <div className="mb-6 rounded-2xl border border-ai/30 bg-card overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-border">
              <div
                className="h-full bg-ai transition-all duration-500 ease-out"
                style={{ width: `${((quizStep + 1) / 3) * 100}%` }}
              />
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-ai" />
                <span className="ds-label text-ai">Question {quizStep + 1} of 3</span>
              </div>

              <h3 className="ds-title-cards text-foreground mb-4">{quizQuestions[quizStep].prompt}</h3>

              {quizQuestions[quizStep].choices ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  {quizQuestions[quizStep].choices!.map((choice, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const newAnswers = [...quizAnswers];
                        newAnswers[quizStep] = choice;
                        setQuizAnswers(newAnswers);
                        handleQuizNext();
                      }}
                      className={`flex-1 rounded-xl border p-4 text-left transition-all duration-200 hover:shadow-md ${quizAnswers[quizStep] === choice
                          ? "border-ai bg-ai/10 text-foreground"
                          : "border-border hover:border-ai/50 text-foreground"
                        }`}
                    >
                      <span className="ds-body">{choice}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={quizAnswers[quizStep]}
                    onChange={(e) => {
                      const newAnswers = [...quizAnswers];
                      newAnswers[quizStep] = e.target.value;
                      setQuizAnswers(newAnswers);
                    }}
                    placeholder={quizQuestions[quizStep].placeholder}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 ds-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ai/50 transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && quizAnswers[quizStep].trim()) handleQuizNext();
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (quizStep > 0) setQuizStep(quizStep - 1);
                        else setQuizActive(false);
                      }}
                      className="ds-small text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleQuizNext}
                      disabled={!quizAnswers[quizStep].trim()}
                      className="flex items-center gap-2 rounded-xl bg-ai text-white px-5 py-2.5 ds-label transition-all duration-200 hover:opacity-90 disabled:opacity-30"
                    >
                      {quizStep === 2 ? "Find matches" : "Next"} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quiz Loading */}
        {thesisState === "exploring" && quizLoading && (
          <div className="mb-6 rounded-2xl border border-ai/30 bg-card p-8 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 text-ai animate-spin" />
            <p className="ds-body text-foreground">Analyzing your interests...</p>
            <p className="ds-caption text-muted-foreground">Matching you with the most relevant thesis topics</p>
          </div>
        )}

        {/* Quiz Complete → Recommended Topics */}
        {thesisState === "exploring" && quizComplete && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="ds-title-sm text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-ai" />
                  Your personalized matches
                </h3>
                <p className="ds-caption text-muted-foreground mt-0.5">Based on your interest in "{quizAnswers[0]}"</p>
              </div>
              <button
                onClick={() => { setQuizComplete(false); setQuizActive(false); setQuizStep(0); setQuizAnswers(["", "", ""]); }}
                className="ds-small text-muted-foreground hover:text-foreground transition-colors"
              >
                Retake quiz
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {recommendedTopics.map((topic) => {
                const company = getCompanyName(topic.companyId);
                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setDetailTopicId(topic.id);
                    }}
                    className="group rounded-2xl border border-border bg-card p-5 text-left transition-all duration-200 hover:border-primary/50 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-1.5 mb-3">
                      {company ? (
                        <>
                          <Briefcase className="h-3 w-3 text-muted-foreground" />
                          <span className="ds-badge text-muted-foreground">{company}</span>
                        </>
                      ) : (
                        <>
                          <GraduationCap className="h-3 w-3 text-muted-foreground" />
                          <span className="ds-badge text-muted-foreground">University</span>
                        </>
                      )}
                    </div>
                    <h4 className="ds-label text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-150">{topic.title}</h4>
                    <p className="ds-caption text-muted-foreground line-clamp-2 mb-3">{topic.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {topic.fieldIds.slice(0, 2).map((fid) => (
                        <span key={fid} className="ds-caption px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {getFieldName(fid)}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
            <Link
              to="/topics"
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-border py-3 ds-label text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all duration-200"
            >
              Browse all topics <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* ===== CELEBRATION BANNER (topic_selected) ===== */}
        {thesisState === "topic_selected" && selectedTopic && (
          <div className="mb-6 rounded-2xl border border-primary/50 bg-primary/5 p-6 relative overflow-hidden">
            <div className="absolute top-3 right-4 text-4xl opacity-20 select-none">🎉</div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground flex-shrink-0">
                <PartyPopper className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="ds-title-cards text-foreground mb-1">Your topic has been approved!</h2>
                <p className="ds-body text-foreground mb-1">{selectedTopic.title}</p>
                {selectedTopicCompany && (
                  <p className="ds-caption text-muted-foreground flex items-center gap-1.5 mb-4">
                    <Briefcase className="h-3 w-3" />{selectedTopicCompany}
                  </p>
                )}
                <Link
                  to="/journey"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 ds-label transition-all duration-200 hover:opacity-90 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                >
                  Start your journey <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ===== PREMIUM PENDING APPLICATION ===== */}
        {selectedTopic && thesisState === "application_pending" && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                <Send className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="ds-label text-primary mb-0.5">Application sent</p>
                <h3 className="ds-title-cards text-foreground">{selectedTopic.title}</h3>
                {selectedTopicCompany && (
                  <p className="ds-small text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3" />{selectedTopicCompany}
                  </p>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-0 mb-5">
              {[
                { label: "Sent", active: true, done: true },
                { label: "Under Review", active: true, done: false },
                { label: "Decision", active: false, done: false },
              ].map((step, i) => (
                <div key={i} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center w-full">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${step.done
                        ? "border-primary bg-primary text-primary-foreground"
                        : step.active
                          ? "border-primary bg-card text-primary"
                          : "border-border bg-secondary text-muted-foreground/40"
                      }`}>
                      {step.done ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : step.active ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                      ) : (
                        <span className="ds-badge">{i + 1}</span>
                      )}
                    </div>
                    <span className={`mt-1.5 ds-caption ${step.active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`h-0.5 flex-1 mx-1 mt-[-20px] ${step.done ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Student's message */}
            <div className="rounded-xl bg-secondary/50 border border-border p-4">
              <p className="ds-caption text-muted-foreground mb-2">Your message to the supervisor</p>
              <p className="ds-small text-foreground italic leading-relaxed">"{applicationMessage}"</p>
            </div>
            <p className="ds-caption text-muted-foreground mt-3 flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Supervisors typically respond within 2–5 business days
            </p>
          </div>
        )}

        {/* Next action card (hide when pending or exploring with quiz, or topic_selected since we have celebration) */}
        {thesisState !== "application_pending" && thesisState !== "exploring" && thesisState !== "topic_selected" && (
          <Link
            to={nextAction.href}
            className="group mb-6 flex items-center justify-between rounded-lg border border-border p-5 transition-all duration-200 hover:shadow-lg"
          >
            <div>
              <p className="ds-caption text-muted-foreground mb-1">Next step</p>
              <h2 className="ds-title-cards text-foreground group-hover:text-primary transition-colors duration-150">{nextAction.label}</h2>
              <p className="ds-small text-muted-foreground mt-0.5">{nextAction.description}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-150 flex-shrink-0" />
          </Link>
        )}

        {/* Progress overview (when registered) */}
        {thesisState !== "exploring" && thesisState !== "topic_selected" && thesisState !== "application_pending" && (
          <div className="mb-6 rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="ds-title-cards text-foreground">Thesis progress</h3>
                <p className="ds-small text-muted-foreground mt-0.5">
                  {selectedTopic ? selectedTopic.title : "M.Sc. Thesis"}
                </p>
              </div>
              <div className="text-right">
                <p className="ds-title-md text-foreground">{Math.round(progress)}%</p>
                <p className="ds-caption text-muted-foreground">complete</p>
              </div>
            </div>
            <div className="flex gap-2">
              {phases.map((phase, i) => {
                const p = getPhaseProgress(i);
                return (
                  <div key={phase.id} className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="ds-caption text-muted-foreground">{phase.shortTitle}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${p}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Phase Resources */}
        {thesisState !== "exploring" && thesisState !== "topic_selected" && thesisState !== "application_pending" && (() => {
          const relevantCategories = [
            ["requirements", "faq"],
            ["guidelines", "templates"],
            ["resources", "guidelines"],
            ["guidelines", "templates"],
            ["requirements", "resources"]
          ][currentPhase] || [];

          const phaseKbItems = allKbItems.filter(item =>
            (item.scope === "global" || item.topicId === selectedTopicId) &&
            relevantCategories.includes(item.category)
          ).slice(0, 2);

          if (phaseKbItems.length === 0) return null;

          return (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="ds-title-sm text-foreground flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  Recommended resources
                </h3>
                <Link to="/journey" className="ds-small text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors duration-150">
                  View all in journey <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {phaseKbItems.map(item => {
                  const CatIcon = categoryIcons[item.category];
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedKbItem(item)}
                      className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-muted-foreground/30 transition-colors text-left"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary flex-shrink-0">
                        <CatIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="ds-label text-foreground mb-1">{item.title}</p>
                        <p className="ds-caption text-muted-foreground line-clamp-2">{item.content}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Quick actions */}
        <div className="mb-6">
          <h3 className="ds-title-sm text-foreground mb-3">Quick actions</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {thesisState === "exploring" && (
              <Link
                to="/topics"
                className="group flex items-start gap-3 rounded-lg border border-border p-4 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary flex-shrink-0">
                  <Search className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <h4 className="ds-label text-foreground group-hover:text-primary transition-colors duration-150">Browse all topics</h4>
                  <p className="ds-caption text-muted-foreground">Explore the full catalog of thesis opportunities</p>
                </div>
              </Link>
            )}
            {thesisState !== "exploring" && thesisState !== "topic_selected" && thesisState !== "application_pending" && (
              <Link
                to="/journey"
                className="group flex items-start gap-3 rounded-lg border border-border p-4 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary flex-shrink-0">
                  <Route className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <h4 className="ds-label text-foreground group-hover:text-primary transition-colors duration-150">Continue journey</h4>
                  <p className="ds-caption text-muted-foreground">Pick up where you left off</p>
                </div>
              </Link>
            )}
            <Link
              to="/chat"
              className="group flex items-start gap-3 rounded-lg border border-ai p-4 transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ai flex-shrink-0">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="ds-label text-foreground group-hover:text-primary transition-colors duration-150">Ask Ona</h4>
                <p className="ds-caption text-muted-foreground">Get guidance on your thesis from your AI companion</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* KB Item Modal */}
      {selectedKbItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-transparent backdrop-blur-sm" onClick={() => setSelectedKbItem(null)} />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="ds-badge px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase tracking-wider">{selectedKbItem.category}</span>
                {selectedKbItem.scope === "topic" && (
                  <span className="ds-badge px-2 py-0.5 rounded-full bg-foreground/10 text-foreground">Topic-specific</span>
                )}
              </div>
              <button
                onClick={() => setSelectedKbItem(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 scroll-area-content">
              <h2 className="ds-title-sm text-foreground mb-4">{selectedKbItem.title}</h2>
              <div className="ds-body text-foreground whitespace-pre-wrap leading-relaxed">
                {selectedKbItem.content}
              </div>
            </div>
          </div>
        </div>
      )}
      <TopicDetailSlideOver
        topic={detailTopicId ? getTopicById(detailTopicId) : null}
        onClose={() => setDetailTopicId(null)}
      />
    </div>
  );
}
