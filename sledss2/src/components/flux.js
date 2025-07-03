import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./FluxImageGeneratorPage.css";

function FluxImageGeneratorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, jobDescription, image } = location.state || {};

  const handleJoinClick = () => {
    const userID = localStorage.getItem("userID");
    if (userID) {
      navigate("/super");
    } else {
      navigate("/personalized");
    }
  };

  return (
    <div className="flux-container">
      <div className="flux-header">
        <div className="flux-image-wrapper">
          <img
            src={image || "/placeholder.png"}
            alt="Agent Icon"
            className="flux-icon"
          />
        </div>
        <div className="flux-header-content">
          <h1 className="flux-title">LifeStyle Choice Agent</h1>
          <p className="flux-creator">By @{name?.toLowerCase() || "dharmesh"}</p>
          <p className="flux-category">{jobDescription || "Marketing"}</p>
          <p className="flux-description">
            Generates a healthy lifestyle program for the elderly.
          </p>
        </div>
      </div>

      <div className="flux-divider"></div>

      <div className="flux-signup">
        <h3>Sign up to work with this agent</h3>
        <p>Get full access to run, customize, and share this agent.</p>
        <button className="flux-signup-btn" onClick={handleJoinClick}>
          Join now
        </button>
      </div>
    </div>
  );
}

export default FluxImageGeneratorPage;



