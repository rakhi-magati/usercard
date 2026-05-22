import { useNavigate } from "react-router-dom";
import { FaUsers, FaEnvelope, FaLock, FaEye } from "react-icons/fa";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Navigate to Dashboard
    navigate("/dashboard");
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-icon">
            <FaUsers />
          </div>

          <h1>Welcome Back!</h1>
          <p>Login to your account</p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <div className="input-box">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-box">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  placeholder="Enter your password"
                />
                <FaEye className="eye-icon" />
              </div>
            </div>

            <button type="submit" className="login-btn">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;