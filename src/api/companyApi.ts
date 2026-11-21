import request from "./client";
import type {
  CompanyResponse,
  CompanyRequest,
  JobPostingResponse,
  JobPostingRequest,
} from "./types";

export function formatLocalDateTime(dateInput?: string | null): string {
  if (!dateInput || !dateInput.trim()) {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const yyyy = future.getFullYear();
    const mm = String(future.getMonth() + 1).padStart(2, "0");
    const dd = String(future.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T23:59:59`;
  }

  const trimmed = dateInput.trim();

  // If pure date format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T23:59:59`;
  }

  // If already YYYY-MM-DDTHH:mm:ss without timezone/millis
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    return trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  }

  // Parse ISO date or standard date
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    const hh = String(parsed.getHours()).padStart(2, "0");
    const min = String(parsed.getMinutes()).padStart(2, "0");
    const ss = String(parsed.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
  }

  // Fallback: strip Z and timezone offsets
  return trimmed.replace(/Z$/, "").replace(/([+-]\d{2}:\d{2})$/, "");
}

export const companyApi = {
  getAll: () => request<CompanyResponse[]>("/companies/all"),

  getById: (id: number) => request<CompanyResponse>(`/companies/${id}`),

  create: (data: CompanyRequest) =>
    request<CompanyResponse>("/companies/add", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (data: CompanyRequest) =>
    request<CompanyResponse>("/companies/update", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<string>(`/companies/delete/${id}`, { method: "DELETE" }),

  getJobPostings: (companyId: number) =>
    request<JobPostingResponse[]>(`/companies/job-postings/${companyId}`),

  addJobPosting: (companyId: number, data: JobPostingRequest) => {
    const numericSalary =
      typeof data.ctc === "number" && !isNaN(data.ctc)
        ? data.ctc
        : typeof data.salary === "number" && !isNaN(data.salary)
        ? data.salary
        : undefined;

    const payload = {
      ...data,
      companyId,
      ctc: numericSalary,
      salary: numericSalary,
      deadline: formatLocalDateTime(data.deadline),
    };

    return request<JobPostingResponse>(`/companies/${companyId}/job-postings`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};