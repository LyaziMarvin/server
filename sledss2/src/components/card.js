import React from 'react';
import './CareAgentCard.css';
import { useNavigate } from 'react-router-dom';

function CareAgentSection() {
  const navigate = useNavigate();

  const agents = [
    {
      name: "Marvin",
      jobDescription: "LifeStyle Choices",
      image: "/adobe.png", 
      route: "/flux"
    },
    {
      name: "Carol",
      jobDescription: "Community Groups",
      image: "/adobe4.jpeg", 
      route: "/community"
    }
    ,
    {
      name: "Job",
      jobDescription: "Family History",
      image: "/adobe7.jpeg", 
      route: "/familytree"
    }
  ];

  const handleHire = (agent) => {
    navigate(agent.route, {
      state: {
        name: agent.name,
        jobDescription: agent.jobDescription,
        image: agent.image
      }
    });
  };

  return (
    <div className="agent-row">
      {agents.map((agent, index) => (
        <div key={index} className="card-wrapper">
          <div className="care-card">
            <div className="image-container">
              <img src={agent.image} alt={agent.name} className="agent-image" />
              <div className="ai-badge">AI</div>
            </div>

            <div className="card-content">
              <h2 className="agent-name">{agent.name}</h2>
              <div className="guidance-section">
                <p className="static-job">{agent.jobDescription}</p>
              </div>

              <div className="button-group">
                <button className="btn hire" onClick={() => handleHire(agent)}>
                  Hire
                </button>
              </div>

              <div className="footer">
                <p>Corporate Creator:</p>
                <p>Kin-Keepers.ai</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CareAgentSection;


