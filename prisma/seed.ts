import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dataDir = path.join(process.cwd(), "data", "processed");

function load(name: string) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));
}

async function main() {
  const roles = load("roles.json");
  const skills = load("skills.json");
  const reqs = load("role-skill-requirements.json");
  const certs = load("certifications.json");
  const roleCerts = load("role-certifications.json");
  const techs = load("technologies.json");
  const roleTechs = load("role-technologies.json");

  for (const row of skills) {
    await prisma.skill.upsert({
      where: { slug: row.slug },
      update: { name: row.name, category: row.category ?? "", source: row.source },
      create: {
        slug: row.slug,
        name: row.name,
        category: row.category ?? "",
        source: row.source ?? "seed"
      }
    });
  }

  for (const row of roles) {
    await prisma.careerRole.upsert({
      where: { slug: row.slug },
      update: { name: row.title, description: row.description, onetSocCode: row.onetSocCode, source: row.source },
      create: { slug: row.slug, name: row.title, description: row.description, onetSocCode: row.onetSocCode, source: row.source }
    });
  }

  for (const row of certs) {
    await prisma.certification.upsert({
      where: { slug: row.slug },
      update: { name: row.name, issuer: row.issuer, source: row.source },
      create: {
        slug: row.slug,
        name: row.name,
        issuer: row.issuer,
        source: row.source ?? "seed"
      }
    });
  }

  for (const row of techs) {
    await prisma.technology.upsert({
      where: { slug: row.slug },
      update: { name: row.name, commodityCode: row.commodityCode, commodityTitle: row.commodityTitle, isHotTechnology: row.isHotTechnology ?? false, source: row.source },
      create: {
        slug: row.slug,
        name: row.name,
        commodityCode: row.commodityCode,
        commodityTitle: row.commodityTitle,
        isHotTechnology: row.isHotTechnology ?? false,
        source: row.source ?? "onet"
      }
    });
  }

  const roleBySlug = new Map((await prisma.careerRole.findMany()).map((r) => [r.slug, r]));
  const skillBySlug = new Map((await prisma.skill.findMany()).map((s) => [s.slug, s]));
  const certBySlug = new Map((await prisma.certification.findMany()).map((c) => [c.slug, c]));
  const techBySlug = new Map((await prisma.technology.findMany()).map((t) => [t.slug, t]));

  for (const row of reqs) {
    const role = roleBySlug.get(row.roleId);
    const skill = skillBySlug.get(row.skillId);
    if (role && skill) {
      await prisma.roleSkillRequirement.upsert({
        where: { roleId_skillId: { roleId: role.id, skillId: skill.id } },
        update: { importanceScore: row.importanceScore, requirementType: row.requirementType, source: row.source },
        create: { roleId: role.id, skillId: skill.id, importanceScore: row.importanceScore, requirementType: row.requirementType, source: row.source }
      });
    }
  }

  for (const row of roleCerts) {
    const role = roleBySlug.get(row.roleId);
    const certification = certBySlug.get(row.certificationId);
    if (role && certification) {
      await prisma.roleCertification.upsert({
        where: { roleId_certificationId: { roleId: role.id, certificationId: certification.id } },
        update: { relevanceScore: row.relevanceScore, source: row.source },
        create: { roleId: role.id, certificationId: certification.id, relevanceScore: row.relevanceScore, source: row.source }
      });
    }
  }

  for (const row of roleTechs) {
    const role = roleBySlug.get(row.roleId);
    const technology = techBySlug.get(row.technologyId);
    if (role && technology) {
      await prisma.roleTechnology.upsert({
        where: { roleId_technologyId: { roleId: role.id, technologyId: technology.id } },
        update: { onetSocCode: row.onetSocCode, source: row.source },
        create: { roleId: role.id, technologyId: technology.id, onetSocCode: row.onetSocCode, source: row.source }
      });
    }
  }
}

main().finally(async () => prisma.$disconnect());
