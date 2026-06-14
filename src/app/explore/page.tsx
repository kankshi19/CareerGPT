import { getCatalog } from "@/lib/data";
import { ExploreClient } from "./explore-client";

export default async function ExplorePage() {
  const { roles, roleSkills, roleCertifications, roleTechnologies, technologies, skills, certifications } = await getCatalog();
  
  return (
    <ExploreClient 
      roles={roles}
      skills={skills}
      certifications={certifications}
      technologies={technologies}
      roleSkills={roleSkills}
      roleCertifications={roleCertifications}
      roleTechnologies={roleTechnologies}
    />
  );
}
