import csv
import json
import re
import unicodedata
import zipfile
from collections import OrderedDict
from pathlib import Path
import xml.etree.ElementTree as ET
from difflib import SequenceMatcher

ROOT = Path(r"D:\Projects\AI projects\CareerGPT")
CSV_PATH = ROOT / "data" / "raw" / "IT_Job_Roles_Skills.csv"
XLSX_PATH = ROOT / "data" / "raw" / "Technology Skills.xlsx"
OUT = ROOT / "data" / "processed"
OUT.mkdir(parents=True, exist_ok=True)
ALIASES_PATH = ROOT / "data" / "config" / "role-title-aliases.json"
ALIASES = json.loads(ALIASES_PATH.read_text(encoding="utf-8")) if ALIASES_PATH.exists() else {"aliases": {}}

def clean(s):
    if s is None:
        return ""
    s = str(s).replace("â€“", "-").replace("Â", "")
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def slugify(s):
    s = clean(s).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return re.sub(r"-+", "-", s).strip("-")

def split_items(s):
    if not s:
        return []
    parts = [clean(p) for p in re.split(r",|;", s)]
    return [p for p in parts if p]

def normalize_title(s):
    s = clean(s).lower()
    s = re.sub(r"[^\w\s]", "", s)
    return re.sub(r"\s+", " ", s).strip()

def read_csv():
    with CSV_PATH.open(newline="", encoding="cp1252") as f:
        return list(csv.DictReader(f))

