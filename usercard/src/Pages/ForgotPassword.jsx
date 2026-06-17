import {
    useState,
} from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {

    const navigate =
        useNavigate();

    const [email,
        setEmail
    ] = useState("");

    const [password,
        setPassword
    ] = useState("");

    const resetPassword =
        (e) => {

            e.preventDefault();

            const users =
                JSON.parse(
                    localStorage.getItem(
                        "users"
                    )
                ) || [];

            const updated =
                users.map(user => {

                    if (
                        user.email ===
                        email
                    ) {

                        return {

                            ...user,

                            password,
                        };
                    }

                    return user;
                });

            localStorage.setItem(

                "users",

                JSON.stringify(updated)
            );

            alert(
                "Password Updated"
            );

            navigate("/");
        };

    return (
        <div className="forgot-container">
            <div className="forgot-card">

                <h2>Forgot Password</h2>

                <p>
                    Enter your email and create a new password
                </p>

                <form onSubmit={resetPassword}>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="reset-btn"
                    >
                        Update Password
                    </button>

                    <button
                        type="button"
                        className="back-btn"
                        onClick={() => navigate("/")}
                    >
                        Back to Login
                    </button>

                </form>
            </div>
        </div>
    );
}

export default ForgotPassword;