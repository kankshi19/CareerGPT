"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface Technology {
  id: string;
  name: string;
  isHotTechnology: boolean;
}

interface Certification {
  id: string;
  name: string;
}

interface RoleSkillRequirement {
  roleId: string;
  skillId: string;
  skill: Skill;
}

interface RoleCertification {
  roleId: string;
  certificationId: string;
  certification: Certification;
}

interface RoleTechnology {
  roleId: string;
  technologyId: string;
  technology: Technology;
}

interface CareerRole {
  id: string;
  name: string;
  description: string;
  onetSocCode: string | null;
}

interface ExploreClientProps {
  roles: CareerRole[];
  skills: Skill[];
  certifications: Certification[];
  technologies: Technology[];
  roleSkills: RoleSkillRequirement[];
  roleCertifications: RoleCertification[];
  roleTechnologies: RoleTechnology[];
}

export function ExploreClient({
  roles,
  roleSkills,
  roleCertifications,
  roleTechnologies,
  technologies
}: ExploreClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchName = role.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDesc = role.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchName || matchDesc;
    });
  }, [roles, searchQuery]);

  return (
    <main className="p-8 min-h-screen">
      <div className="mx-auto max-w-6xl">
        
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Explore Careers
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg">
            Discover roles, map your skills, and see what technologies are driving the future.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="glass-card p-4 rounded-full flex items-center mb-10 max-w-3xl mx-auto ring-1 ring-white/10 hover:ring-cyan-500/30 transition-all">
          <div className="pl-4 pr-2 text-cyan-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input 
            type="text"
            placeholder="Search by role title or keyword (e.g. Data, Cloud, Engineer)..."
            className="bg-transparent border-none outline-none flex-1 px-4 text-slate-100 placeholder:text-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Results Grid */}
        {filteredRoles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">No roles found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {filteredRoles.map((r) => {
              const rSkills = roleSkills.filter((x) => x.roleId === r.id);
              const rCerts = roleCertifications.filter((x) => x.roleId === r.id);
              const rTech = roleTechnologies.filter((x) => x.roleId === r.id);
              
              // Get hot technologies for this role
              const hotTechs = rTech
                .filter((rt) => rt.technology.isHotTechnology)
                .slice(0, 3)
                .map((rt) => rt.technology.name);

              return (
                <div 
                  key={r.id} 
                  className="glass-card group rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_0_30px_-5px_rgba(34,211,238,0.2)]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">
                      {r.name}
                    </h3>
                    {r.onetSocCode && (
                      <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded border border-white/10 text-slate-400">
                        O*NET: {r.onetSocCode}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-slate-300 text-sm leading-relaxed mb-6 line-clamp-3">
                    {r.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-emerald-400">{rSkills.length}</div>
                      <div className="text-xs text-emerald-500/70 uppercase font-semibold">Skills</div>
                    </div>
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-cyan-400">{rTech.length}</div>
                      <div className="text-xs text-cyan-500/70 uppercase font-semibold">Techs</div>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-400">{rCerts.length}</div>
                      <div className="text-xs text-purple-500/70 uppercase font-semibold">Certs</div>
                    </div>
                  </div>

                  {hotTechs.length > 0 && (
                    <div className="mb-6">
                      <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">Hot Technologies</p>
                      <div className="flex flex-wrap gap-2">
                        {hotTechs.map((tech, idx) => (
                          <span key={idx} className="bg-orange-500/10 text-orange-400 text-xs px-2 py-1 rounded-md border border-orange-500/20">
                            🔥 {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/10 flex justify-end">
                    <Link 
                      href={`/dashboard?role=${r.id}`}
                      className="text-sm font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group-hover:underline underline-offset-4"
                    >
                      Compare on Dashboard
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
