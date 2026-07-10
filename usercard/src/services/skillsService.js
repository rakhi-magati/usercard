import axios from "axios";

const API = "http://127.0.0.1:8000";
const SKILLS_API = `${API}/skills`;

const getActorEmail = () => localStorage.getItem("email") || "";
const getCompanyId = () => localStorage.getItem("company_id") || "1";

export const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
export const CERTIFICATION_STATUSES = ["Valid", "Expiring Soon", "Expired", "No Expiry"];

export const getMyDocumentUrl = (certId, companyId = getCompanyId(), actorEmail = getActorEmail()) =>
  `${SKILLS_API}/certifications/${certId}/document?company_id=${companyId}&actor_email=${encodeURIComponent(actorEmail)}`;

// --- Skills 

export const getSkills = async (employeeId, companyId = getCompanyId()) => {
  const response = await axios.get(`${SKILLS_API}/`, {
    params: { employee_id: employeeId, company_id: companyId, actor_email: getActorEmail() },
  });
  return response.data.data;
};

export const addSkill = async (employeeId, skill, companyId = getCompanyId()) => {
  const response = await axios.post(`${SKILLS_API}/`, {
    employee_id: employeeId,
    company_id: companyId,
    actor_email: getActorEmail(),
    ...skill,
  });
  return response.data.data;
};

export const updateSkill = async (skillId, skill, companyId = getCompanyId()) => {
  const response = await axios.put(`${SKILLS_API}/${skillId}`, {
    company_id: companyId,
    actor_email: getActorEmail(),
    ...skill,
  });
  return response.data.data;
};

export const deleteSkill = async (skillId, companyId = getCompanyId()) => {
  const response = await axios.delete(`${SKILLS_API}/${skillId}`, {
    params: { company_id: companyId, actor_email: getActorEmail() },
  });
  return response.data.data;
};

// --- Certifications 

export const getCertifications = async (employeeId, companyId = getCompanyId()) => {
  const response = await axios.get(`${SKILLS_API}/certifications`, {
    params: { employee_id: employeeId, company_id: companyId, actor_email: getActorEmail() },
  });
  return response.data.data;
};

const buildCertificationForm = (employeeId, cert, companyId, file, removeDocument) => {
  const form = new FormData();
  form.append("employee_id", employeeId);
  form.append("company_id", companyId);
  form.append("actor_email", getActorEmail());
  if (cert.certification_name !== undefined) form.append("certification_name", cert.certification_name);
  if (cert.issuing_organization !== undefined) form.append("issuing_organization", cert.issuing_organization);
  if (cert.issue_date !== undefined) form.append("issue_date", cert.issue_date || "");
  if (cert.expiry_date !== undefined) form.append("expiry_date", cert.expiry_date || "");
  if (removeDocument) form.append("remove_document", "true");
  if (file) form.append("document", file);
  return form;
};

export const addCertification = async (employeeId, cert, file, companyId = getCompanyId()) => {
  const form = buildCertificationForm(employeeId, cert, companyId, file, false);
  const response = await axios.post(`${SKILLS_API}/certifications`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const updateCertification = async (certId, cert, file, removeDocument, companyId = getCompanyId()) => {
  const form = buildCertificationForm(null, cert, companyId, file, removeDocument);
  form.delete("employee_id");
  const response = await axios.put(`${SKILLS_API}/certifications/${certId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const deleteCertification = async (certId, companyId = getCompanyId()) => {
  const response = await axios.delete(`${SKILLS_API}/certifications/${certId}`, {
    params: { company_id: companyId, actor_email: getActorEmail() },
  });
  return response.data.data;
};

export const checkExpiringCertifications = async (companyId = getCompanyId()) => {
  const response = await axios.post(`${SKILLS_API}/certifications/check-expiry`, null, {
    params: { company_id: companyId, actor_email: getActorEmail() },
  });
  return response.data;
};

// --- Summary / Admin 
export const getCompetencySummary = async (employeeId, companyId = getCompanyId()) => {
  const response = await axios.get(`${SKILLS_API}/summary`, {
    params: { employee_id: employeeId, company_id: companyId, actor_email: getActorEmail() },
  });
  return response.data.data;
};

export const getAdminCompetencyDirectory = async ({
  companyId = getCompanyId(),
  skill,
  skillLevel,
  minYearsExperience,
  certificationName,
  certificationStatus,
} = {}) => {
  const response = await axios.get(`${SKILLS_API}/admin/directory`, {
    params: {
      company_id: companyId,
      actor_email: getActorEmail(),
      skill: skill || undefined,
      skill_level: skillLevel || undefined,
      min_years_experience: minYearsExperience || undefined,
      certification_name: certificationName || undefined,
      certification_status: certificationStatus || undefined,
    },
  });
  return response.data.data;
};
