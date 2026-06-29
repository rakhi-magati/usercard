import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBuilding, FaUser } from "react-icons/fa";
import { COMPANIES, getCompanyName, getUserCompanyId } from "../../constants/companies";
import "./Signup.css";


function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    company_id: "1",
  });

  const handleSignup = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const companyId = String(formData.company_id);
    const companyName = getCompanyName(companyId);

    const exists = users.find(
      (user) =>
        user.email === formData.email &&
        getUserCompanyId(user) === companyId
    );

    if (exists) {
      alert(`An account already exists for ${formData.email} in ${companyName}.`);
      return;
    }

    const newUser = {
      ...formData,
      company_id: companyId,
      companyId,
      company_name: companyName,
      companyName,
      status: "active",
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    alert(`Signup successful for ${companyName}`);
    navigate("/");
  };

  return (
    <div className="signup-container">
      <div className="signup-wrapper">
        <h2 className="signup-title">Create Account</h2>

        <form className="signup-card" onSubmit={handleSignup}>
          <div className="signup-icon"><FaUser /></div>

          <h2>Sign Up</h2>
          <p>Create your company employee account</p>

          <div className="signup-company-options" role="radiogroup" aria-label="Company selection">
            {COMPANIES.map((company) => (
              <button
                type="button"
                key={company.id}
                className={formData.company_id === company.id ? "active" : ""}
                onClick={() => setFormData({ ...formData, company_id: company.id })}
                role="radio"
                aria-checked={formData.company_id === company.id}
              >
                <FaBuilding />
                {company.name}
              </button>
            ))}
          </div>

          <div className="input-group">
            <label>Company</label>
            <div className="input-box">
              <FaBuilding />
              <select
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              >
                {COMPANIES.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Name</label>
            <div className="input-box">
              <input
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Email</label>
            <div className="input-box">
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-box">
              <input
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Role</label>
            <div className="input-box">
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="signup-btn"
            disabled={!formData.name || !formData.email || !formData.password || !formData.company_id}
          >
            Create Account
          </button>

          <div className="signup-footer">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/")}
              style={{ color: "#2563eb", cursor: "pointer", fontWeight: "600" }}
            >
              Login
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;


