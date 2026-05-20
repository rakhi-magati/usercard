import { useState } from "react";

function UserCard({
  user,
  deleteUser,
  updateUser,
}) {
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] =
    useState({
      ...user,
      company:
        user.company?.name || "",
    });

  const handleUpdate = () => {
    updateUser(formData);
    setEditing(false);
  };

  return (
    <div className="card">
      {editing ? (
        <>
          <input
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value,
              })
            }
          />
          <input
            value={formData.bio}
            onChange={(e) =>
              setFormData({
                ...formData,
                bio: e.target.value,
              })
            }
          />

          <input
            value={formData.email}
            onChange={(e) =>
              setFormData({
                ...formData,
                email: e.target.value,
              })
            }
          />

          <input
            value={formData.role || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value,
              })
            }
          />

          <input
            value={formData.company}
            onChange={(e) =>
              setFormData({
                ...formData,
                company: e.target.value,
              })
            }
          />

          <button onClick={handleUpdate}>
            Save
          </button>
        </>
      ) : (
        <>
          <img
            src={`https://i.pravatar.cc/150?img=${user.id}`}
            alt={user.name}
          />

          <h2>{user.name}</h2>

          <p>
            <strong>Bio:</strong>
            {user.bio}
          </p>
          <p>
            Email:
            {user.email}
          </p>

          <p>
            Role:
            {user.role ||
              "Developer"}
          </p>

          <p>
            Company:
            {user.company?.name}
          </p>

          <p>
            Website:
            {user.website}
          </p>

          <button
            onClick={() =>
              setEditing(true)
            }
          >
            Edit
          </button>

          <button
            onClick={() =>
              deleteUser(user.id)
            }
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
}

export default UserCard;