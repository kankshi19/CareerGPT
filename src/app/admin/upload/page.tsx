import fs from "fs";
import path from "path";

const processedDir = path.join(process.cwd(), "data", "processed");

function readCount(name: string) {
  const file = path.join(processedDir, name);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")).length : 0;
}

export default function AdminUploadPage() {
  const rows = {
    roles: readCount("roles.json"),
    skills: readCount("skills.json"),
    certs: readCount("certifications.json"),
    techs: readCount("technologies.json"),
    unmatched: readCount("unmatched-role-mappings.json")
  };

  return (
    <main className="p-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-semibold">Admin ingestion</h1>
        <p className="mt-2 text-slate-300">Internal utility for rerunning the locked dataset processor and reviewing counts.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Stat label="Roles" value={rows.roles.toString()} />
          <Stat label="Skills" value={rows.skills.toString()} />
          <Stat label="Certifications" value={rows.certs.toString()} />
          <Stat label="Technologies" value={rows.techs.toString()} />
          <Stat label="Unmatched title mappings" value={rows.unmatched.toString()} />
        </div>
        <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-300">
          Run <code>npm run process:datasets</code> after replacing files in <code>data/raw/</code>, then run <code>npm run db:seed</code>.
        </div>
        <div className="mt-4 flex gap-3">
          <a className="rounded-full bg-white/10 px-4 py-2" href="/api/health">Health check</a>
          <a className="rounded-full bg-cyan-400 px-4 py-2 font-medium text-slate-950" href="/api/admin/unmatched">
            Download unmatched JSON
          </a>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