def read_xlsx():
    with zipfile.ZipFile(XLSX_PATH) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            sst = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in sst:
                texts = [t.text or "" for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")]
                shared.append("".join(texts))
        tree = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
        rows = []
        for row in tree.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row")[1:]:
            vals = []
            for c in row.findall("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c"):
                v = c.find("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v")
                val = "" if v is None else v.text
                if c.attrib.get("t") == "s":
                    val = shared[int(val)]
                vals.append(val)
            rows.append(vals)
        return rows

csv_rows = read_csv()
xlsx_rows = read_xlsx()

roles = OrderedDict()
skills = OrderedDict()
certifications = OrderedDict()
technologies = OrderedDict()
role_skill_reqs = []
role_certs = []
role_techs = []
unmatched = []

for row in csv_rows:
    title = clean(row.get("Job Title"))
    if not title:
        continue
    role_key = slugify(title)
    roles.setdefault(role_key, {
        "id": role_key,
        "slug": role_key,
        "title": title,
        "description": clean(row.get("Job Description")),
        "onetSocCode": None,
        "source": "job-role-dataset",
        "raw": row
    })
    for s in dict.fromkeys(split_items(row.get("Skills"))):
        sk = slugify(s)
        skills.setdefault(sk, {"id": sk, "slug": sk, "name": s, "category": None, "source": "job-role-dataset"})
        role_skill_reqs.append({"roleId": role_key, "skillId": sk, "importanceScore": 5, "requirementType": "core", "source": "job-role-dataset"})
    for cert in dict.fromkeys(split_items(row.get("Certifications"))):
        ck = slugify(cert)
        certifications.setdefault(ck, {"id": ck, "slug": ck, "name": cert, "issuer": None, "source": "job-role-dataset"})
        role_certs.append({"roleId": role_key, "certificationId": ck, "relevanceScore": 5, "source": "job-role-dataset"})

title_index = {normalize_title(v["title"]): k for k, v in roles.items()}
exact_title_index = {v["title"]: k for k, v in roles.items()}
reviewed_matches = []
for vals in xlsx_rows:
    if len(vals) < 6:
        continue
    onet, title, example, commodity_code, commodity_title, hot = [clean(v) for v in vals[:6]]
    if not example:
        continue
    tech_key = slugify(example)
    technologies.setdefault(tech_key, {
        "id": tech_key,
        "slug": tech_key,
        "name": example,
        "commodityCode": commodity_code or None,
        "commodityTitle": commodity_title or None,
        "isHotTechnology": hot.upper() == "Y",
        "source": "onet-technology-dataset"
    })
    normalized = normalize_title(title)
    match_method = "unresolved"
    match_confidence = 0.0
    role_key = exact_title_index.get(title)
    if role_key:
        match_method = "exact"
        match_confidence = 1.0
    else:
        role_key = title_index.get(normalized)
        if role_key:
            match_method = "normalized"
            match_confidence = 0.98
        else:
            alias_key = ALIASES.get("aliases", {}).get(normalized)
            if alias_key and alias_key in roles:
                role_key = alias_key
                match_method = "alias"
                match_confidence = 0.95
            else:
                best_key = None
                best_score = 0.0
                first_token = normalized.split(" ")[0] if normalized else ""
                candidates = [item for item in title_index.items() if item[0].startswith(first_token[:3]) or first_token in item[0]]
                if not candidates:
                    candidates = list(title_index.items())[:200]
                for candidate_title, candidate_key in candidates:
                    score = SequenceMatcher(None, normalized, candidate_title).ratio()
                    if score > best_score:
                        best_score = score
                        best_key = candidate_key
                if best_key and best_score >= 0.92:
                    role_key = best_key
                    match_method = "fuzzy"
                    match_confidence = round(best_score, 3)
                    reviewed_matches.append({"rawTitle": title, "matchedRoleId": role_key, "confidence": match_confidence, "method": match_method, "onetSocCode": onet, "technology": example})
    if role_key:
        role_techs.append({"roleId": role_key, "technologyId": tech_key, "onetSocCode": onet or None, "source": "onet-technology-dataset"})
        if not roles[role_key].get("onetSocCode") and onet:
            roles[role_key]["onetSocCode"] = onet
    else:
        unmatched.append({"rawTitle": title, "onetSocCode": onet, "technology": example, "reason": "No exact or normalized title match"})

def dedupe(items):
    seen = set()
    out = []
    for item in items:
        key = json.dumps(item, sort_keys=True)
        if key not in seen:
            seen.add(key)
            out.append(item)
    return out

outputs = {
    "roles.json": list(roles.values()),
    "skills.json": list(skills.values()),
    "role-skill-requirements.json": dedupe(role_skill_reqs),
    "certifications.json": list(certifications.values()),
    "role-certifications.json": dedupe(role_certs),
    "technologies.json": list(technologies.values()),
    "role-technologies.json": dedupe(role_techs),
    "unmatched-role-mappings.json": unmatched,
    "reviewed-role-matches.json": reviewed_matches
}

for name, data in outputs.items():
    (OUT / name).write_text(json.dumps(data, indent=2), encoding="utf-8")

report = {
    "sourceFiles": [str(CSV_PATH), str(XLSX_PATH)],
    "rowCounts": {"jobRoleDataset": len(csv_rows), "onetTechnologyDataset": len(xlsx_rows)},
    "afterCleaning": {"roles": len(roles), "skills": len(skills), "certifications": len(certifications), "technologies": len(technologies)},
    "duplicatesRemoved": {
        "roleSkillRequirements": len(role_skill_reqs) - len(outputs["role-skill-requirements.json"]),
        "roleCertifications": len(role_certs) - len(outputs["role-certifications.json"]),
        "roleTechnologies": len(role_techs) - len(outputs["role-technologies.json"])
    },
    "unmatchedRoleMappings": len(unmatched),
    "reviewedMatches": len(reviewed_matches),
    "matchCounts": {
        "exact": sum(1 for item in reviewed_matches if item["method"] == "exact"),
        "normalized": sum(1 for item in reviewed_matches if item["method"] == "normalized"),
        "alias": sum(1 for item in reviewed_matches if item["method"] == "alias"),
        "fuzzy": sum(1 for item in reviewed_matches if item["method"] == "fuzzy"),
        "unresolved": len(unmatched)
    },
    "assumptions": [
        "Comma-separated skills/certifications were normalized into individual records.",
        "Exact then normalized title matching was used for role alignment.",
        "Unmatched rows were retained in the review log."
    ],
    "qualityIssues": [
        "CSV includes replacement characters in a few certification strings.",
        "XLSX contains many repeated role-title rows with distinct technologies."
    ],
    "appMapping": {
        "roles.json": "CareerRole",
        "skills.json": "Skill",
        "role-skill-requirements.json": "RoleSkillRequirement",
        "certifications.json": "Certification",
        "role-certifications.json": "RoleCertification",
        "technologies.json": "Technology",
        "role-technologies.json": "RoleTechnology"
    }
}
(ROOT / "docs" / "dataset-processing-report.md").write_text("# Dataset Processing Report\\n\\n" + json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
