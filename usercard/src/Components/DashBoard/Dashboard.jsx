// import { useEffect, useState } from "react";
// import "./styles.css";
// import UserCard from "../UserCard/UserCard";
// import UserForm from "../UserForm/usersform";
// import SearchBar from "../SearchBar/usersearch";

// function Dashboard() {
//   const [users, setUsers] = useState([]);

//   const [loading, setLoading] = useState(true);

//   const [error, setError] = useState("");

//   const [search, setSearch] = useState("");

//   // FETCH USERS
//   const fetchUsers = async () => {
//     try {
//       setLoading(true);

//       const response = await fetch("http://127.0.0.1:5000/users");

//       if (!response.ok) {
//         throw new Error("Failed to fetch users");
//       }

//       const data = await response.json();

//       setUsers(data);

//       setError("");
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   // ADD USER
//   const addUser = async (newUser) => {
//     const response = await fetch(
//       "http://127.0.0.1:5000/users",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(newUser),
//       }
//     );

//     const data = await response.json();

//     setUsers([...users, data]);
//   };

//   // DELETE USER
//   const deleteUser = async (id) => {
//     await fetch(`http://127.0.0.1:5000/users/${id}`, {
//       method: "DELETE",
//     });

//     setUsers(users.filter((user) => user.id !== id));
//   };

//   // UPDATE USER
//   const updateUser = async (updatedUser) => {
//     const response = await fetch(
//       `http://127.0.0.1:5000/users/${updatedUser.id}`,
//       {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(updatedUser),
//       }
//     );

//     const data = await response.json();

//     setUsers(
//       users.map((user) =>
//         user.id === data.id ? data : user
//       )
//     );
//   };

//   // SEARCH FILTER
//   const filteredUsers = users.filter((user) =>
//     user.name
//       .toLowerCase()
//       .includes(search.toLowerCase())
//   );

//   if (loading) return <h1>Loading...</h1>;

//   if (error) return <h1>{error}</h1>;

//   return (
//     <div className="dashboard-container">
//       <h1>User Management Dashboard</h1>

//       <SearchBar
//         search={search}
//         setSearch={setSearch}
//       />

//       <UserForm addUser={addUser} />

//       <div className="users-grid">
//         {filteredUsers.map((user) => (
//           <UserCard
//             key={user.id}
//             user={user}
//             deleteUser={deleteUser}
//             updateUser={updateUser}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }

// export default Dashboard;