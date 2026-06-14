"use client";

import { useState, useRef } from "react";

interface Role {
  id: string;
  name: string;
}

interface BulletPointSuggestion {
  original: string;
  suggestion: string;
  explanation: string;
}

interface TailorResponse {
  score: number;
  missingKeywords: string[];
  bulletPoints: BulletPointSuggestion[];
  tailoredText: string;
}

interface ResumeStudioClientProps {
  roles: Role[];
  defaultRoleId: string;
}

export function ResumeStudioClient({ roles, defaultRoleId }: ResumeStudioClientProps) {
  const [targetRoleId, setTargetRoleId] = useState(defaultRoleId);
  const [resumeText, setResumeText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TailorResponse | null>(null);
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResumeText(""); // Clear text if file uploaded
    }
  };

  const handleTailor = async () => {
    if (!targetRoleId) {
      setError("Please select a target career role.");
      return;
    }
    if (!file && !resumeText.trim()) {
      setError("Please upload a file or paste your resume text.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("targetRoleId", targetRoleId);
      if (file) {
        formData.append("file", file);
      } else {
        formData.append("resumeText", resumeText);
      }

      const res = await fetch("/api/tailor-resume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to tailor resume.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.tailoredText) {
      navigator.clipboard.writeText(result.tailoredText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
          AI Resume Tailoring Studio
        </h1>
        <p className="text-slate-400">
          Optimize your resume to bypass ATS filters, align with job descriptions, and highlight relevant skills.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Setup</h3>
            
            {/* Target Role Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Target Career Role</label>
              <select
                value={targetRoleId}
                onChange={(e) => setTargetRoleId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input"
              >
                <option value="">Select a target role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-950">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Resume File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Resume Document</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  file ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 hover:border-cyan-500/30 bg-white/5"
                }`}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileChange}
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400 mx-auto mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <p className="text-xs text-slate-300">Click to upload PDF, TXT, or MD</p>
                {file && <p className="text-xs text-emerald-400 font-semibold mt-2 truncate">{file.name}</p>}
              </div>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-xs font-semibold uppercase">Or Paste Text</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            {/* Resume Text Input */}
            <div>
              <textarea
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  setFile(null); // Clear file if typing text
                }}
                placeholder="Paste your plain text resume here..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl glass-input text-xs resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-400/10 p-3 rounded-lg border border-rose-500/20">{error}</p>
            )}

            <button
              onClick={handleTailor}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-bold text-sm hover:opacity-95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Analyzing...
                </>
              ) : "Analyze & Tailor"}
            </button>
          </div>
        </div>

        {/* Results View */}
        <div className="lg:col-span-2">
          {!result ? (
            <div className="glass-card h-full rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-white/5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4 text-slate-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-300">No Analysis Done</h3>
              <p className="text-sm mt-1 max-w-sm">Provide your resume details on the left and select your target role to trigger optimization.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score and Keyword Summary */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Score Dial */}
                <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-white/5">
                  <div className="relative flex items-center justify-center w-28 h-28">
                    {/* SVG Progress Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="48" strokeWidth="8" stroke="rgba(255,255,255,0.05)" fill="transparent" />
                      <circle cx="56" cy="56" r="48" strokeWidth="8" 
                        stroke={result.score > 70 ? "#10B981" : result.score > 40 ? "#F59E0B" : "#EF4444"} 
                        strokeDasharray={301.6} 
                        strokeDashoffset={301.6 - (301.6 * result.score) / 100} 
                        strokeLinecap="round" fill="transparent" />
                    </svg>
                    <span className="absolute text-3xl font-extrabold text-white">{result.score}%</span>
                  </div>
                  <h4 className="mt-4 font-semibold text-sm text-slate-300">Match Score</h4>
                </div>

                {/* Missing Keywords */}
                <div className="glass-card p-6 rounded-2xl md:col-span-2 border border-white/5 space-y-3">
                  <h4 className="font-semibold text-sm text-slate-200">Missing Key Skills / Tech</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map((kw, idx) => (
                      <span key={idx} className="bg-rose-500/10 text-rose-400 text-xs px-2.5 py-1 rounded-full border border-rose-500/20">
                        {kw}
                      </span>
                    ))}
                    {result.missingKeywords.length === 0 && (
                      <p className="text-sm text-emerald-400">Perfect match! All target keywords were identified.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bullet Point Adjustments */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
                <h4 className="font-semibold text-lg text-slate-200">Suggested Rewrites</h4>
                <div className="space-y-4">
                  {result.bulletPoints.map((bp, idx) => (
                    <div key={idx} className="grid md:grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Original Bullet</span>
                        <p className="text-slate-400 text-sm italic">"{bp.original}"</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wide">AI Suggestion</span>
                        <p className="text-emerald-300 text-sm font-medium">"{bp.suggestion}"</p>
                        <p className="text-[11px] text-slate-500 italic mt-1">{bp.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copyable Tailored Resume Text */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-lg text-slate-200">Tailored Resume Content</h4>
                  <button 
                    onClick={handleCopy}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 flex items-center gap-1.5 transition-all"
                  >
                    {copied ? "Copied!" : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.4M9 2.25H18a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0118 20.25H9A2.25 2.25 0 016.75 18V4.5A2.25 2.25 0 019 2.25z" />
                        </svg>
                        Copy Resume
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={result.tailoredText}
                  rows={15}
                  className="w-full p-4 rounded-xl bg-slate-950 border border-white/5 text-slate-300 text-xs font-mono resize-none focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
