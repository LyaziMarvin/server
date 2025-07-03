import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./components/home";
import CareAgentCard from "./components/card";
import logo from "./images/cape.png";
import Logout from "./components/logout";
import CloneAgentInterface from "./components/agents";
import Registration from "./components/registration";
import Login from "./components/login";
import AgentPersonalizedPage from "./components/personalized";
import FluxImageGeneratorPage from "./components/flux";
import SuperAgentPage from "./components/super";
import CommunityGroupsPage from "./components/community";
import CommunityAgent from "./components/communityagent";
import AgentCommunizedPage from "./components/communized";














const App = () => {
  const [demoDropdown, setDemoDropdown] = useState(false);
  const [activeLink, setActiveLink] = useState(null);

  const toggleDropdown = () => {
    setDemoDropdown(!demoDropdown);
  };

  const closeDropdown = () => {
    setDemoDropdown(false);
  };

  const handleLinkClick = (link) => {
    setActiveLink(link);
    closeDropdown();
  };

  return (
    <Router>
      <div style={menuStyle}>
    <Link to="/">
        
    </Link>
  
        <span style={welcomeStyle}></span>
        <div style={menuLinksStyle}>
         <Logout />
            <Link style={linkStyle} to="/"></Link>

            <Link style={linkStyle} to="/card"></Link>
          
          <div style={{ position: "relative" }}>
            <span style={linkStyle} onClick={toggleDropdown}>
              
            </span>
            {demoDropdown && (
              <div style={dropdownStyle} onMouseLeave={closeDropdown}>
                <Link
                  style={{
                    ...dropdownLinkStyle,
                    ...(activeLink === "free" ? activeDropdownLinkStyle : {}),
                  }}
                  to=""
                  onClick={() => handleLinkClick("free")}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#0E5580";
                    e.target.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "white";
                    e.target.style.color = "#1E3A5F";
                  }}
                >
                  Free Services
                </Link>
                <Link
                  style={{
                    ...dropdownLinkStyle,
                    ...(activeLink === "personalized" ? activeDropdownLinkStyle : {}),
                  }}
                  to=""
                  onClick={() => handleLinkClick("personalized")}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#0E5580";
                    e.target.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "white";
                    e.target.style.color = "#1E3A5F";
                  }}
                >
                  Personalized Services
                </Link>
              </div>
            )}
          </div>
   
<Link style={linkStyle} to=""></Link>
         
        </div>
      </div>

      <div style={{ marginTop: "80px" }}>
        <Routes>
          <Route path="/home" element={<Home />} />
           <Route path="/agents" element={<CloneAgentInterface />} />
            <Route path="/register" element={<Registration />} />
               <Route path="/login" element={<Login />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/" element={<CareAgentCard />} />
                <Route path="/personalized" element={<AgentPersonalizedPage/>} />
                 <Route path="/flux" element={<FluxImageGeneratorPage/>} />
                  <Route path="/super" element={<SuperAgentPage/>} />
                    <Route path="/community" element={<CommunityGroupsPage/>} />
                       <Route path="/communityagent" element={<CommunityAgent/>} />
                        <Route path="/communized" element={<AgentCommunizedPage/>} />
                       
                
                
                 
                
                 
        </Routes>
      </div>
    </Router>
  );
};

const menuStyle = {
  backgroundColor: "#0E5580",
  height: "80px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "98%",
  position: "fixed",
  top: 0,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 1000,
  padding: "0 25px",
};

const logoStyle = {
  height: "80px",
  marginRight: "-1px",
};

const welcomeStyle = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "gold",
  textAlign: "left",
  flexGrow: 1,
};

const menuLinksStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "auto",
};

const linkStyle = {
  color: "white",
  textDecoration: "none",
  fontSize: "18px",
  marginLeft: "40px",
  cursor: "pointer",
};

const dropdownStyle = {
  position: "absolute",
  top: "100%",
  backgroundColor: "white",
  borderRadius: "8px",
  padding: "10px 0",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
  zIndex: 1001,
  width: "180px",
};

const dropdownLinkStyle = {
  display: "block",
  padding: "12px 20px",
  color: "#1E3A5F",
  textDecoration: "none",
  fontSize: "16px",
  textAlign: "center",
  transition: "background-color 0.2s ease-in-out",
  cursor: "pointer",
};

const activeDropdownLinkStyle = {
  ...dropdownLinkStyle,
  backgroundColor: "#0E5580",
  color: "white",
};

export default App;
