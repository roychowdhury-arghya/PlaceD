import request from "./client";
import type {
  JobPostingResponse,
  JobPostingRequest,
  DriveWithCompany,
  CompanyResponse,
} from "./types";
import { companyApi } from "./companyApi";
import { applicationApi } from "./applicationApi";

export function extractDriveMeta(description?: string | null) {
  if (!description) return { cleanDesc: '', branches: null, skills: null, location: null };
  const metaMatch = description.match(/<!-- meta:(.*?) -->/);
  if (metaMatch) {
    try {
      const parsed = JSON.parse(metaMatch[1]);
      return {
        cleanDesc: description.replace(/<!-- meta:.*? -->/, '').trim(),
        branches: parsed.branches || null,
        skills: parsed.skills || null,
        location: parsed.location || null,
      };
    } catch {
      // ignore JSON parse error in malformed meta
    }
  }
  return { cleanDesc: description, branches: null, skills: null, location: null };
}

export function isBranchMatch(
  allowedBranches?: string[] | null,
  studentDepartment?: string | null
): boolean {
  if (!allowedBranches || allowedBranches.length === 0) return true;
  if (!studentDepartment) return true;

  const s = studentDepartment.trim().toLowerCase();

  const normalize = (branch: string) => {
    const b = branch.trim().toLowerCase();
    if (b === 'cse' || b.includes('computer')) return 'cse';
    if (b === 'it' || b.includes('information')) return 'it';
    if (b === 'ece' || b.includes('electronic') || b === 'etc') return 'ece';
    if (b === 'me' || b.includes('mechanical')) return 'me';
    if (b === 'ee' || b.includes('electrical')) return 'ee';
    if (b === 'ce' || b.includes('civil')) return 'ce';
    return b;
  };

  const studentNorm = normalize(s);

  return allowedBranches.some((branch) => {
    const branchNorm = normalize(branch);
    return branchNorm === studentNorm || branch.trim().toLowerCase() === s;
  });
}

export function normalizeJobPosting(jp: JobPostingResponse): JobPostingResponse {
  const onCampus = jp.jobPostingOnCampusResponseDTO;
  const offCampus = jp.jobPostingOffCampusResponseDTO;

  const meta = extractDriveMeta(jp.description);
  const cleanDescription = meta.cleanDesc || jp.description || '';

  const salary =
    jp.salary ??
    (onCampus?.ctc != null ? onCampus.ctc : null);

  const rawDeadline =
    jp.deadline ??
    onCampus?.deadline ??
    null;

  const deadline = rawDeadline
    ? (rawDeadline.includes('T') ? rawDeadline.split('T')[0] : rawDeadline)
    : null;

  const eligibleCGPACutoff =
    jp.eligibleCGPACutoff ??
    onCampus?.eligibleCGPACutoff ??
    null;

  const allowedBacklogs =
    jp.allowedBacklogs ??
    (onCampus?.allowedBacklogs != null ? onCampus.allowedBacklogs : null);

  const companyId =
    jp.companyId ??
    onCampus?.companyId ??
    null;

  const companyName =
    jp.companyName ??
    offCampus?.companyName ??
    null;

  const isCampus =
    jp.recruitmentType === 'CAMPUS' ||
    Boolean(onCampus) ||
    (!jp.recruitmentType &&
      (eligibleCGPACutoff != null ||
        jp.allowedBranches != null ||
        allowedBacklogs != null ||
        companyId != null ||
        !jp.applyUrl));

  const allowedBranches =
    jp.allowedBranches ||
    meta.branches ||
    (isCampus ? 'Computer Science, Information Technology, Electronics' : null);

  const requiredSkills =
    jp.requiredSkills ||
    meta.skills ||
    null;

  const location =
    jp.location ??
    offCampus?.location ??
    meta.location ??
    (isCampus ? 'Campus' : null);

  const applyUrl =
    jp.applyUrl ??
    offCampus?.applyUrl ??
    null;

  const source =
    jp.source ??
    offCampus?.source ??
    null;

  const postedAt =
    jp.postedAt ??
    offCampus?.postedAt ??
    null;

  const jobType =
    jp.jobType ??
    offCampus?.jobType ??
    null;

  const department =
    jp.department ??
    offCampus?.department ??
    null;

  const scrapedDate =
    jp.scrapedDate ??
    offCampus?.scrapedDate ??
    null;

  const recruitmentType: 'CAMPUS' | 'OFF_CAMPUS' = isCampus
    ? 'CAMPUS'
    : 'OFF_CAMPUS';

  return {
    ...jp,
    description: cleanDescription,
    salary,
    deadline,
    eligibleCGPACutoff,
    allowedBacklogs,
    allowedBranches,
    requiredSkills,
    companyId,
    companyName,
    location,
    applyUrl,
    source,
    postedAt,
    jobType,
    department,
    scrapedDate,
    recruitmentType,
    sourceType: jp.sourceType || (recruitmentType === 'OFF_CAMPUS' ? 'SCRAPER' : 'RECRUITER'),
  };
}

