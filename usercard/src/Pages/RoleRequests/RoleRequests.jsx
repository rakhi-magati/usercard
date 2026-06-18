import { useState, useEffect } from "react";
import "./RoleRequests.css";
function RoleRequests() {

  const [requests, setRequests] =
    useState([]);

  useEffect(() => {

    const data =
      JSON.parse(
        localStorage.getItem(
          "roleRequests"
        )
      ) || [];

    setRequests(data);

  }, []);

  const handleApprove = (requestId) => {

    const requests =
      JSON.parse(
        localStorage.getItem(
          "roleRequests"
        )
      ) || [];

    const users =
      JSON.parse(
        localStorage.getItem("users")
      ) || [];

    const request =
      requests.find(
        (r) => r.id === requestId
      );

    const user =
      users.find(
        (u) =>
          u.email === request.userEmail
      );

    if (user) {
      user.role = "admin";
    }

    request.status = "Approved";

    localStorage.setItem(
      "users",
      JSON.stringify(users)
    );

    localStorage.setItem(
      "roleRequests",
      JSON.stringify(requests)
    );

    setRequests([...requests]);

    alert("Approved");
  };

  const handleReject = (requestId) => {

    const requests =
      JSON.parse(
        localStorage.getItem(
          "roleRequests"
        )
      ) || [];

    const request =
      requests.find(
        (r) => r.id === requestId
      );

    request.status = "Rejected";

    localStorage.setItem(
      "roleRequests",
      JSON.stringify(requests)
    );

    setRequests([...requests]);

    alert("Rejected");
  };

  return (
    <div className="role-requests-page dark-mode">

      <h2>
        Role Change Requests
      </h2>

      <table className="requests-table">

        <thead>
    
          <tr>
            <th>User</th>
            <th>Admin Email</th>
            <th>Status</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          {requests.map((request) => (

            <tr key={request.id}>

              <td>
                {request.userEmail}
              </td>

              <td>
                {request.adminEmail}
              </td>

              <td>
                {request.status}
              </td>

              <td>

                {request.status ===
                  "Pending" && (
                  <>
                    <button
                      onClick={() =>
                        handleApprove(
                          request.id
                        )
                      }
                    >
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        handleReject(
                          request.id
                        )
                      }
                    >
                      Reject
                    </button>
                  </>
                )}

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default RoleRequests;