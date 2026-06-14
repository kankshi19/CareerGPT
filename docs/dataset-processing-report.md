# Dataset Processing Report\n\n{
  "sourceFiles": [
    "D:\\Projects\\AI projects\\CareerGPT\\data\\raw\\IT_Job_Roles_Skills.csv",
    "D:\\Projects\\AI projects\\CareerGPT\\data\\raw\\Technology Skills.xlsx"
  ],
  "rowCounts": {
    "jobRoleDataset": 493,
    "onetTechnologyDataset": 27858
  },
  "afterCleaning": {
    "roles": 352,
    "skills": 687,
    "certifications": 492,
    "technologies": 8767
  },
  "duplicatesRemoved": {
    "roleSkillRequirements": 374,
    "roleCertifications": 49,
    "roleTechnologies": 0
  },
  "unmatchedRoleMappings": 27858,
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