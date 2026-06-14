"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Role {
  id: string;
  slug: string;
  name: string;
  description: string;
}

interface Skill {
  id: string;
  slug: string;
  name: string;
  category: string;
}

interface OnboardingWizardProps {
  roles: Role[];
  skills: Skill[];
  profile: any;
}

export function OnboardingWizard({ roles, skills, profile }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: AI Extraction State
  const [githubUsername, setGithubUsername] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Form State
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [educationLevel, setEducationLevel] = useState(profile?.educationLevel || "Undergraduate");
  const [major, setMajor] = useState(profile?.major || "");
  const [interests, setInterests] = useState(profile?.interests || "");
  const [preferredRoles, setPreferredRoles] = useState(profile?.preferredRoles || "");
  const [targetRoleId, setTargetRoleId] = useState(profile?.targetRoleId || "");
  const [weeklyLearningHours, setWeeklyLearningHours] = useState(profile?.weeklyLearningHours || 5);
  const [experienceLevel, setExperienceLevel] = useState(profile?.experienceLevel || "Beginner");
  const [preferredLearningStyle, setPreferredLearningStyle] = useState(profile?.preferredLearningStyle || "Mixed");

  // Selected Skills State
  const initialSkills = profile?.currentSkills?.map((us: any) => ({
    slug: us.skill.slug,
    name: us.skill.name,
    level: us.level
  })) || [];
  const [selectedSkills, setSelectedSkills] = useState<{ slug: string; name: string; level: number }[]>(initialSkills);

  // Search filters
  const [roleSearch, setRoleSearch] = useState("");
  const [skillSearch, setSkillSearch] = useState("");

  // Step validation
  const canGoNext = () => {
    if (currentStep === 1) return true; // AI setup is optional
    if (currentStep === 2) return fullName && major;
    if (currentStep === 3) return interests && targetRoleId;
    if (currentStep === 4) return weeklyLearningHours > 0;
    return true;
  };

  const handleNext = () => {
    if (canGoNext() && currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Toggle skill selection
  const handleToggleSkill = (skill: Skill) => {
    const exists = selectedSkills.some((s) => s.slug === skill.slug);
    if (exists) {
      setSelectedSkills((prev) => prev.filter((s) => s.slug !== skill.slug));
    } else {
      setSelectedSkills((prev) => [...prev, { slug: skill.slug, name: skill.name, level: 3 }]);
    }
  };

  // Update specific skill rating
  const handleSkillLevelChange = (slug: string, newLevel: number) => {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.slug === slug ? { ...s, level: newLevel } : s))
    );
  };

  // Handle Profile Extraction
  const handleExtract = async () => {
    if (!resumeFile && !githubUsername) return;
    
    setExtracting(true);
    setError("");

    try {
      const formData = new FormData();
      if (resumeFile) formData.append("file", resumeFile);
      if (githubUsername) formData.append("githubUsername", githubUsername);

      const res = await fetch("/api/extract-profile", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to extract data. Please try manual entry.");
      }

      const data = await res.json();
      
      // Auto-fill form fields
      if (data.educationLevel) setEducationLevel(data.educationLevel);
      if (data.major) setMajor(data.major);
      if (data.interests) setInterests(data.interests);
      if (data.preferredRoles) setPreferredRoles(data.preferredRoles);
      if (data.experienceLevel) setExperienceLevel(data.experienceLevel);
      
      // Auto-map skills
      if (data.skills && Array.isArray(data.skills)) {
        const newSelectedSkills = [...selectedSkills];
        data.skills.forEach((skillName: string) => {
          // Find matching skill in DB
          const match = skills.find(s => s.name.toLowerCase().includes(skillName.toLowerCase()) || skillName.toLowerCase().includes(s.name.toLowerCase()));
          if (match && !newSelectedSkills.some(s => s.slug === match.slug)) {
            newSelectedSkills.push({ slug: match.slug, name: match.name, level: 3 });
          }
        });
        setSelectedSkills(newSelectedSkills);
      }

      // Move to next step automatically
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExtracting(false);
    }
  };

  // Submit profile to API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        fullName,
        educationLevel,
        major,
        interests,
        preferredRoles,
        weeklyLearningHours: Number(weeklyLearningHours),
        experienceLevel,
        preferredLearningStyle,
        targetRoleId,
        skills: selectedSkills
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong saving your profile.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save profile.");
      setLoading(false);
    }
  };

  // Dynamic filter arrays
  const filteredRoles = roles
    .filter((r) => r.name.toLowerCase().includes(roleSearch.toLowerCase()))
    .slice(0, 5);

  const filteredSkills = skills
    .filter(
      (s) =>
        s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
        !selectedSkills.some((selected) => selected.slug === s.slug)
    )
    .slice(0, 10);

  const stepsLabel = ["AI Setup", "About You", "Goals", "Commitment", "Skills Assessment", "Confirm"];

  return (
    <div className="w-full">
      {/* Step Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          {stepsLabel.map((lbl, idx) => (
            <span
              key={lbl}
              className={`transition-colors duration-300 ${
                currentStep >= idx + 1 ? "text-cyan-400 font-semibold" : ""
              } hidden sm:block`}
            >
              {lbl}
            </span>
          ))}
        </div>
        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: AI QUICK SETUP */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent tracking-wide">Frictionless Setup</h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">Upload your resume or link your GitHub profile to instantly auto-fill your profile and skills using AI. Or, skip this step to enter manually.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {/* Option A: Resume */}
              <div 
                className={`glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer border-2 transition-all duration-300 ${resumeFile ? 'border-emerald-500 bg-emerald-500/10' : 'border-dashed border-white/10 hover:border-cyan-500/50'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.txt,.md" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setResumeFile(e.target.files[0]);
                      setGithubUsername(""); // Clear github if resume chosen
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-cyan-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white mb-1">Upload Resume</h3>
                <p className="text-xs text-slate-400 mb-2">PDF, TXT, or MD</p>
                {resumeFile && <p className="text-emerald-400 text-sm font-medium mt-2 truncate w-full px-4">{resumeFile.name}</p>}
              </div>

              {/* Option B: GitHub */}
              <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-white/10">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-purple-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                </div>
                <h3 className="font-semibold text-white mb-2">GitHub Profile</h3>
                <input 
                  type="text" 
                  placeholder="Username (e.g. torvalds)" 
                  value={githubUsername}
                  onChange={(e) => {
                    setGithubUsername(e.target.value);
                    setResumeFile(null); // Clear resume if github chosen
                  }}
                  className="w-full px-4 py-2 rounded-lg glass-input text-sm text-center"
                />
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={handleExtract}
                disabled={(!resumeFile && !githubUsername) || extracting}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(34,211,238,0.35)] disabled:opacity-50 disabled:grayscale w-full md:w-auto flex justify-center items-center gap-2"
              >
                {extracting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Extracting Profile...
                  </>
                ) : "Auto-Fill My Profile"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: IDENTITY & EDUCATION */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="text-xl font-bold text-white tracking-wide">Tell us about yourself</h2>
            <p className="text-sm text-slate-400">This helps customize recommendations and coaching tone.</p>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl glass-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Education Level</label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input"
              >
                {["High School", "Undergraduate", "Bachelor", "Master", "PhD", "Bootcamp", "Working professional"].map((lvl) => (
                  <option key={lvl} value={lvl} className="bg-slate-950">
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Major / Field of Study</label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g. Computer Science, Finance, Marketing"
                className="w-full px-4 py-3 rounded-xl glass-input"
                required
              />
            </div>
          </div>
        )}

        {/* STEP 3: INTERESTS & TARGET ROLE */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="text-xl font-bold text-white tracking-wide">Define your career target</h2>
            <p className="text-sm text-slate-400">Match your interests with our database of career roles.</p>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Interests (Keywords)</label>
              <textarea
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. machine learning, database tuning, API development, cloud architectures"
                rows={3}
                className="w-full px-4 py-3 rounded-xl glass-input resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Preferred Role Keywords (Text)</label>
              <input
                type="text"
                value={preferredRoles}
                onChange={(e) => setPreferredRoles(e.target.value)}
                placeholder="e.g. Data Scientist, Backend Engineer"
                className="w-full px-4 py-3 rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Select Target Career Role</label>
              <input
                type="text"
                placeholder="Type to filter roles..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="w-full px-4 py-2 text-sm rounded-t-xl glass-input border-b-0"
              />
              <div className="rounded-b-xl border border-white/10 bg-slate-950/80 p-2 max-h-48 overflow-y-auto space-y-1">
                {filteredRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setTargetRoleId(role.id);
                      setRoleSearch(role.name);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      targetRoleId === role.id
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "hover:bg-white/5 text-slate-300"
                    }`}
                  >
                    <p className="font-semibold text-xs tracking-wider">{role.name}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{role.description}</p>
                  </button>
                ))}
                {filteredRoles.length === 0 && (
                  <p className="text-xs text-slate-500 p-2 text-center">No matching roles found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: LEARNING COMMITMENT */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="text-xl font-bold text-white tracking-wide">Select commitment and style</h2>
            <p className="text-sm text-slate-400">Configure how and when you intend to learn.</p>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Weekly Learning Hours: <span className="text-cyan-400 font-bold ml-1">{weeklyLearningHours} hours</span>
              </label>
              <input
                type="range"
                min="1"
                max="40"
                value={weeklyLearningHours}
                onChange={(e) => setWeeklyLearningHours(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>1 hr / week</span>
                <span>20 hrs / week</span>
                <span>40 hrs / week</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input"
              >
                {["Entry Level", "Beginner", "Intermediate", "Advanced", "Senior Level", "Professional"].map((lvl) => (
                  <option key={lvl} value={lvl} className="bg-slate-950">
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Preferred Learning Style</label>
              <select
                value={preferredLearningStyle}
                onChange={(e) => setPreferredLearningStyle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input"
              >
                {["Hands-on", "Video", "Reading", "Mixed"].map((style) => (
                  <option key={style} value={style} className="bg-slate-950">
                    {style}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* STEP 5: SKILL SELF-ASSESSMENT */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="text-xl font-bold text-white tracking-wide">Skill self-assessment</h2>
            <p className="text-sm text-slate-400">Identify skills you already possess and rate your proficiency (1-5).</p>

            {/* Selected Skills List */}
            {selectedSkills.length > 0 && (
              <div className="space-y-3 p-4 rounded-xl border border-white/5 bg-slate-950/40">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Skill Levels</p>
                <div className="space-y-3">
                  {selectedSkills.map((sk) => (
                     <div key={sk.slug} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedSkills((prev) => prev.filter((s) => s.slug !== sk.slug))}
                          className="text-slate-500 hover:text-rose-400 text-xs font-bold transition-colors"
                        >
                          ✕
                        </button>
                        <span className="text-sm text-white font-medium">{sk.name}</span>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={sk.level}
                          onChange={(e) => handleSkillLevelChange(sk.slug, Number(e.target.value))}
                          className="w-full md:w-32 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                        />
                        <span className="text-xs font-semibold text-emerald-400 w-12 text-right">
                          {["Novice", "Basic", "Competent", "Proficient", "Expert"][sk.level - 1]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Selector Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Search and Add Skills</label>
              <input
                type="text"
                placeholder="Type skill name to search... (e.g. Python, SQL)"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input"
              />

              {skillSearch && (
                <div className="mt-2 p-2 rounded-xl border border-white/5 bg-slate-950 max-h-40 overflow-y-auto flex flex-wrap gap-2">
                  {filteredSkills.map((sk) => (
                    <button
                      key={sk.id}
                      type="button"
                      onClick={() => {
                        handleToggleSkill(sk);
                        setSkillSearch("");
                      }}
                      className="px-3 py-1.5 text-xs rounded-full border border-white/10 bg-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-300 transition-all"
                    >
                      + {sk.name}
                    </button>
                  ))}
                  {filteredSkills.length === 0 && (
                    <p className="text-xs text-slate-500 p-2">No unmatched skills found.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW & SUBMIT */}
        {currentStep === 6 && (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="text-xl font-bold text-white tracking-wide">Review your configurations</h2>
            <p className="text-sm text-slate-400">Verify your information before saving.</p>

            <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-5 space-y-4 text-sm text-slate-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Name</p>
                  <p className="font-semibold text-white mt-1">{fullName || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Education</p>
                  <p className="font-semibold text-white mt-1">{educationLevel} · {major}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Interests</p>
                  <p className="font-semibold text-white mt-1">{interests}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Target Role</p>
                  <p className="font-semibold text-cyan-400 mt-1">
                    {roles.find((r) => r.id === targetRoleId)?.name || "Not selected"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Weekly Hours</p>
                  <p className="font-semibold text-white mt-1">{weeklyLearningHours} hours / week</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Style & Level</p>
                  <p className="font-semibold text-white mt-1">{experienceLevel} · {preferredLearningStyle}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase mb-2">Assessed Skills ({selectedSkills.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((sk) => (
                    <span
                      key={sk.slug}
                      className="px-2.5 py-1 text-xs rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                    >
                      {sk.name} (L{sk.level})
                    </span>
                  ))}
                  {selectedSkills.length === 0 && (
                    <p className="text-xs text-slate-500 italic">No skills selected.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Controls */}
        <div className="flex justify-between items-center pt-4 border-t border-white/5">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={loading}
              className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold transition-all disabled:opacity-50"
            >
              Previous
            </button>
          ) : (
            <div />
          )}

          {currentStep === 1 && (
             <button
             type="button"
             onClick={handleNext}
             disabled={extracting}
             className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold transition-all disabled:opacity-50"
           >
             Skip Setup
           </button>
          )}

          {currentStep > 1 && currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext()}
              className="px-6 py-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
            >
              Continue
            </button>
          ) : currentStep === 6 ? (
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(34,211,238,0.35)] disabled:opacity-50"
            >
              {loading ? "Saving Profile..." : "Complete & Generate"}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
