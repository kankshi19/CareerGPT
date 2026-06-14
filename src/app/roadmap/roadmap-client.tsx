"use client";

import { useState } from "react";
import { markRoadmapStepComplete, generateRoadmap } from "./server-actions";

interface Step {
  id: string;
  title: string;
  description: string;
  duration: string;
  skillFocus: string;
  resourceLink: string | null;
  completed: boolean;
  sortOrder: number;
}

interface Roadmap {
  id: string;
  title: string;
  summary: string;
  isActive: boolean;
  createdAt: any;
  role: {
    name: string;
  };
  steps: Step[];
}

interface RoadmapClientProps {
  roadmap: Roadmap | null;
}

export function RoadmapClient({ roadmap }: RoadmapClientProps) {
  const [activeTab, setActiveTab] = useState<"30-day" | "90-day" | "6-month">("30-day");
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // Helper to parse step details
  const parseStepDetails = (step: Step) => {
    let parsed = {
      phase: "30-day",
      whyItMatters: "Required competency for the target career path.",
      prerequisites: "None",
      expectedOutcome: "Build a working prototype or verify knowledge.",
      priority: "MEDIUM",
      detailText: step.description
    };

    try {
      if (step.description.startsWith("{")) {
        parsed = { ...parsed, ...JSON.parse(step.description) };
      }
    } catch (e) {
      // fallback
    }

    return parsed;
  };

  // Group and filter steps
  const stepsWithDetails = roadmap?.steps.map((step) => ({
    ...step,
    details: parseStepDetails(step)
  })) || [];

  const filteredSteps = stepsWithDetails.filter(
    (step) => step.details.phase === activeTab
  );

  const completedCount = roadmap?.steps.filter((s) => s.completed).length || 0;
  const progressPercent = roadmap?.steps.length
    ? Math.round((completedCount / roadmap.steps.length) * 100)
    : 0;

  const handleRegenerateSubmit = () => {
    setRegenerating(true);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 md:p-8 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md shadow-lg">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Personalized Learning Roadmap</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            {roadmap ? `${roadmap.role.name} Curriculum` : "Career Learning Path"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {roadmap ? "Track steps, learn core resources, and build portfolio proof." : "Select your target role to generate a path."}
          </p>
        </div>

        <form action={generateRoadmap} onSubmit={handleRegenerateSubmit}>
          <button
            type="submit"
            disabled={regenerating}
            className="px-6 py-3 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] disabled:opacity-50 flex items-center gap-2"
          >
            {regenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Regenerating Path...
              </>
            ) : roadmap ? (
              "Regenerate Path"
            ) : (
              "Generate Path"
            )}
          </button>
        </form>
      </div>

      {roadmap ? (
        <div className="space-y-6">
          {/* Path Status Overview Card */}
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-10" />
            <h2 className="text-lg font-bold text-white tracking-wide">{roadmap.title}</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{roadmap.summary}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Steps</p>
                <p className="text-xl font-bold text-white mt-0.5">{roadmap.steps.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Steps Completed</p>
                <p className="text-xl font-bold text-emerald-400 mt-0.5">{completedCount}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Path Progress</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="h-2 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white whitespace-nowrap">{progressPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Phase-selection Tab Toggles */}
          <div className="flex rounded-xl bg-slate-950/80 p-1.5 border border-white/5">
            {(["30-day", "90-day", "6-month"] as const).map((tab) => {
              const tabLabels = {
                "30-day": "30-Day Sprint (Basics)",
                "90-day": "90-Day Build (Intermediate)",
                "6-month": "6-Month Capstone (Mastery)"
              };
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setExpandedStepId(null);
                  }}
                  className={`w-full py-2.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === tab
                      ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shadow-inner"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              );
            })}
          </div>

          {/* Timeline Milestones Checklist */}
          <div className="relative pl-6 md:pl-8 space-y-6">
            {/* Continuous Vertical Timeline Line */}
            <div className="absolute left-[11px] md:left-[15px] top-4 bottom-4 w-[2px] bg-slate-900 border-l border-white/5 -z-10" />

            {filteredSteps.map((step, idx) => {
              const isExpanded = expandedStepId === step.id;
              
              // Define priority badge styling
              const priorityColors: Record<string, string> = {
                HIGH: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                LOW: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
              };

              return (
                <div key={step.id} className="relative animate-fade-in-up">
                  {/* Timeline Tracker Dot Indicator */}
                  <div
                    className={`absolute -left-[21px] md:-left-[25px] top-1.5 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      step.completed
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                        : "bg-slate-950 border-white/10 text-slate-500"
                    }`}
                  >
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  </div>

                  {/* Step Card */}
                  <div className={`glass-card rounded-2xl p-5 ${
                    step.completed ? "border-emerald-500/20 bg-emerald-500/[0.02]" : ""
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="cursor-pointer flex-1" onClick={() => setExpandedStepId(isExpanded ? null : step.id)}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${
                            priorityColors[step.details.priority] || "bg-slate-900 text-slate-400"
                          }`}>
                            {step.details.priority} Priority
                          </span>
                          <span className="text-[10px] text-cyan-400 font-semibold">{step.duration}</span>
                          <span className="text-[10px] text-slate-500">· {step.skillFocus}</span>
                        </div>
                        <h3 className={`text-base font-bold text-white mt-1.5 transition-colors ${
                          step.completed ? "line-through text-slate-400" : ""
                        }`}>
                          {step.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {step.details.detailText}
                        </p>
                      </div>

                      {/* Complete Checkbox */}
                      <form action={markRoadmapStepComplete}>
                        <input type="hidden" name="stepId" value={step.id} />
                        <button
                          type="submit"
                          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                            step.completed
                              ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                              : "border-white/15 hover:border-cyan-400/50 bg-white/5 text-transparent hover:text-slate-500"
                          }`}
                        >
                          ✓
                        </button>
                      </form>
                    </div>

                    {/* Interactive Dropdown Drawer Details */}
                    {isExpanded && (
                      <div className="mt-5 pt-5 border-t border-white/5 space-y-4 animate-fade-in-up text-xs text-slate-300">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Why this matters</p>
                            <p className="mt-1 text-slate-400 leading-relaxed">{step.details.whyItMatters}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Expected Outcome</p>
                            <p className="mt-1 text-emerald-400 font-semibold leading-relaxed">
                              {step.details.expectedOutcome}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-white/5">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Prerequisites</p>
                            <p className="mt-1 text-slate-400">{step.details.prerequisites}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Recommended Resources</p>
                            <div className="mt-1">
                              {step.resourceLink ? (
                                <a
                                  href={step.resourceLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-semibold"
                                >
                                  Official Reference Guide ↗
                                </a>
                              ) : (
                                <span className="text-slate-500 italic">No direct reference link provided</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mini Toggle Hint */}
                    <div className="flex justify-center mt-3 -mb-2">
                      <button
                        type="button"
                        onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                        className="text-[9px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-wider"
                      >
                        {isExpanded ? "Collapse Details ▲" : "Expand Details ▼"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredSteps.length === 0 && (
              <div className="text-center p-8 rounded-2xl border border-dashed border-white/10 text-slate-500">
                No roadmap steps generated for the "{activeTab}" phase.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty Roadmap State */
        <div className="glass-card rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
          <span className="text-4xl">🗺️</span>
          <h2 className="text-xl font-bold text-white tracking-wide">No active path yet</h2>
          <p className="text-xs text-slate-400 max-w-sm">
            Ready to secure a role? Generate a complete 30-day, 90-day, and 6-month curriculum based on your target skills.
          </p>
          <form action={generateRoadmap} onSubmit={handleRegenerateSubmit}>
            <button
              type="submit"
              disabled={regenerating}
              className="px-6 py-3 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm transition-all shadow-md shadow-cyan-400/20"
            >
              {regenerating ? "Generating Path..." : "Create New Learning Path"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
