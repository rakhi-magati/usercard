import { useState } from "react";

function UserForm({ addUser }) {
  const [formData, setFormData] =
    useState({
      name: "",
      bio: "",
      email: "",
      role: "",
      company: "",
      website: "",
    });

  const handleSubmit = (e) => {
    e.preventDefault();

    addUser(formData);

    setFormData({
      name: "",
      bio: "",
      email: "",
      role: "",
      company: "",
      website: "",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Name"
        value={formData.name}
        onChange={(e) =>
          setFormData({
            ...formData,
            name: e.target.value,
          })
        }
      />

      <input
        placeholder="Bio"
        value={formData.bio}
        onChange={(e) =>
          setFormData({
            ...formData,
            bio: e.target.value,
          })
        }
      />

      <input
        placeholder="Email"
        value={formData.email}
        onChange={(e) =>
          setFormData({
            ...formData,
            email: e.target.value,
          })
        }
      />

      <input
        placeholder="Role"
        value={formData.role}
        onChange={(e) =>
          setFormData({
            ...formData,
            role: e.target.value,
          })
        }
      />

      <input
        placeholder="Company"
        value={formData.company}
        onChange={(e) =>
          setFormData({
            ...formData,
            company: e.target.value,
          })
        }
      />

      <input
        placeholder="Website"
        value={formData.website}
        onChange={(e) =>
          setFormData({
            ...formData,
            website: e.target.value,
          })
        }
      />

      <button type="submit">
        Add User
      </button>
    </form>
  );
}

export default UserForm;