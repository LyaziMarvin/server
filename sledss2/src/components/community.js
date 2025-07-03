import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CommunityGroupsPage.css";

function CommunityGroupsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, jobDescription, image } = location.state || {};

  const [groups, setGroups] = useState([]);
  const [language, setLanguage] = useState("English");

  useEffect(() => {
    // Simulate fetching groups & language from backend:
    const userLocation = "Kampala, Uganda";
    const userLanguage = "English";

    // Translate location based on language
    const translatedLocation = userLanguage === "Swahili"
      ? "Kampala, Uganda (Swahili)"
      : userLocation;

    const exampleGroups = [
      { name: "Elders Health Walk Group", description: `Weekly walks in ${translatedLocation}` },
      { name: "Community Gardening Club", description: `Grow fresh food with neighbors in ${translatedLocation}` },
      { name: "Local Storytelling Circle", description: `Share your memories and hear others' stories in ${translatedLocation}` }
    ];

    setLanguage(userLanguage);
    setGroups(exampleGroups);
  }, []);

  const handleSignUp = () => {
    const userID = localStorage.getItem("userID");
    if (userID) {
      navigate("/communityagent", {
        state: {
          name: name || "Carol",
          jobDescription: jobDescription || "Community Groups",
          image: image || "/placeholder.png"
        }
      });
    } else {
      navigate("/communized");
    }
  };

  return (
    <div className="community-container">
      <div className="community-header">
        <div className="community-image-wrapper">
          <img
            src={image || "/placeholder.png"}
            alt="Agent Icon"
            className="community-icon"
          />
        </div>
        <div className="community-header-content">
          <h1 className="community-title">{jobDescription || "Community Groups"}</h1>
          <p className="community-creator">By @{name?.toLowerCase() || "carol"}</p>
          <p className="community-language">Language: {language}</p>
          <p className="community-description">
            Connect with local community groups in your preferred language.
          </p>
        </div>
      </div>

      <div className="community-divider"></div>

      <div className="community-groups">
        <h3>Suggested Groups in Your Area</h3>
        {groups.map((group, index) => (
          <div key={index} className="group-card">
            <h4>{group.name}</h4>
            <p>{group.description}</p>
          </div>
        ))}
      </div>

      <div className="community-signup">
        <h3>Join the Community</h3>
        <p>
          Become part of a friendly network near you.
        </p>
        <button className="community-signup-btn" onClick={handleSignUp}>
          Join Now
        </button>
      </div>
    </div>
  );
}

export default CommunityGroupsPage;
