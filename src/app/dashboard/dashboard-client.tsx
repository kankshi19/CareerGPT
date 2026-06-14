"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardClientProps {
  initialProfile: any;
  rolesList: any[];
}

export function DashboardClient({ initialProfile, rolesList }: DashboardClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [errorRecs, setErrorRecs] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState<Record<string, boolean>>({});
  const [feedbackSent, setFeedbackSent] = useState<Record<string, "up" | "down" | null>>({});

  // Role Comparison Modal/Drawer state
  const [selectedAltRole, setSelectedAltRole] = useState<any>(null);
  const [switchingRole, setSwitchingRole] = useState(false);

  // Active Roadmap state
  const [activeRoadmap, setActiveRoadmap] = useState<any>(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);

  // 1. Fetch Recommendations on load
  const loadRecommendations = async () => {
    setLoadingRecs(true);
    setErrorRecs("");
    try {
      const res = await fetch("/api/recommendations");
      if (!res.ok) {
        throw new Error("Failed to load personalized recommendations.");
      }
      const data = await res.json();
      setRecommendations(data);
    } catch (err: any) {
      setErrorRecs(err.message || "Something went wrong.");
    } finally {
      setLoadingRecs(false);
    }
  };

  // 2. Fetch Active Roadmap
  const loadActiveRoadmap = async () => {
    setLoadingRoadmap(true);
    try {
      const res = await fetch("/api/roadmap/generate");
      const data = await res.json();
      if (data.roadmap) {
        setActiveRoadmap(data.roadmap);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
    loadActiveRoadmap();
  }, []);

  // Submit Feedback
  const handleFeedback = async (type: string, id: string, rating: number) => {
    const key = `${type}-${id}`;
    setFeedbackLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: type,
          entityId: id,
          rating,
          note: rating === 1 ? "Helpful recommendation" : "Not relevant for my focus"
        })
      });
      if (res.ok) {
        setFeedbackSent((prev) => ({ ...prev, [key]: rating === 1 ? "up" : "down" }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFeedbackLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Switch Target Career Role
  const handleSwitchTargetRole = async (targetRoleId: string) => {
    setSwitchingRole(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          targetRoleId
        })
      });
      if (res.ok) {
        setSelectedAltRole(null);
        // Reload dashboard data
        const updated = await res.json();
        if (updated.profile) {
          setProfile(updated.profile);
        }
        await loadRecommendations();
        await loadActiveRoadmap();
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSwitchingRole(false);
    }
  };

  const currentTargetRole = rolesList.find((r) => r.id === profile.targetRoleId);

  return (
    <main className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 md:p-8 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md shadow-lg">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Career Intelligence Dashboard</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            Welcome back, {profile.fullName || "Student"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Analyzing your profile against 352 roles and 687 skills from seeded datasets.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/onboarding"
            className="px-4 py-2 text-xs font-semibold rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-all"
          >
            Update Profile
          </Link>
          <Link
            href="/explore"
            className="px-4 py-2 text-xs font-semibold rounded-full border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 transition-all"
          >
            Explore Careers
          </Link>
        </div>
      </div>

      {loadingRecs ? (
        /* Loading Skeleton */
        <div className="grid gap-6 md:grid-cols-3 animate-pulse">
          <div className="h-64 bg-white/5 rounded-3xl border border-white/5 md:col-span-2" />
          <div className="h-64 bg-white/5 rounded-3xl border border-white/5" />
          <div className="h-48 bg-white/5 rounded-3xl border border-white/5" />
          <div className="h-48 bg-white/5 rounded-3xl border border-white/5" />
          <div className="h-48 bg-white/5 rounded-3xl border border-white/5" />
        </div>
      ) : errorRecs ? (
        <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
          {errorRecs}
        </div>
      ) : (
        <>
          {/* Hero Row: Readiness & AI Coaching */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Readiness Score circular gauge */}
            <div className="glass-card rounded-3xl p-6 flex flex-col items-center justify-center text-center relative group">
              <span className="absolute top-4 left-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role Readiness</span>
              
              <div className="radial-progress w-36 h-36 mt-4" style={{ transform: "rotate(-90deg)" }}>
                {/* Background Ring */}
                <svg className="w-full h-full">
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    className="stroke-slate-900 fill-none"
                    strokeWidth="10"
                  />
                  {/* Foreground Animated Ring */}
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    className="stroke-cyan-400 fill-none"
                    strokeWidth="10"
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 - (364.4 * (recommendations.readinessScore || 0)) / 100}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                {/* Percentage Center Text */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ transform: "rotate(90deg)" }}
                >
                  <span className="text-3xl font-extrabold text-white glow-cyan">
                    {recommendations.readinessScore || 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">Readiness Index</span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-slate-300">Targeting: {currentTargetRole?.name || "Target Role"}</p>
                <div className="mt-2 text-[10px] text-slate-500 max-w-[200px] border-t border-white/5 pt-2">
                  Score Weight: 65% Core Skill Gaps, 25% Secondary Gaps, 10% Breadth.
                </div>
              </div>
            </div>

            {/* AI Coaching Explanation Panel */}
            <div className="glass-card rounded-3xl p-6 md:col-span-2 flex flex-col justify-between border-l-cyan-500/20 border-l-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Coaching Insights</span>
                </div>
                <p className="text-sm text-slate-300 italic leading-relaxed">
                  "{recommendations.explanation?.summary || `You are building skills toward ${currentTargetRole?.name}. Let's target key missing gaps.`}"
                </p>
                
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Recommended Focus:</span>{" "}
                    {recommendations.explanation?.recommendedStudyFocus?.join(", ") || recommendations.missingSkills?.slice(0, 3).join(", ") || "Core requirements"}
                  </p>
                  <p className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Why this role matches your profile:</span>{" "}
                    {recommendations.explanation?.whyThisRole || currentTargetRole?.description}
                  </p>
                </div>
              </div>

              {/* Active Roadmap Progress */}
              <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Active Learning Path</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {loadingRoadmap
                      ? "Checking roadmaps..."
                      : activeRoadmap
                      ? `Active Path: ${activeRoadmap.title}`
                      : "No active path yet. Generate one to start tracking."}
                  </p>
                </div>
                {activeRoadmap ? (
                  <Link
                    href="/roadmap"
                    className="px-4 py-2 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-full transition-all shadow-md shadow-cyan-400/10"
                  >
                    View Roadmap
                  </Link>
                ) : (
                  <form action="/api/roadmap/generate" method="POST">
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white rounded-full transition-all shadow-md shadow-emerald-500/10"
                    >
                      Generate Roadmap
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Recommended Next Step & ML Role Alternatives */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Top Recommended Next Step Card */}
            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between border-t-2 border-t-amber-500/30">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Recommended Next Step</span>
                {recommendations.missingSkills && recommendations.missingSkills[0] ? (
                  <div className="mt-3">
                    <h3 className="text-lg font-bold text-white leading-tight">
                      Close gap in: {recommendations.missingSkills[0]}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2">
                      This is ranked as a top missing capability for {currentTargetRole?.name}. Level up from Novice to Competent to boost your readiness.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <h3 className="text-lg font-bold text-emerald-400">All core skills met!</h3>
                    <p className="text-xs text-slate-400 mt-2">
                      You already possess competence in the core skill requirements. Move on to certifications and advanced tools!
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-white/5">
                {activeRoadmap ? (
                  <Link
                    href="/roadmap"
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group"
                  >
                    Track in roadmap <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                ) : (
                  <span className="text-xs text-slate-500">Generate a roadmap to track steps</span>
                )}
              </div>
            </div>

            {/* Custom ML Recommendation matches */}
            <div className="glass-card rounded-3xl p-6 md:col-span-2 flex flex-col justify-between border-t-2 border-t-cyan-500/30">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                    AI Alternate Match Rankings (Random Forest)
                  </span>
                  <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                    Dataset-Driven
                  </span>
                </div>

                <div className="space-y-3 mt-3">
                  {recommendations.alternativeRoles?.map((alt: any, idx: number) => (
                    <div
                      key={alt.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-slate-950/20 hover:bg-slate-950/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                          <span className="text-xs font-bold text-white tracking-wide">{alt.title}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 pl-5">
                          {alt.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-cyan-400 bg-cyan-400/5 border border-cyan-400/10 px-2 py-0.5 rounded">
                          {alt.matchScore}% Match
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedAltRole(alt)}
                          className="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-1 border border-white/10 hover:border-white/20 rounded-md transition-all"
                        >
                          Compare
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!recommendations.alternativeRoles || recommendations.alternativeRoles.length === 0) && (
                    <p className="text-xs text-slate-500 italic">No alternative role recommendations available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation Lists Tabs */}
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-2">
              <h2 className="text-lg font-bold text-white tracking-wide uppercase">Your Learning Plan Recommendations</h2>
              <p className="text-xs text-slate-500 mt-1">
                Thumbs up/down triggers local feedback persistence and real-time ML rating aggregation.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Skill Recommendations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Skills to Strengthen</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                    Gap Analysis
                  </span>
                </div>
                <div className="space-y-4">
                  {recommendations.recommendations
                    ?.filter((r: any) => r.type === "SKILL")
                    .slice(0, 3)
                    .map((item: any) => {
                      const feedbackKey = `SKILL-${item.addressesMissingSkill}`;
                      const rating = feedbackSent[feedbackKey];
                      return (
                        <div key={item.title} className="glass-card rounded-2xl p-5 flex flex-col justify-between min-h-[160px]">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 font-bold text-slate-400 uppercase">
                                {item.difficulty}
                              </span>
                              {/* Feedback Actions */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={feedbackLoading[feedbackKey] || rating !== undefined}
                                  onClick={() => handleFeedback("SKILL", item.addressesMissingSkill, 1)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded border border-white/5 transition-all ${
                                    rating === "up" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "hover:bg-white/5 text-slate-500"
                                  }`}
                                >
                                  👍
                                </button>
                                <button
                                  type="button"
                                  disabled={feedbackLoading[feedbackKey] || rating !== undefined}
                                  onClick={() => handleFeedback("SKILL", item.addressesMissingSkill, 0)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded border border-white/5 transition-all ${
                                    rating === "down" ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "hover:bg-white/5 text-slate-500"
                                  }`}
                                >
                                  👎
                                </button>
                              </div>
                            </div>
                            <h4 className="text-sm font-extrabold text-white mt-3">{item.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-1">{item.reason}</p>
                          </div>
                          <div className="text-[10px] text-slate-500 border-t border-white/5 pt-2 mt-4 font-semibold uppercase">
                            Why: Required Core Skill
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Certification Recommendations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Certifications</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                    Credentials
                  </span>
                </div>
                <div className="space-y-4">
                  {recommendations.recommendations
                    ?.filter((r: any) => r.type === "CERTIFICATION")
                    .slice(0, 3)
                    .map((item: any) => {
                      const feedbackKey = `CERTIFICATION-${item.title}`;
                      const rating = feedbackSent[feedbackKey];
                      return (
                        <div key={item.title} className="glass-card rounded-2xl p-5 flex flex-col justify-between min-h-[160px]">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 font-bold text-cyan-400 uppercase">
                                CV Boost
                              </span>
                              {/* Feedback Actions */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={feedbackLoading[feedbackKey] || rating !== undefined}
                                  onClick={() => handleFeedback("CERTIFICATION", item.title, 1)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded border border-white/5 transition-all ${
                                    rating === "up" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "hover:bg-white/5 text-slate-500"
                                  }`}
                                >
                                  👍
                                </button>
                                <button
                                  type="button"
                                  disabled={feedbackLoading[feedbackKey] || rating !== undefined}
                                  onClick={() => handleFeedback("CERTIFICATION", item.title, 0)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded border border-white/5 transition-all ${
                                    rating === "down" ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "hover:bg-white/5 text-slate-500"
                                  }`}
                                >
                                  👎
                                </button>
                              </div>
                            </div>
                            <h4 className="text-sm font-extrabold text-white mt-3">{item.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-1">{item.reason}</p>
                          </div>
                          <div className="text-[10px] text-slate-500 border-t border-white/5 pt-2 mt-4 font-semibold uppercase">
                            Why: Linked to certification requirements
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Technology Recommendations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Tools & Technologies</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    Hot Tools
                  </span>
                </div>
                <div className="space-y-4">
                  {recommendations.recommendations
                    ?.filter((r: any) => r.type === "TECHNOLOGY")
                    .slice(0, 3)
                    .map((item: any) => {
                      const feedbackKey = `TECHNOLOGY-${item.title}`;
                      const rating = feedbackSent[feedbackKey];
                      return (
                        <div key={item.title} className="glass-card rounded-2xl p-5 flex flex-col justify-between min-h-[160px]">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase ${
                                item.hotTechnologyRelevance 
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                  : "bg-slate-900 border-white/5 text-slate-400"
                              }`}>
                                {item.hotTechnologyRelevance ? "Hot Tech" : "Standard"}
                              </span>
                              {/* Feedback Actions */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={feedbackLoading[feedbackKey] || rating !== undefined}
                                  onClick={() => handleFeedback("TECHNOLOGY", item.title, 1)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded border border-white/5 transition-all ${
                                    rating === "up" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "hover:bg-white/5 text-slate-500"
                                  }`}
                                >
                                  👍
                                </button>
                                <button
                                  type="button"
                                  disabled={feedbackLoading[feedbackKey] || rating !== undefined}
                                  onClick={() => handleFeedback("TECHNOLOGY", item.title, 0)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded border border-white/5 transition-all ${
                                    rating === "down" ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "hover:bg-white/5 text-slate-500"
                                  }`}
                                >
                                  👎
                                </button>
                              </div>
                            </div>
                            <h4 className="text-sm font-extrabold text-white mt-3">{item.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-1">{item.reason}</p>
                          </div>
                          <div className="text-[10px] text-slate-500 border-t border-white/5 pt-2 mt-4 font-semibold uppercase">
                            Why: Sourced from O*NET taxonomy mapping
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Role Comparison Drawer/Modal */}
      {selectedAltRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-xl h-full bg-slate-900 border-l border-white/10 p-6 md:p-8 overflow-y-auto flex flex-col justify-between animate-fade-in-up">
            <div>
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Role Comparison</span>
                  <h2 className="text-lg font-bold text-white mt-1">Analyze Career Switch</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAltRole(null)}
                  className="text-slate-400 hover:text-white font-bold text-sm"
                >
                  Close ✕
                </button>
              </div>

              <div className="space-y-6 text-sm text-slate-300">
                {/* Active target role vs alternative role titles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-white/5 bg-slate-950/30">
                    <p className="text-[10px] text-slate-500 uppercase">Current Target</p>
                    <p className="font-bold text-white mt-1">{currentTargetRole?.name}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                    <p className="text-[10px] text-cyan-400 uppercase">Alternative Match</p>
                    <p className="font-bold text-cyan-300 mt-1">{selectedAltRole.title}</p>
                  </div>
                </div>

                {/* Similarity metrics visualization */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Relevance Breakdown</h4>
                  
                  <MetricProgressBar label="Skills Overlap" value={selectedAltRole.metrics.skillsOverlapRatio} color="emerald" />
                  <MetricProgressBar label="Interests Similarity" value={selectedAltRole.metrics.interestsSimilarity} color="cyan" />
                  <MetricProgressBar label="Major Alignment" value={selectedAltRole.metrics.majorSimilarity} color="violet" />
                  <MetricProgressBar label="Experience Fit" value={selectedAltRole.metrics.experienceMatch} color="amber" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role Description</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedAltRole.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedAltRole(null)}
                className="w-full py-3 rounded-full border border-white/10 hover:bg-white/5 text-sm font-semibold transition-all text-slate-400"
              >
                Keep Current Focus
              </button>
              <button
                type="button"
                disabled={switchingRole}
                onClick={() => handleSwitchTargetRole(selectedAltRole.id)}
                className="w-full py-3 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-sm font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] disabled:opacity-50"
              >
                {switchingRole ? "Updating focus..." : "Switch Target Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Side Comparison Mini Progress Component
function MetricProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500 to-emerald-400 bg-emerald-500",
    cyan: "from-cyan-500 to-cyan-400 bg-cyan-500",
    violet: "from-violet-500 to-violet-400 bg-violet-500",
    amber: "from-amber-500 to-amber-400 bg-amber-500"
  };
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-white">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
        <div className={`h-full rounded-full bg-gradient-to-r ${colorMap[color] || "from-cyan-500 to-cyan-400"}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