export const jobPostingApi = {
  getAll: async (): Promise<JobPostingResponse[]> => {
    const [rawPostings, companies] = await Promise.all([
      request<JobPostingResponse[]>("/job-postings/all"),
      companyApi.getAll().catch(() => []),
    ]);

    const postings = (rawPostings || []).map(normalizeJobPosting);

    const companyById = new Map<number, CompanyResponse>();
    const companyByName = new Map<string, CompanyResponse>();
    for (const c of companies || []) {
      if (c.id != null) companyById.set(c.id, c);
      if (c.name) companyByName.set(c.name.trim().toLowerCase(), c);
    }

    return (postings || []).map((jp) => {
      const company =
        (jp.companyId ? companyById.get(jp.companyId) : undefined) ||
        (jp.companyName ? companyByName.get(jp.companyName.trim().toLowerCase()) : undefined);

      return {
        ...jp,
        company: jp.company || company,
      };
    });
  },

  getById: async (id: number) => {
    const raw = await request<JobPostingResponse>(`/job-postings/${id}`);
    return normalizeJobPosting(raw);
  },

  getByCompany: (companyId: number) =>
    request<JobPostingResponse[]>(
      `/companies/job-postings/${companyId}`
    ),

  updateStatus: (id: number, status: string) =>
    request<JobPostingResponse>(
      `/job-postings/${id}/status?status=${encodeURIComponent(status)}`,
      { method: "PATCH" }
    ),

  delete: (id: number) =>
    request<string>(`/job-postings/delete/${id}`, { method: "DELETE" }),

  getAllWithCompanyInfo: async (): Promise<DriveWithCompany[]> => {
  const [rawPostings, companies, applications] = await Promise.all([
    request<JobPostingResponse[]>("/job-postings/all").catch(() => []),
    companyApi.getAll().catch(() => []),
    applicationApi.getAll().catch(() => []),
  ]);

  const postings = (rawPostings || []).map(normalizeJobPosting);

  const companyById = new Map<number, CompanyResponse>();
  const companyByName = new Map<string, CompanyResponse>();
  for (const company of companies || []) {
    if (company.id != null) companyById.set(company.id, company);
    if (company.name) companyByName.set(company.name.trim().toLowerCase(), company);
  }

  const registeredCountByPosting = new Map<number, number>();

  for (const application of applications) {
    registeredCountByPosting.set(
      application.jobPostingId,
      (registeredCountByPosting.get(application.jobPostingId) ?? 0) + 1
    );
  }

  return postings.map((jp): DriveWithCompany => {
    const company =
      (jp.companyId
        ? companyById.get(jp.companyId)
        : undefined) ||
      (jp.companyName
        ? companyByName.get(
            jp.companyName.trim().toLowerCase()
          )
        : undefined);

      const isCampus =
        jp.recruitmentType === 'CAMPUS' ||
        (!jp.recruitmentType &&
          (jp.eligibleCGPACutoff != null ||
            jp.allowedBranches != null ||
            jp.allowedBacklogs != null ||
            jp.companyId != null ||
            !jp.applyUrl));

      const recruitmentType: 'CAMPUS' | 'OFF_CAMPUS' = isCampus
        ? 'CAMPUS'
        : 'OFF_CAMPUS';

    const isOffCampus =
      recruitmentType === 'OFF_CAMPUS';

    const companyName =
      jp.companyName ||
      company?.name ||
      'Unknown Company';

    const companyId =
      jp.companyId ||
      company?.id ||
      0;

    const skills =
      jp.requiredSkills
        ?.split(',')
        .map((skill) => skill.trim())
        .filter(Boolean) ?? null;

    const branches =
      jp.allowedBranches
        ?.split(',')
        .map((branch) => branch.trim())
        .filter(Boolean) ?? null;

    return {
      id: String(jp.id),

      companyId,
      companyName,

      title: jp.title,
      description: jp.description ?? '',
      location: jp.location ?? '',

      package:
        jp.salary != null
          ? `${jp.salary} LPA`
          : 'Not disclosed',

      numericPackage: jp.salary ?? 0,

      // IMPORTANT:
      // Off-campus does NOT receive campus eligibility fields.
      cgpaCutoff: isOffCampus
        ? null
        : (jp.eligibleCGPACutoff ?? null),

      maxBacklogs: isOffCampus
        ? null
        : (jp.allowedBacklogs ?? null),

      allowedBranches: isOffCampus
        ? null
        : branches,

      eligibleBatch: isOffCampus
        ? null
        : (jp.eligibleBatch ?? null),

      deadline: isOffCampus
        ? null
        : (jp.deadline ?? null),

      skillsRequired: isOffCampus
        ? null
        : skills,

      status:
        jp.status === 'OPEN'
          ? 'OPEN'
          : 'CLOSED',

      registeredCount:
        registeredCountByPosting.get(jp.id) ?? 0,

      recruitmentType: recruitmentType as 'CAMPUS' | 'OFF_CAMPUS',

      sourceType: jp.sourceType,

      applyUrl: jp.applyUrl ?? null,
      source: jp.source ?? null,
      postedAt: jp.postedAt ?? null,
      jobType: jp.jobType ?? null,
      roleCategory: jp.roleCategory ?? null,
      department: jp.department ?? null,
      scrapedDate: jp.scrapedDate ?? null,
    };
  });
},

  createDrive: async (
    companyName: string,
    companyLocation: string,
    companyWebsite: string | undefined,
    jobData: JobPostingRequest
  ): Promise<DriveWithCompany> => {
    const companies = await companyApi.getAll().catch(() => []);
    const existing = companies.find(
      (c: { name: string; }) => c.name.trim().toLowerCase() === companyName.trim().toLowerCase()
    );

    const safeLocation = companyLocation?.trim() || jobData.location?.trim() || 'Campus';

    const company =
      existing ??
      (await companyApi.create({
        name: companyName.trim(),
        location: safeLocation,
        website: companyWebsite?.trim() || undefined,
      }).catch(() => ({
        id: Date.now(),
        name: companyName.trim(),
        location: safeLocation,
        website: companyWebsite?.trim() || '',
        description: '',
      })));

    let posting: JobPostingResponse;
    const metaPayload: Record<string, any> = {};
    if (jobData.allowedBranches) metaPayload.branches = jobData.allowedBranches;
    if (jobData.requiredSkills) metaPayload.skills = jobData.requiredSkills;
    if (safeLocation && safeLocation !== 'Campus') metaPayload.location = safeLocation;

    const baseDescription = jobData.description?.trim() || 'Recruitment drive for software engineering candidates.';
    const metaTag = Object.keys(metaPayload).length > 0 ? `\n\n<!-- meta:${JSON.stringify(metaPayload)} -->` : '';
    const fullDescription = `${baseDescription}${metaTag}`;

    try {
      posting = await companyApi.addJobPosting(
        company.id,
        {
          title: jobData.title,
          description: fullDescription,
          eligibleCGPACutoff:
            typeof jobData.eligibleCGPACutoff === 'number' && !isNaN(jobData.eligibleCGPACutoff)
              ? jobData.eligibleCGPACutoff
              : undefined,
          allowedBacklogs:
            typeof jobData.allowedBacklogs === 'number' && !isNaN(jobData.allowedBacklogs)
              ? jobData.allowedBacklogs
              : undefined,
          allowedBranches: jobData.allowedBranches || undefined,
          requiredSkills: jobData.requiredSkills || undefined,
          salary:
            typeof jobData.salary === 'number' && !isNaN(jobData.salary) && jobData.salary > 0
              ? jobData.salary
              : 6.0,
          ctc:
            typeof jobData.salary === 'number' && !isNaN(jobData.salary) && jobData.salary > 0
              ? jobData.salary
              : 6.0,
          deadline: jobData.deadline,
          companyId: company.id,
        }
      );
    } catch {
      posting = {
        id: Date.now(),
        title: jobData.title,
        description: baseDescription,
        salary: typeof jobData.salary === 'number' && !isNaN(jobData.salary) ? jobData.salary : 6.0,
        deadline: jobData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'OPEN',
        eligibleCGPACutoff: jobData.eligibleCGPACutoff ?? null,
        allowedBacklogs: jobData.allowedBacklogs ?? null,
        allowedBranches: jobData.allowedBranches || 'Computer Science, Information Technology, Electronics',
        companyId: company.id,
        companyName: company.name,
        location: safeLocation,
        recruitmentType: 'CAMPUS',
        sourceType: jobData.sourceType ?? 'TPO',
      };
    }

    return {
  id: String(posting.id),
  companyId: company.id,
  companyName: company.name,

  title: posting.title,
  description: posting.description,
  location: posting.location ?? '',

  package:
    posting.salary != null
      ? `${posting.salary} LPA`
      : 'N/A',

  numericPackage: posting.salary ?? 0,

  cgpaCutoff:
    posting.eligibleCGPACutoff ?? null,

  maxBacklogs:
    posting.allowedBacklogs ?? null,

  allowedBranches:
    posting.allowedBranches
      ? posting.allowedBranches
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean)
      : null,

  eligibleBatch:
    posting.eligibleBatch ?? null,

  deadline:
    posting.deadline ?? null,

  skillsRequired:
    posting.requiredSkills
      ? posting.requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null,

  status: 'OPEN',

  registeredCount: 0,

  // TPO/Recruiter-created drive
  recruitmentType: 'CAMPUS',

  sourceType:
    jobData.sourceType ?? 'TPO',

  applyUrl: posting.applyUrl ?? null,
  source: posting.source ?? null,
  postedAt: posting.postedAt ?? null,
  jobType: posting.jobType ?? null,
  roleCategory: posting.roleCategory ?? null,
  scrapedDate: posting.scrapedDate ?? null,
};
  },
};

export function isOnCampusDrive(drive: any): boolean {
  if (!drive) return false;
  const type = String(drive.recruitmentType || '').trim().toUpperCase();
  return (
    type === 'CAMPUS' ||
    type === 'ON_CAMPUS' ||
    type === 'ON CAMPUS' ||
    (!drive.recruitmentType && (drive.cgpaCutoff != null || drive.allowedBranches != null || !drive.applyUrl))
  );
}

export function isOffCampusDrive(drive: any): boolean {
  if (!drive) return false;
  const type = String(drive.recruitmentType || '').trim().toUpperCase();
  const source = String(drive.sourceType || '').trim().toUpperCase();
  return (
    type === 'OFF_CAMPUS' ||
    type === 'OFF CAMPUS' ||
    type === 'SCRAPPER' ||
    type === 'SCRAPER' ||
    source === 'SCRAPER' ||
    (!isOnCampusDrive(drive) && drive.applyUrl != null)
  );
}

export function isActiveDrive(drive: any): boolean {
  if (!drive) return false;
  const status = String(drive.status || '').trim().toUpperCase();
  return status === '' || status === 'OPEN' || status === 'ACTIVE';
}