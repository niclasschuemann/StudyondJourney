import { NavLink, useLocation } from "react-router-dom";
import { useThesisStore } from "@/stores/thesisStore";
import {
  LayoutDashboard,
  Route,
  MessageCircle,
  Search,
  Moon,
  Sun,
  GraduationCap,
  Lock,
  Users,
  BookOpen,
  ArrowLeftRight,
  Briefcase,
  User,
  Sparkles,
  MessagesSquare,
} from "lucide-react";

const studentNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", alwaysVisible: true },
  { to: "/community", icon: Users, label: "Community" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/journey", icon: Route, label: "Thesis Journey", requiresState: "registered" as const },
  { to: "/topics", icon: Search, label: "Discover Topics", hideAfterState: "registered" as const },
  { to: "/chat?tab=supervisor", icon: MessagesSquare, label: "Supervisor Chat", requiresState: "registered" as const },
  { to: "/chat", icon: MessageCircle, label: "Ona", isAI: true, alwaysVisible: true },
];

const supervisorNavItems = [
  { to: "/supervisor", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/community", icon: Users, label: "Community" },
  { to: "/supervisor/knowledge-base", icon: BookOpen, label: "Knowledge Base" },
];

const companyNavItems = [
  { to: "/company", icon: LayoutDashboard, label: "Business Portfolio" },
  { to: "/community", icon: Users, label: "Community" },
];

const stateOrder = ["exploring", "topic_selected", "registered", "planning", "executing", "writing", "submitted"];

function isStateAtLeast(current: string, required: string): boolean {
  return stateOrder.indexOf(current) >= stateOrder.indexOf(required);
}

import studentsData from "@/data/students.json";

export function AppSidebar() {
  const { isDark, toggleDarkMode, studentName, studentId, getOverallProgress, role, setRole, thesisState } = useThesisStore();
  const currentStudent = studentsData.find(s => s.id === studentId);
  const progress = getOverallProgress();
  const location = useLocation();
  
  const isSupervisor = role === "supervisor";
  const isCompany = role === "company";
  
  const navItems = isCompany ? companyNavItems : (isSupervisor ? supervisorNavItems : studentNavItems);

  const rotateRole = () => {
    if (role === "student") setRole("supervisor");
    else if (role === "supervisor") setRole("company");
    else setRole("student");
  };

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-5 gap-1.5">
        <img src="/studyond.svg" alt="Studyond" className="h-7 w-auto" />
        <span className="text-2xl font-cursive text-primary translate-y-[2px] ml-0.5">
          Journey
        </span>
      </div>

      {/* Role switcher */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={rotateRole}
          className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 ds-small text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
        >
          <ArrowLeftRight className="h-4 w-4 flex-shrink-0" />
          <span>Switch to {role === "student" ? "Supervisor" : (role === "supervisor" ? "Company" : "Student")}</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          // Check visibility for student nav items
          if (role === "student") {
            const studentItem = item as typeof studentNavItems[0];
            if (studentItem.requiresState && !isStateAtLeast(thesisState, studentItem.requiresState)) {
              return (
                <div
                  key={item.to}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 ds-small text-muted-foreground/40 cursor-not-allowed"
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                  <Lock className="ml-auto h-3 w-3" />
                </div>
              );
            }
            if (studentItem.hideAfterState && isStateAtLeast(thesisState, studentItem.hideAfterState)) {
              return null;
            }
          }

          // Determine if this link is the supervisor chat or Ona
          const isSupervisorChatLink = item.to === "/chat?tab=supervisor";
          const isOnaLink = item.to === "/chat" && !isSupervisorChatLink;
          const searchParamsStr = new URLSearchParams(location.search).get("tab");
          const isOnChatPage = location.pathname === "/chat";
          
          // Custom active logic for chat links
          let isActiveOverride: boolean | undefined;
          if (isSupervisorChatLink) {
            isActiveOverride = isOnChatPage && searchParamsStr === "supervisor";
          } else if (isOnaLink) {
            isActiveOverride = isOnChatPage && searchParamsStr !== "supervisor";
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/" || item.to === "/supervisor" || item.to === "/company"}
              className={({ isActive: navActive }) => {
                const active = isActiveOverride !== undefined ? isActiveOverride : navActive;
                return `flex items-center gap-3 rounded-lg px-3 py-2.5 ds-small transition-colors duration-150 ${
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                } ${
                  role === "student" && item.to === "/journey" && thesisState === "topic_selected"
                    ? "ring-2 ring-primary/50 animate-pulse"
                    : ""
                }`;
              }}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
              {role === "student" && (item as typeof studentNavItems[0]).isAI && (
                <span className="ml-auto flex h-5 items-center px-1.5 rounded text-ai ds-badge">
                  AI
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Progress (student only, when registered) */}
      {role === "student" && isStateAtLeast(thesisState, "registered") && (
        <div className="mx-3 mb-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="ds-badge text-muted-foreground">Overall Progress</span>
            <span className="ds-badge text-foreground font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* User + Dark Mode */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ds-badge ${isCompany ? 'bg-amber-500 text-white' : 'bg-primary text-primary-foreground'}`}>
              {isCompany ? <Briefcase className="h-4 w-4" /> : (isSupervisor ? <Users className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />)}
            </div>
            <div className="min-w-0">
              <div className="ds-label text-foreground truncate">
                {isCompany ? "Nestlé Admin" : (isSupervisor ? "Prof. Dr. Sibylle Hechberger" : studentName)}
              </div>
              <div className="ds-caption text-muted-foreground">
                {isCompany ? "Company Partner" : (isSupervisor ? "Supervisor" : (currentStudent ? `${currentStudent.degree} Student` : "Student"))}
              </div>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors duration-150"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
