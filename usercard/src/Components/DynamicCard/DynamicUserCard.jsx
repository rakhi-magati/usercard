import { useEffect, useState } from "react";
import "./DynamicUserCard.css";

function DynamicUserCard() {

  const [userId, setUserId] = useState(1);

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [following, setFollowing] = useState(false);

  useEffect(() => {

    const fetchUser = async () => {
      try {
        setLoading(true);

        const response = await fetch(
           `http://127.0.0.1:5000/users/${userId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        const data = await response.json();

        setUser(data);

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);

      }
    };

    fetchUser();

  }, [userId]);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  return (
    <div className="main-container">

      <div className="user-buttons">

        {[1, 2, 3, 4, 5,6,7,8,9,10].map((id) => (
          <button
            key={id}
            onClick={() => setUserId(id)}
          >
            User {id}
          </button>
        ))}

      </div>

      <div className="card">

        <img
          src={`https://i.pravatar.cc/300?img=${user.id}`}
          alt="profile"
          className="profile-img"
        />

        <h1 className="name">
          {user.name}
        </h1>

        <h3 className="role">
          {user.company.name}
        </h3>

        <div className="details">

          <p>
            <span>Email:</span> {user.email}
          </p>

          <p>
            <span>Website:</span> {user.website}
          </p>

          <p>
            <span>City:</span> {user.address.city}
          </p>

          <p>
            <span>Phone:</span> {user.phone}
          </p>

          <p>
            <span>Company:</span> {user.company.catchPhrase}
          </p>

        </div>

        <div className="bottom-btns">

          <button
            className="follow-btn"
            onClick={() =>
              setFollowing(!following)
            }
          >
            {following ? "Following" : "Follow"}
          </button>

          <button className="chat-btn">
            Chat with me
          </button>

        </div>

      </div>

    </div>
  );
}

export default DynamicUserCard;