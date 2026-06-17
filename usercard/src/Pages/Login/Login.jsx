import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaUsers,
  FaEnvelope,
  FaLock,
  FaEye,
} from "react-icons/fa";

import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

    
  const handleLogin = (e) => {
    e.preventDefault();

    

    const users = JSON.parse(
      localStorage.getItem("users")
    ) || [];

    const user = users.find(
      (u) =>
        u.email === email &&
        u.password === password
    );

    if (user) {

      localStorage.setItem(
        "token",
        `${user.role}-token`
      );

      localStorage.setItem(
        "role",
        user.role
      );

      localStorage.setItem(
        "userName",
        user.name
      );

      navigate("/dashboard");

    } else {

      alert(
        "Invalid Credentials"
      );
    }
  };
  return (
    <div className="login-container">

      <div className="login-wrapper">

        <h2 className="login-title">
          Login Page
        </h2>

        <form
          className="login-card"
          onSubmit={handleLogin}
        >

          <div className="login-icon">
            <FaUsers />
          </div>

          <h2>Welcome Back!</h2>

          <p>
            Login to your account
          </p>

          <div className="input-group">
            <label>Email</label>

            <div className="input-box">
              <FaEnvelope />

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>

            <div className="input-box">
              <FaLock />

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                required
              />

              <FaEye className="eye-icon" />
            </div>
          </div>

          <div className="login-options">

            <label>
              <input type="checkbox" />

              Remember me
            </label>

            <Link
              to="/forgot-password"
            >

              Forgot Password?

            </Link>

          </div>

          <button
            type="submit"
            className="login-btn"
          >
            Login
          </button>

          <div className="login-footer">
            Don't have an account?
            <Link to="/signup">

              Signup

            </Link>
          </div>

        </form>

      </div>

    </div>
  );
}

export default Login;