import { useState, useMemo } from "react";
import { useThesisStore } from "@/stores/thesisStore";
import {
  Search,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Send,
  Clock,
} from "lucide-react";
import topics from "@/data/topics.json";
import type { Topic } from "@/data/types";
import { TopicDetailSlideOver } from "@/components/topics/TopicDetailSlideOver";
import { getCompanyName, getFieldName, getMatchScore } from "@/utils/topicUtils";

const typedTopics = topics as Topic[];

export function TopicsPage() {
  const { thesisState, selectedTopicId, clearTopic } = useThesisStore();
  const [search, setSearch] = useState("");
  const [selectedField, setSelectedField] = useState("all");
  const [selectedSource, setSelectedSource] = useState<"all" | "company" | "university">("all");
  const [detailTopicId, setDetailTopicId] = useState<string | null>(null);

  const filteredTopics = useMemo(() => {
    let result = typedTopics;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    if (selectedField !== "all") {
      result = result.filter((t) => t.fieldIds.includes(selectedField));
    }
    if (selectedSource === "company") {
      result = result.filter((t) => t.companyId);
    } else if (selectedSource === "university") {
      result = result.filter((t) => t.universityId && !t.companyId);
    }
    // Sort by match score descending
    return result.sort((a, b) => getMatchScore(b) - getMatchScore(a));
  }, [search, selectedField, selectedSource]);

  const detailTopic = detailTopicId ? typedTopics.find((t) => t.id === detailTopicId) ?? null : null;
  const isSelected = (id: string) => selectedTopicId === id;

  const uniqueFields = useMemo(() => {
    const fieldSet = new Set<string>();
    typedTopics.forEach((t) => t.fieldIds.forEach((f) => fieldSet.add(f)));
    return Array.from(fieldSet);
  }, []);

  if (thesisState !== "exploring" && thesisState !== "topic_selected" && thesisState !== "application_pending") {
    return (
      <div className="scroll-area flex flex-col items-center">
        <div className="scroll-area-content max-w-3xl w-full text-center py-16 px-4">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="ds-title-lg text-foreground mb-3">Topic Locked In</h2>
          <p className="ds-body text-muted-foreground max-w-sm mx-auto">
            You have already registered your thesis. Keep focusing on your journey and upcoming milestones!
          </p>
        </div>
      </div>
    );
  }
  
  if (thesisState === "application_pending") {
    const pendingTopic = selectedTopicId ? typedTopics.find(t => t.id === selectedTopicId) : null;
    return (
      <div className="scroll-area flex flex-col items-center">
        <div className="scroll-area-content max-w-3xl w-full py-16 px-4">
          <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-6">
              <Send className="h-8 w-8" />
            </div>
            <h2 className="ds-title-md text-foreground mb-2">Application Sent</h2>
            {pendingTopic && (
              <p className="ds-body text-foreground mb-1">{pendingTopic.title}</p>
            )}
            <p className="ds-caption text-muted-foreground mb-8">
              Your supervisor is reviewing your candidacy. We'll notify you soon!
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              {["Sent", "Review", "Final"].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    i === 0 ? "border-primary bg-primary text-primary-foreground" :
                    i === 1 ? "border-primary bg-card text-primary" :
                    "border-border bg-secondary text-muted-foreground/30"
                  }`}>
                    {i === 0 ? <CheckCircle2 className="h-4 w-4" /> : i === 1 ? <div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> : <span className="ds-badge tracking-tighter">3</span>}
                  </div>
                  <span className={`ds-caption font-bold ${i <= 1 ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                  {i < 2 && <div className={`w-8 h-0.5 ${i === 0 ? "bg-primary" : "bg-border"}`} />}
                </div>
              ))}
            </div>
            
            <p className="ds-caption text-muted-foreground flex items-center justify-center gap-1.5 bg-secondary/30 py-3 px-6 rounded-xl font-medium">
              <Clock className="h-4 w-4" /> Supervisors typically respond within 2–5 business days
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-area flex flex-col items-center">
      <div className="scroll-area-content w-full max-w-6xl px-4 pt-8 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="ds-title-lg text-foreground leading-tight">Match with your perfect Thesis Topic</h1>
          <p className="mt-1 ds-body text-muted-foreground">
            Browse through {typedTopics.length} exciting topics from our industry and university partners.
          </p>
        </div>

        {/* Selected topic banner */}
        {selectedTopicId && thesisState === "topic_selected" && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-primary bg-primary/5 p-4 animate-in slide-in-from-top-4 duration-500 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="ds-label text-foreground block leading-tight">Topic Assigned</span>
                <span className="ds-caption text-muted-foreground">{typedTopics.find((t) => t.id === selectedTopicId)?.title}</span>
              </div>
            </div>
            <button
              onClick={clearTopic}
              className="px-5 py-2 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground ds-caption transition-all shadow-sm active:scale-95"
            >
              Change Topic
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-10 flex flex-col md:grid md:grid-cols-12 gap-4">
          <div className="relative md:col-span-6">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by topic title, company, or technology..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-3.5 pl-11 pr-4 ds-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-full h-full rounded-xl border border-border bg-card px-4 py-3.5 ds-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm cursor-pointer appearance-none"
            >
              <option value="all">All Academic Fields</option>
              {uniqueFields.map((fid) => (
                <option key={fid} value={fid}>{getFieldName(fid)}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as "all" | "company" | "university")}
              className="w-full h-full rounded-xl border border-border bg-card px-4 py-3.5 ds-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm cursor-pointer appearance-none"
            >
              <option value="all">All Partners</option>
              <option value="company">Industrial Partners</option>
              <option value="university">University Chairs</option>
            </select>
          </div>
        </div>

        {/* Topic grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => {
            const company = getCompanyName(topic.companyId);
            const matchScore = getMatchScore(topic);
            const selected = isSelected(topic.id);

            return (
              <button
                key={topic.id}
                onClick={() => setDetailTopicId(topic.id)}
                className={`group rounded-3xl border p-6 text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  selected ? "border-primary ring-4 ring-primary/5 bg-primary/5" : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="ds-badge px-3 py-1 rounded-lg bg-secondary/80 text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                      {company ? <Briefcase className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
                      {company || "University"}
                    </span>
                  </div>
                  <span className={`ds-badge px-3 py-1 rounded-full ${
                    matchScore >= 85 ? "bg-primary text-primary-foreground shadow-sm" : "bg-black/5 text-muted-foreground"
                  }`}>
                    {matchScore}% Match
                  </span>
                </div>
                
                <h3 className="ds-label text-foreground mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {topic.title}
                </h3>
                <p className="ds-caption text-muted-foreground line-clamp-3 mb-6 leading-relaxed">{topic.description}</p>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  {topic.degrees.slice(0, 1).map((d: string) => (
                    <span key={d} className="ds-caption px-3 py-1 rounded-lg bg-secondary/40 text-secondary-foreground font-bold text-[11px]">{d}</span>
                  ))}
                  {topic.fieldIds.slice(0, 2).map((fid) => (
                    <span key={fid} className="ds-caption px-3 py-1 rounded-lg bg-secondary/40 text-secondary-foreground font-bold text-[11px]">{getFieldName(fid)}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <TopicDetailSlideOver 
        topic={detailTopic} 
        onClose={() => setDetailTopicId(null)} 
      />
    </div>
  );
}
