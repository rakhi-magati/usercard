
import { useState } from "react";
import "./ProfileCard.css";

function ProfileCard() {
  const [follow, setFollow] = useState(false);

  return (
    <div className="card">
      <img
        src="https://i.pravatar.cc/300?img=12"
        alt="profile"
        className="profile-img"
      />

      <h1 className="name">Ervin Howell</h1>

      <h3 className="role">Frontend Developer</h3>

      <div className="line"></div>

      <p className="bio">
        Passionate React developer who loves building beautiful user interfaces.
      </p>

      <button
        className="follow-btn"
        onClick={() => setFollow(!follow)}
      >
        {follow ? "Following" : "Follow"}
      </button>
      
    </div>
  );
}

export default ProfileCard;