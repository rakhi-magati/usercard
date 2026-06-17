import {
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";
import "./Signup.css";

function Signup() {

    const navigate =
        useNavigate();

    const [formData,
        setFormData
    ] = useState({

        name: "",

        email: "",

        password: "",

        role: "user",
    });

    const handleSignup =
        (e) => {

            e.preventDefault();

            const users =
                JSON.parse(
                    localStorage.getItem(
                        "users"
                    )
                ) || [];

            const exists =
                users.find(
                    user =>
                        user.email ===
                        formData.email
                );

            if (exists) {
                alert(
                    `${formData.role} account created successfully`
                );

                navigate("/");
                return;
            }

            users.push(formData);

            localStorage.setItem(
                "users",

                JSON.stringify(users)
            );

            alert(
                "Signup Successful"
            );

            navigate("/");
        };



    return (
        <div className="signup-container">
            <div className="signup-wrapper">

                <h2 className="signup-title">
                    Create Account
                </h2>

                <form
                    className="signup-card"
                    onSubmit={handleSignup}
                >

                    <div className="signup-icon">
                        👤
                    </div>

                    <h2>Sign Up</h2>

                    <p>
                        Create your employee account
                    </p>

                    <div className="input-group">
                        <label>Name</label>

                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
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
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        email: e.target.value,
                                    })
                                }
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
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        password: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Role</label>

                        <div className="input-box">
                            <select
                                value={formData.role}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        role: e.target.value,
                                    })
                                }
                            >
                                <option value="user">
                                    User
                                </option>

                                <option value="admin">
                                    Admin
                                </option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="signup-btn"
                        disabled={
                            !formData.name ||
                            !formData.email ||
                            !formData.password
                        }
                    >
                        Create Account
                    </button>

                    <div className="signup-footer">
                        Already have an account?{" "}

                        <span
                            onClick={() => navigate("/")}
                            style={{
                                color: "#2563eb",
                                cursor: "pointer",
                                fontWeight: "600",
                            }}
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