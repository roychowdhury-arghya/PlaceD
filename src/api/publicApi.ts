import request from "./client";
import type { LookupItem } from "./types";

export const publicApi = {
  getColleges: () => request<LookupItem[]>("/public/colleges"),
  getCompanies: () => request<LookupItem[]>("/public/companies"),
};
