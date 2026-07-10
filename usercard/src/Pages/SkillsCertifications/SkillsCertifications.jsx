import { useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaStar,
  FaRegStar,
  FaCertificate,
  FaDownload,
  FaSearch,
  FaFileExport,
  FaTimes,
  FaGraduationCap,
} from "react-icons/fa";
import {
  PROFICIENCY_LEVELS,
  CERTIFICATION_STATUSES,
  getSkills,
  addSkill,
  updateSkill,
  deleteSkill,
  getCertifications,
  addCertification,
  updateCertification,
  deleteCertification,
  getCompetencySummary,
  getAdminCompetencyDirectory,
  getMyDocumentUrl,
} from "../../services/skillsService";
import "./SkillsCertifications.css";

const emptySkillForm = { skill_name: "", proficiency_level: "Beginner", years_experience: 0, is_primary: false };
const emptyCertForm = { certification_name: "", issuing_organization: "", issue_date: "", expiry_date: "" };

const toCsvValue = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function SkillsCertifications() {
  const role = (localStorage.getItem("role") || "user").toLowerCase();
  const isAdmin = role === "admin";
  const companyId = localStorage.getItem("company_id") || "1";
  const employeeId = parseInt(localStorage.getItem("employeeId") || "0", 10);

  const [activeTab, setActiveTab] = useState("mine");

  const [skills, setSkills] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [skillForm, setSkillForm] = useState(emptySkillForm);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [showSkillForm, setShowSkillForm] = useState(false);

  const [certForm, setCertForm] = useState(emptyCertForm);
  const [certFile, setCertFile] = useState(null);
  const [editingCertId, setEditingCertId] = useState(null);
  const [showCertForm, setShowCertForm] = useState(false);

  // Admin directory state
  const [directory, setDirectory] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const [skillLevelFilter, setSkillLevelFilter] = useState("");
  const [minYears, setMinYears] = useState("");
  const [certNameFilter, setCertNameFilter] = useState("");
  const [certStatusFilter, setCertStatusFilter] = useState("");

  const loadMine = async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [skillsData, certsData, summaryData] = await Promise.all([
        getSkills(employeeId, companyId),
        getCertifications(employeeId, companyId),
        getCompetencySummary(employeeId, companyId),
      ]);
      setSkills(skillsData || []);
      setCertifications(certsData || []);
      setSummary(summaryData);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load your skills and certifications.");
    } finally {
      setLoading(false);
    }
  };

  const loadDirectory = async () => {
    setDirectoryLoading(true);
    try {
      const data = await getAdminCompetencyDirectory({
        companyId,
        skill: skillSearch,
        skillLevel: skillLevelFilter,
        minYearsExperience: minYears,
        certificationName: certNameFilter,
        certificationStatus: certStatusFilter,
      });
      setDirectory(data || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load the company directory.");
    } finally {
      setDirectoryLoading(false);
    }
  };

  useEffect(() => {
    loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, companyId]);

  useEffect(() => {
    if (isAdmin && activeTab === "directory") loadDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, activeTab, skillSearch, skillLevelFilter, minYears, certNameFilter, certStatusFilter]);

  // --- Skill handlers -----------------------------------------------------

  const openAddSkill = () => {
    setSkillForm(emptySkillForm);
    setEditingSkillId(null);
    setShowSkillForm(true);
  };

  const openEditSkill = (skill) => {
    setSkillForm({
      skill_name: skill.skill_name,
      proficiency_level: skill.proficiency_level,
      years_experience: skill.years_experience,
      is_primary: skill.is_primary,
    });
    setEditingSkillId(skill.id);
    setShowSkillForm(true);
  };

  const submitSkill = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingSkillId) {
        await updateSkill(editingSkillId, skillForm, companyId);
      } else {
        await addSkill(employeeId, skillForm, companyId);
      }
      setShowSkillForm(false);
      loadMine();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save skill");
    }
  };

  const removeSkill = async (skill) => {
    if (!window.confirm(`Remove "${skill.skill_name}" from your skills?`)) return;
    try {
      await deleteSkill(skill.id, companyId);
      loadMine();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not delete skill");
    }
  };

  const togglePrimary = async (skill) => {
    try {
      await updateSkill(skill.id, { ...skill, is_primary: !skill.is_primary }, companyId);
      loadMine();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update skill");
    }
  };

  // --- Certification handlers ---------------------------------------------

  const openAddCert = () => {
    setCertForm(emptyCertForm);
    setCertFile(null);
    setEditingCertId(null);
    setShowCertForm(true);
  };

  const openEditCert = (cert) => {
    setCertForm({
      certification_name: cert.certification_name,
      issuing_organization: cert.issuing_organization,
      issue_date: cert.issue_date || "",
      expiry_date: cert.expiry_date || "",
    });
    setCertFile(null);
    setEditingCertId(cert.id);
    setShowCertForm(true);
  };

  const submitCert = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingCertId) {
        await updateCertification(editingCertId, certForm, certFile, false, companyId);
      } else {
        await addCertification(employeeId, certForm, certFile, companyId);
      }
      setShowCertForm(false);
      loadMine();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save certification");
    }
  };

  const removeCert = async (cert) => {
    if (!window.confirm(`Delete certification "${cert.certification_name}"?`)) return;
    try {
      await deleteCertification(cert.id, companyId);
      loadMine();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not delete certification");
    }
  };

  // --- Admin export --------------------------------------------------------

  const exportDirectory = () => {
    const header = ["Employee Name", "Email", "Department", "Skills", "Certifications"];
    const rows = directory.map((emp) => [
      emp.employee_name,
      emp.employee_email,
      emp.department,
      emp.skills.map((s) => `${s.skill_name} (${s.proficiency_level}, ${s.years_experience}y${s.is_primary ? ", primary" : ""})`).join("; "),
      emp.certifications.map((c) => `${c.certification_name} - ${c.issuing_organization} [${c.status}]`).join("; "),
    ]);
    const csv = [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employee-competency-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusClass = (status) => status.toLowerCase().replace(/\s+/g, "-");

  if (!employeeId && activeTab === "mine") {
    return (
      <div className="skc-page">
        <div className="skc-empty">We couldn&apos;t find your employee record. Please contact your administrator.</div>
      </div>
    );
  }

  return (
    <div className="skc-page">
      <div className="skc-header">
        <h1><FaGraduationCap /> Skills &amp; Certifications</h1>
        <p>Maintain your professional skills and certifications.</p>
      </div>

      {isAdmin && (
        <div className="skc-tabs">
          <button className={activeTab === "mine" ? "active" : ""} onClick={() => setActiveTab("mine")}>My Skills &amp; Certifications</button>
          <button className={activeTab === "directory" ? "active" : ""} onClick={() => setActiveTab("directory")}>Company Directory</button>
        </div>
      )}

      {error && <div className="skc-error">{error}</div>}

      {activeTab === "mine" && (
        <>
          {summary && (
            <div className="skc-summary">
              <div className="skc-summary-card"><strong>{summary.total_skills}</strong><p>Total Skills</p></div>
              <div className="skc-summary-card"><strong>{summary.primary_skills}</strong><p>Primary Skills</p></div>
              <div className="skc-summary-card"><strong>{summary.active_certifications}</strong><p>Active Certifications</p></div>
              <div className="skc-summary-card"><strong>{summary.expired_certifications}</strong><p>Expired Certifications</p></div>
              <div className="skc-summary-card"><strong>+{summary.profile_completion_contribution}%</strong><p>Profile Completion Contribution</p></div>
            </div>
          )}

          <section className="skc-card">
            <div className="skc-card-header">
              <h3>Skills</h3>
              <button className="skc-btn primary" onClick={openAddSkill}><FaPlus /> Add Skill</button>
            </div>

            {showSkillForm && (
              <form className="skc-form" onSubmit={submitSkill}>
                <div className="skc-form-grid">
                  <label>
                    Skill Name *
                    <input
                      value={skillForm.skill_name}
                      onChange={(e) => setSkillForm((f) => ({ ...f, skill_name: e.target.value }))}
                      placeholder="e.g. React, Project Management"
                      required
                    />
                  </label>
                  <label>
                    Proficiency Level
                    <select
                      value={skillForm.proficiency_level}
                      onChange={(e) => setSkillForm((f) => ({ ...f, proficiency_level: e.target.value }))}
                    >
                      {PROFICIENCY_LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>
                  </label>
                  <label>
                    Years of Experience
                    <input
                      type="number"
                      min="0"
                      value={skillForm.years_experience}
                      onChange={(e) => setSkillForm((f) => ({ ...f, years_experience: e.target.value }))}
                    />
                  </label>
                  <label className="skc-checkbox-label">
                    <input
                      type="checkbox"
                      checked={skillForm.is_primary}
                      onChange={(e) => setSkillForm((f) => ({ ...f, is_primary: e.target.checked }))}
                    />
                    Mark as primary / core skill
                  </label>
                </div>
                <div className="skc-form-actions">
                  <button type="submit" className="skc-btn primary">{editingSkillId ? "Save Changes" : "Add Skill"}</button>
                  <button type="button" className="skc-btn ghost" onClick={() => setShowSkillForm(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div className="skc-table-wrap">
              <table className="skc-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Skill</th>
                    <th>Proficiency</th>
                    <th>Years</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.length ? skills.map((skill) => (
                    <tr key={skill.id}>
                      <td>
                        <button className="skc-icon-btn" title="Toggle primary skill" onClick={() => togglePrimary(skill)}>
                          {skill.is_primary ? <FaStar className="skc-star-filled" /> : <FaRegStar />}
                        </button>
                      </td>
                      <td><strong>{skill.skill_name}</strong></td>
                      <td>{skill.proficiency_level}</td>
                      <td>{skill.years_experience}</td>
                      <td>
                        <div className="skc-actions">
                          <button className="skc-icon-btn" onClick={() => openEditSkill(skill)}><FaEdit /></button>
                          <button className="skc-icon-btn danger" onClick={() => removeSkill(skill)}><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="skc-empty-row">{loading ? "Loading..." : "No skills added yet."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="skc-card">
            <div className="skc-card-header">
              <h3>Certifications</h3>
              <button className="skc-btn primary" onClick={openAddCert}><FaPlus /> Add Certification</button>
            </div>

            {showCertForm && (
              <form className="skc-form" onSubmit={submitCert}>
                <div className="skc-form-grid">
                  <label>
                    Certification Name *
                    <input
                      value={certForm.certification_name}
                      onChange={(e) => setCertForm((f) => ({ ...f, certification_name: e.target.value }))}
                      placeholder="e.g. AWS Solutions Architect"
                      required
                    />
                  </label>
                  <label>
                    Issuing Organization *
                    <input
                      value={certForm.issuing_organization}
                      onChange={(e) => setCertForm((f) => ({ ...f, issuing_organization: e.target.value }))}
                      placeholder="e.g. Amazon Web Services"
                      required
                    />
                  </label>
                  <label>
                    Issue Date
                    <input
                      type="date"
                      value={certForm.issue_date}
                      onChange={(e) => setCertForm((f) => ({ ...f, issue_date: e.target.value }))}
                    />
                  </label>
                  <label>
                    Expiry Date (if applicable)
                    <input
                      type="date"
                      value={certForm.expiry_date}
                      onChange={(e) => setCertForm((f) => ({ ...f, expiry_date: e.target.value }))}
                    />
                  </label>
                  <label className="skc-file-label">
                    Certification Document (PDF, PNG, JPG, DOC)
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) => setCertFile(e.target.files[0] || null)}
                    />
                  </label>
                </div>
                <div className="skc-form-actions">
                  <button type="submit" className="skc-btn primary">{editingCertId ? "Save Changes" : "Add Certification"}</button>
                  <button type="button" className="skc-btn ghost" onClick={() => setShowCertForm(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div className="skc-table-wrap">
              <table className="skc-table">
                <thead>
                  <tr>
                    <th>Certification</th>
                    <th>Issuing Organization</th>
                    <th>Issue Date</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th>Document</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certifications.length ? certifications.map((cert) => (
                    <tr key={cert.id}>
                      <td><strong><FaCertificate /> {cert.certification_name}</strong></td>
                      <td>{cert.issuing_organization}</td>
                      <td>{cert.issue_date || "-"}</td>
                      <td>{cert.expiry_date || "No Expiry"}</td>
                      <td><span className={`skc-badge ${statusClass(cert.status)}`}>{cert.status}</span></td>
                      <td>
                        {cert.document_path ? (
                          <a href={getMyDocumentUrl(cert.id, companyId)} target="_blank" rel="noreferrer" className="skc-icon-btn">
                            <FaDownload />
                          </a>
                        ) : "-"}
                      </td>
                      <td>
                        <div className="skc-actions">
                          <button className="skc-icon-btn" onClick={() => openEditCert(cert)}><FaEdit /></button>
                          <button className="skc-icon-btn danger" onClick={() => removeCert(cert)}><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" className="skc-empty-row">{loading ? "Loading..." : "No certifications added yet."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {isAdmin && activeTab === "directory" && (
        <section className="skc-card">
          <div className="skc-card-header">
            <h3>Company Competency Directory</h3>
            <button className="skc-btn" onClick={exportDirectory}><FaFileExport /> Export Report</button>
          </div>

          <div className="skc-directory-toolbar">
            <label className="skc-search">
              <input value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} placeholder="Search by skill name..." />
              <FaSearch />
            </label>
            <select value={skillLevelFilter} onChange={(e) => setSkillLevelFilter(e.target.value)}>
              <option value="">Any Skill Level</option>
              {PROFICIENCY_LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>
            <input
              type="number"
              min="0"
              value={minYears}
              onChange={(e) => setMinYears(e.target.value)}
              placeholder="Min. years experience"
            />
            <input
              value={certNameFilter}
              onChange={(e) => setCertNameFilter(e.target.value)}
              placeholder="Certification name..."
            />
            <select value={certStatusFilter} onChange={(e) => setCertStatusFilter(e.target.value)}>
              <option value="">Any Certification Status</option>
              {CERTIFICATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>

          <div className="skc-directory-list">
            {directoryLoading ? (
              <p className="skc-empty-row">Loading directory...</p>
            ) : directory.length ? directory.map((emp) => (
              <div className="skc-directory-item" key={emp.employee_id}>
                <div className="skc-directory-item-header">
                  <div>
                    <strong>{emp.employee_name}</strong>
                    <small>{emp.employee_email} &middot; {emp.department}</small>
                  </div>
                </div>
                <div className="skc-directory-columns">
                  <div>
                    <h5>Skills</h5>
                    {emp.skills.length ? (
                      <ul>
                        {emp.skills.map((s) => (
                          <li key={s.id}>
                            {s.skill_name} <span className="skc-tag">{s.proficiency_level}</span> &middot; {s.years_experience}y
                            {s.is_primary && <FaStar className="skc-star-filled" title="Primary skill" />}
                          </li>
                        ))}
                      </ul>
                    ) : <p className="skc-muted">No skills listed.</p>}
                  </div>
                  <div>
                    <h5>Certifications</h5>
                    {emp.certifications.length ? (
                      <ul>
                        {emp.certifications.map((c) => (
                          <li key={c.id}>
                            {c.certification_name} ({c.issuing_organization}) <span className={`skc-badge ${statusClass(c.status)}`}>{c.status}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="skc-muted">No certifications listed.</p>}
                  </div>
                </div>
              </div>
            )) : (
              <p className="skc-empty-row">No employees match these filters.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default SkillsCertifications;
