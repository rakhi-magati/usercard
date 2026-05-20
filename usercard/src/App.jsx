// import "./App.css";
import Dashboard from "./Components/DashBoard/Dashboard";
import DynamicUserCard from "./Components/DynamicCard/DynamicUserCard";
import ProfileCard from "./Components/Profilecard/ProfileCard";


function App() {
  return (
    <div className="container">
      {/* <div>
        <h1 className="title"> Static Profile Card</h1>
        <ProfileCard />
      </div>

      <div>
        <h1 className="title"> Dynamic Profile Card </h1>
        <DynamicUserCard />
      </div> */}
      <Dashboard/>
    </div>
  );
}

export default App;