import { useState } from "react";
import { useThesisStore } from "@/stores/thesisStore";
import {
  X,
  Briefcase,
  ArrowRight,
  Wand2,
  Loader2,
  Send,
} from "lucide-react";
import { Topic } from "@/data/types";
import { getCompanyName, getMatchScore, getFieldName, getSupervisor } from "@/utils/topicUtils";

interface TopicDetailSlideOverProps {
  topic: Topic | null;
  onClose: () => void;
}

export function TopicDetailSlideOver({ topic, onClose }: TopicDetailSlideOverProps) {
  const { applyForTopic, clearTopic, selectedTopicId, skills, studentName } = useThesisStore();
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [aiWriting, setAiWriting] = useState(false);

  if (!topic) return null;

  const isSelected = selectedTopicId === topic.id;

  const handleClose = () => {
    setShowContactForm(false);
    setContactMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-transparent backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg bg-background border-l border-border shadow-2xl overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="ds-label text-muted-foreground uppercase tracking-wider">Topic details</span>
            <button onClick={handleClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-150">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <h2 className="ds-title-sm text-foreground mb-2 leading-tight">{topic.title}</h2>
          
          <div className="flex items-center gap-2 mb-6">
            {getCompanyName(topic.companyId) && (
              <span className="ds-badge text-muted-foreground flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
                <Briefcase className="h-3.5 w-3.5" />{getCompanyName(topic.companyId)}
              </span>
            )}
            <span className={`ds-badge px-2.5 py-1 rounded-full ${
              getMatchScore(topic) >= 85 ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            }`}>
              {getMatchScore(topic)}% match
            </span>
          </div>

          <p className="ds-body text-foreground mb-6 leading-relaxed">{topic.description}</p>

          <div className="space-y-6">
            {/* Fields */}
            <div>
              <p className="ds-label text-muted-foreground mb-2 flex items-center gap-2 uppercase tracking-widest text-[10px]">Fields</p>
              <div className="flex flex-wrap gap-1.5">
                {topic.fieldIds.map((fid) => (
                  <span key={fid} className="ds-badge px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">{getFieldName(fid)}</span>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <p className="ds-label text-muted-foreground mb-2 flex items-center gap-2 uppercase tracking-widest text-[10px]">Requirements</p>
              <div className="flex flex-wrap gap-1.5">
                {topic.degrees.map((d: string) => (
                  <span key={d} className="ds-badge px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">{d}</span>
                ))}
                {topic.employmentType && (
                  <span className="ds-badge px-2.5 py-1 rounded-full bg-foreground/10 text-foreground font-medium">{topic.employmentType.replace(/_/g, " ")}</span>
                )}
              </div>
            </div>

            {/* Supervisor */}
            {topic.supervisorIds.length > 0 && (
              <div>
                <p className="ds-label text-muted-foreground mb-2 flex items-center gap-2 uppercase tracking-widest text-[10px]">Supervisor</p>
                {topic.supervisorIds.map((sid) => {
                  const sup = getSupervisor(sid);
                  if (!sup) return null;
                  return (
                    <div key={sid} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/20">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold ds-body">
                        {sup.firstName[0]}{sup.lastName[0]}
                      </div>
                      <div>
                        <p className="ds-label text-foreground font-semibold">{sup.title} {sup.firstName} {sup.lastName}</p>
                        <p className="ds-caption text-muted-foreground leading-snug">{sup.researchInterests?.slice(0, 3).join(", ")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions & Contact Form */}
          <div className="mt-10 flex flex-col gap-3">
            {isSelected ? (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <span className="ds-label">Application successfully sent!</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => clearTopic()}
                    className="flex-1 rounded-xl border border-border px-4 py-2.5 ds-label text-muted-foreground transition-colors duration-150 hover:text-foreground hover:bg-black/5"
                  >
                    Withdraw
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 ds-label transition-colors duration-150 hover:opacity-90 shadow-md"
                  >
                    Close <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : showContactForm ? (
              <div className="rounded-xl border border-primary/20 p-5 bg-primary/5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="ds-label text-foreground">Personalize your application</h3>
                <p className="ds-caption text-muted-foreground leading-relaxed">
                  Supervisors receive many applications. A personalized message increases your chance of acceptance by 60%.
                </p>
                
                <button
                  onClick={() => {
                    setAiWriting(true);
                    setTimeout(() => {
                      const sup = topic.supervisorIds.length > 0 ? getSupervisor(topic.supervisorIds[0]) : null;
                      const supName = sup ? `${sup.title} ${sup.lastName}` : "Professor";
                      const studentSkills = skills.slice(0, 3).join(", ");
                      setContactMessage(`Dear ${supName},\n\nI am ${studentName}, and I am writing to express my strong interest in your thesis topic "${topic.title}". My academic background, particularly in ${studentSkills}, aligns well with the requirements of this project.\n\nI believe my technical expertise and research ambition make me a strong candidate. I would welcome the opportunity to discuss how I can contribute to this research.\n\nBest regards,\n${studentName}`);
                      setAiWriting(false);
                    }, 1200);
                  }}
                  disabled={aiWriting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 bg-white text-primary ds-label hover:bg-primary/5 transition-all duration-200 disabled:opacity-50 shadow-sm"
                >
                  {aiWriting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {aiWriting ? "Ona is writing..." : "Draft with Ona AI"}
                </button>

                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Tell the supervisor about your motivation..."
                  rows={6}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 ds-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none shadow-inner"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowContactForm(false)}
                    className="flex-1 rounded-xl border border-border px-4 py-2.5 ds-label text-muted-foreground hover:text-foreground transition-all duration-150"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      applyForTopic(topic.id, contactMessage);
                      // Stay open to show success state
                      setShowContactForm(false);
                    }}
                    disabled={contactMessage.trim().length === 0}
                    className="flex-1 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 ds-label transition-all duration-150 hover:opacity-90 disabled:opacity-30 shadow-md flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" /> Send Application
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowContactForm(true)}
                className="w-full rounded-xl bg-primary text-primary-foreground px-6 py-3.5 ds-label transition-all duration-200 hover:opacity-90 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                Apply & Contact Supervisor
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
