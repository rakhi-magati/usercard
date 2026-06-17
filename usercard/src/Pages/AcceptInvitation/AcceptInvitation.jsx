import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { acceptInvitation } from "../../services/employeeService";
import "./AcceptInvitation.css";

function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { setError("Invalid invitation link"); return; }
    setLoading(true);
    try {
      const result = await acceptInvitation(token, name);
      alert(`Welcome ${name}! Your account has been created. Please login.`);
      navigate("/");
    } catch (err) {
      setError("This invitation is invalid or has already been used.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="accept-container">
      <div className="accept-card">
        <h2>Accept Invitation</h2>
        <p>You've been invited to join the organization. Enter your name to get started.</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <button type="submit" disabled={loading} className="accept-btn">
            {loading ? "Processing..." : "Accept & Join"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AcceptInvitation;
