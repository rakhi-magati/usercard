export const COMPANIES = [
  { id: "1", name: "Company A" },
  { id: "2", name: "Company B" },
];

export const getCompanyName = (companyId) =>
  COMPANIES.find((company) => company.id === String(companyId))?.name || COMPANIES[0].name;

export const getCompanyIdByName = (companyName) => {
  const normalizedName = String(companyName || "").trim().toLowerCase();
  return COMPANIES.find((company) => company.name.toLowerCase() === normalizedName)?.id;
};

export const getUserCompanyId = (user = {}) => {
  const savedCompanyId = user.company_id || user.companyId;
  if (savedCompanyId) return String(savedCompanyId);

  return (
    getCompanyIdByName(user.company_name) ||
    getCompanyIdByName(user.companyName) ||
    getCompanyIdByName(user.company) ||
    COMPANIES[0].id
  );
};
