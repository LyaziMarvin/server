import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AgentPersonalizedPage.css';
import config from './config';
function AgentCommunizedPage() {
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(true);

  // Common fields
  const [email, setEmail] = useState('');

  // Register fields
  const [preferredName, setPreferredName] = useState('');
  const [language, setLanguage] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [relatives, setRelatives] = useState([{ name: '', relationship: '' }]);
  const [importantDates, setImportantDates] = useState([{ date: '', label: '', relationship: '' }]);

  // 📥 Register handler
  const handleRegister = async () => {
    const payload = {
      email,
      preferredName,
      language,
      age,
      country,
      relatives,
      importantDates
    };

    try {
      const response = await fetch(`  ${config.backendUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Registration successful');
        setIsRegistering(false);
      } else {
        alert(`❌ Registration failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Registration error');
    }
  };

  // 🔑 Login handler
  const handleLogin = async () => {
    if (!email) {
      alert('Please enter your email.');
      return;
    }

    try {
      const response = await fetch(`${config.backendUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Login successful');
        localStorage.setItem('token', data.token);
        localStorage.setItem('userID', data.userID);
        navigate('/communityagent');
      } else {
        alert(`❌ Login failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Login error');
    }
  };

  // 👥 Add relative
  const addRelative = () => {
    setRelatives([...relatives, { name: '', relationship: '' }]);
  };

  // 📅 Add important date
  const addDate = () => {
    setImportantDates([...importantDates, { date: '', label: '', relationship: '' }]);
  };

  // ✏️ Update relative
  const updateRelative = (index, field, value) => {
    const updated = [...relatives];
    updated[index][field] = value;
    setRelatives(updated);
  };

  // ✏️ Update date
  const updateDate = (index, field, value) => {
    const updated = [...importantDates];
    updated[index][field] = value;
    setImportantDates(updated);
  };

  return (
    <div className="agent-form-container">
      <h2>{isRegistering ? 'Register New Account' : 'Login to Your Account'}</h2>

      <div className="form-group">
        <label>Email Address:</label>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {isRegistering && (
        <>
          <div className="form-group">
            <label>Preferred Name:</label>
            <input
              type="text"
              placeholder="Your name"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Language Spoken:</label>
            <input
              type="text"
              placeholder="e.g., English"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Age:</label>
            <input
              type="number"
              placeholder="Your age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Country of Residence:</label>
            <input
              type="text"
              placeholder="e.g., Uganda"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          <h4>Relatives</h4>
          {relatives.map((rel, index) => (
            <div key={index} className="inline-group">
              <input
                type="text"
                placeholder="Name"
                value={rel.name}
                onChange={(e) => updateRelative(index, 'name', e.target.value)}
              />
              <input
                type="text"
                placeholder="Relationship"
                value={rel.relationship}
                onChange={(e) => updateRelative(index, 'relationship', e.target.value)}
              />
            </div>
          ))}
          <button onClick={addRelative}>+ Add Relative</button>

          <h4>Important Dates</h4>
          {importantDates.map((d, index) => (
            <div key={index} className="inline-group">
              <input
                type="date"
                value={d.date}
                onChange={(e) => updateDate(index, 'date', e.target.value)}
              />
              <input
                type="text"
                placeholder="Label"
                value={d.label}
                onChange={(e) => updateDate(index, 'label', e.target.value)}
              />
              <input
                type="text"
                placeholder="Relationship"
                value={d.relationship}
                onChange={(e) => updateDate(index, 'relationship', e.target.value)}
              />
            </div>
          ))}
          <button onClick={addDate}>+ Add Date</button>
        </>
      )}

      <div className="button-group">
        <button onClick={isRegistering ? handleRegister : handleLogin}>
          {isRegistering ? 'Register' : 'Login'}
        </button>
        <button
          className="toggle-button"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? 'Already have an account? Login' : 'New here? Register'}
        </button>
      </div>
    </div>
  );
}

export default AgentCommunizedPage;

