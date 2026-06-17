import {
    useState,
} from "react";
import { useNavigate } from "react-router-dom";


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

        <form
            onSubmit={
                resetPassword
            }
        >

            <input

                placeholder="Email"

                type="email"

                value={email}

                onChange={(e) =>
                    setEmail(
                        e.target.value
                    )
                }
            />

            <input

                placeholder="New Password"

                type="password"

                value={password}

                onChange={(e) =>
                    setPassword(
                        e.target.value
                    )
                }
            />

            <button>

                Update Password

            </button>

        </form>
    );
}

export default ForgotPassword;