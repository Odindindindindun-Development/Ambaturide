import React, { useState, useEffect } from "react"; // Added useEffect import
import "./Css/PassengerProfile.css";
import Header from "../Header";
import axios from "axios"; // Added axios for API calls (install if needed: npm i axios)

function PassengerProfile() {
  const [activeSection, setActiveSection] = useState("profile");
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    gender: "",
    birthdate: "",
    contactNo: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [tempData, setTempData] = useState({ ...formData });
  const [loading, setLoading] = useState(true); // Added loading state
  const [error, setError] = useState(""); // Added error state

  // Helper: read passenger data from localStorage with fallbacks and normalize id
  const getSavedPassenger = () => {
    try {
      const raw =
        localStorage.getItem("passenger") ||
        localStorage.getItem("user") ||
        localStorage.getItem("driver");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.error("Error parsing saved passenger from localStorage:", err);
      return null;
    }
  };

  const getPassengerId = (obj) => {
    if (!obj) return null;
    return obj.PassengerID || obj.id || obj.passengerId || obj.PassengerId || null;
  };

  // Function to load data from localStorage (fallback)
  const loadFromLocalStorage = () => {
    try {
      const savedPassenger = localStorage.getItem("passenger");
      if (savedPassenger) {
        const passengerData = JSON.parse(savedPassenger);
        setFormData(prev => ({
          ...prev,
          firstName: passengerData.FirstName || "",
          lastName: passengerData.LastName || "",
          email: passengerData.Email || "",
          profilePicture: passengerData.ProfilePicture || "" // Add this line
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error loading from localStorage:", err);
      return false;
    }
  };

  // Function to fetch full profile from backend (optional, for complete data)
  const fetchProfileFromDB = async (passengerId) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/passenger/profile/${passengerId}`, {
        withCredentials: true // For session-based auth
      });
      const fullData = response.data;
      setFormData({
        firstName: fullData.FirstName || "",
        lastName: fullData.LastName || "",
        gender: fullData.Gender || "",
        birthdate: fullData.BirthDate || "",
        contactNo: fullData.PhoneNumber || "",
        email: fullData.Email || "",
        profilePicture: fullData.ProfilePicture || "", // Add this line
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      console.error("Error fetching profile from DB:", err);
      setError("Failed to load full profile. Using cached data.");
      loadFromLocalStorage(); // Fallback to localStorage
    }
  };
  useEffect(() => {
    setLoading(true);
    const savedPassenger = getSavedPassenger();
    if (savedPassenger) {
      console.log("🔍 DEBUG - Passenger data:", savedPassenger);
      
      const passengerId = getPassengerId(savedPassenger);
      
      if (passengerId) {
        console.log("🔄 Fetching profile for ID:", passengerId);
        fetchProfileFromDB(passengerId);
      } else {
        console.log("❌ No passenger ID found, using localStorage only");
        loadFromLocalStorage();
      }
    } else {
      setError("No profile data found. Please log in.");
      loadFromLocalStorage();
    }
    setLoading(false);
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTempChange = (e) => {
    setTempData({
      ...tempData,
      [e.target.name]: e.target.value
    });
  };

  const startEditing = (fieldName) => {
    setEditingField(fieldName);
    setTempData({ ...formData });
  };

  const saveEdit = async (fieldName) => {
    try {
      const savedPassenger = getSavedPassenger();
      const passengerId = getPassengerId(savedPassenger);

      if (!passengerId) {
        alert("No Passenger ID found. Please log in again.");
        console.log("❌ No PassengerID found in:", savedPassenger);
        return;
      }

      // Update local UI first
      setFormData({ ...tempData });
      setEditingField(null);

      // Send update request to backend
      const response = await axios.put(
        `http://localhost:3001/api/passenger/update/${passengerId}`,
        {
          firstName: tempData.firstName,
          lastName: tempData.lastName,
          gender: tempData.gender,
          birthdate: tempData.birthdate,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        alert("✅ Profile updated successfully!");
        // Optionally update localStorage
        localStorage.setItem(
          "passenger",
          JSON.stringify({
            ...savedPassenger,
            FirstName: tempData.firstName,
            LastName: tempData.lastName,
            Gender: tempData.gender,
            BirthDate: tempData.birthdate,
          })
        );
      } else {
        alert("⚠️ Failed to update profile.");
      }
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      alert("An error occurred while saving changes.");
    }
  };


  const cancelEdit = () => {
    setEditingField(null);
    setTempData({ ...formData });
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    try {
      const savedPassenger = getSavedPassenger();
      const passengerId = getPassengerId(savedPassenger);

      if (!passengerId) {
        alert("No Passenger ID found. Please log in again.");
        console.log("❌ No PassengerID found in:", savedPassenger);
        return;
      }

      const response = await axios.put(
        `http://localhost:3001/api/passenger/update-contact/${passengerId}`,
        {
          contactNo: formData.contactNo,
          email: formData.email,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        alert("✅ Contact info updated!");
        localStorage.setItem(
          "passenger",
          JSON.stringify({
            ...savedPassenger,
            Email: formData.email,
            PhoneNumber: formData.contactNo,
          })
        );
        setActiveSection("success");
      } else {
        alert("⚠️ Failed to update info");
      }
    } catch (error) {
      console.error("❌ Error updating contact info:", error);
      alert("Server error while saving contact info");
    }
  };


  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      alert("❌ New password and confirm password do not match");
      return;
    }

    try {
      const savedPassenger = getSavedPassenger();
      const passengerId = getPassengerId(savedPassenger);

      if (!passengerId) {
        alert("No Passenger ID found. Please log in again.");
        console.log("❌ No PassengerID found in:", savedPassenger);
        return;
      }

      const response = await axios.put(
        `http://localhost:3001/api/passenger/change-password/${passengerId}`,
        {
          oldPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        alert("✅ Password changed successfully!");
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        setActiveSection("passwordSuccess");
      } else {
        alert(`⚠️ ${response.data.message}`);
      }
    } catch (error) {
      console.error("❌ Error changing password:", error);
      alert("Server error while changing password");
    }
  };



  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      const savedPassenger = getSavedPassenger();
      const passengerId = getPassengerId(savedPassenger);

      if (!passengerId) {
        alert("No Passenger ID found. Please log in again.");
        console.log("❌ No PassengerID found in:", savedPassenger);
        return;
      }

      const uploadFormData = new FormData();
      uploadFormData.append("profile", file);

      const response = await axios.post(
        `http://localhost:3001/api/passenger/profile-picture/${passengerId}`,
        uploadFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        alert("✅ Profile picture updated!");
        const newImagePath = response.data.imagePath;
        
        // ✅ Update UI state
        setFormData((prev) => ({
          ...prev,
          profilePicture: newImagePath
        }));

        // ✅ Update both localStorage items to keep them in sync
        const updatedPassenger = {
          ...savedPassenger,
          ProfilePicture: newImagePath,
        };
        
        localStorage.setItem("passenger", JSON.stringify(updatedPassenger));
        localStorage.setItem("user", JSON.stringify(updatedPassenger));
        
        // ✅ Dispatch custom event to notify Header component
        window.dispatchEvent(new Event('userUpdated'));
        
        // Force refresh the image by updating state again with timestamp
        setTimeout(() => {
          setFormData((prev) => ({
            ...prev,
            profilePicture: `${newImagePath}?t=${Date.now()}`
          }));
        }, 100);
      }
    } catch (error) {
      console.error("❌ Error uploading profile picture:", error);
      if (error.response?.data?.message) {
        alert(`Upload failed: ${error.response.data.message}`);
      } else {
        alert("Failed to upload profile picture. Please try again.");
      }
    }
  };


  if (loading) {
    return <div className="profile-container">Loading profile...</div>; // Simple loading UI
  }

  if (error) {
    console.warn(error); // Log error but don't break UI
  }

  return (
    <>
      <Header />
      <div className="profile-container">
        {/* Header Section */}
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
          <div className="passenger-badge">Passenger</div>
        </div>

        {/* Main Profile Content */}
        {activeSection === "profile" && (
          <div className="profile-content">
            {/* Personal Info Section */}
            <div className="personal-info-section">
              <div className="info-left">
                {/* Last Name */}
                <div className="info-row">
                  <span className="info-label">Last Name</span>
                  <div className="info-value-container">
                    {editingField === 'lastName' ? (
                      <div className="edit-mode">
                        <input
                          type="text"
                          className="edit-input"
                          value={tempData.lastName}
                          onChange={handleTempChange}
                          name="lastName"
                        />
                        <div className="edit-actions">
                          <button className="save-btn" onClick={() => saveEdit('lastName')}>✓</button>
                          <button className="cancel-btn" onClick={cancelEdit}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="info-value">{formData.lastName || "N/A"}</span>
                        <span className="edit-icon" onClick={() => startEditing('lastName')}>✏️</span>
                      </>
                    )}
                  </div>
                </div>

                {/* First Name */}
                <div className="info-row">
                  <span className="info-label">First Name</span>
                  <div className="info-value-container">
                    {editingField === 'firstName' ? (
                      <div className="edit-mode">
                        <input
                          type="text"
                          className="edit-input"
                          value={tempData.firstName}
                          onChange={handleTempChange}
                          name="firstName"
                        />
                        <div className="edit-actions">
                          <button className="save-btn" onClick={() => saveEdit('firstName')}>✓</button>
                          <button className="cancel-btn" onClick={cancelEdit}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="info-value">{formData.firstName || "N/A"}</span>
                        <span className="edit-icon" onClick={() => startEditing('firstName')}>✏️</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Gender */}
                <div className="info-row">
                  <span className="info-label">Gender</span>
                  <div className="info-value-container">
                    {editingField === 'gender' ? (
                      <div className="edit-mode">
                        <select
                          className="edit-input"
                          value={tempData.gender}
                          onChange={handleTempChange}
                          name="gender"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        <div className="edit-actions">
                          <button className="save-btn" onClick={() => saveEdit('gender')}>✓</button>
                          <button className="cancel-btn" onClick={cancelEdit}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="gender-badge">{formData.gender || "N/A"}</span>
                        <span className="edit-icon" onClick={() => startEditing('gender')}>✏️</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Birthdate */}
                <div className="info-row">
                  <span className="info-label">Birthdate</span>
                  <div className="info-value-container">
                    {editingField === 'birthdate' ? (
                      <div className="edit-mode">
                        <input
                          type="date"
                          className="edit-input"
                          value={tempData.birthdate}
                          onChange={handleTempChange}
                          name="birthdate"
                        />
                        <div className="edit-actions">
                          <button className="save-btn" onClick={() => saveEdit('birthdate')}>✓</button>
                          <button className="cancel-btn" onClick={cancelEdit}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="birthdate-value">
                          <span className="calendar-icon">📅</span>
                          {formData.birthdate ? new Date(formData.birthdate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : "N/A"}
                        </span>
                        <span className="edit-icon" onClick={() => startEditing('birthdate')}>✏️</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="profile-picture-section">
                <div className="profile-picture-container">
                  <div className="profile-picture">
                    {formData.profilePicture ? (
                      <img
                        src={formData.profilePicture.startsWith('http') 
                          ? formData.profilePicture 
                          : `http://localhost:3001${formData.profilePicture}?t=${Date.now()}`}
                        alt="Profile"
                        className="profile-img"
                        onError={(e) => {
                          // If image fails to load, show default
                          e.target.src = "/profile-pictures/default.jpg";
                        }}
                      />
                    ) : (
                      <img
                        src="/profile-pictures/default.jpg"
                        alt="Default profile"
                        className="profile-img"
                      />
                    )}
                  </div>

                  <label className="profile-edit-label">
                    <span className="edit-icon profile-edit-icon">✏️</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="profile-file-input"
                    />
                  </label>
                </div>
                <span className="profile-label">Profile</span>
              </div>
            </div>

            {/* Main Content - Two Columns */}
            <div className="main-content">
              {/* Privacy Panel - Left */}
              <div className="privacy-panel">
                <h2 className="panel-title">Privacy</h2>
                
                <div className="form-group">
                  <label className="form-label">Contact No.</label>
                  <div className="phone-input-container">
                    <div className="country-flag">🇵🇭</div>
                    <span className="country-code">+63</span>
                    <input 
                      type="tel"
                      className="phone-input"
                      value={formData.contactNo}
                      onChange={handleInputChange}
                      name="contactNo"
                    />
                    <span className="edit-icon">✏️</span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="email-input-container">
                    <input 
                      type="email"
                      className="email-input"
                      value={formData.email}
                      onChange={handleInputChange}
                      name="email"
                      placeholder="Enter email address"
                    />
                    <span className="edit-icon">✏️</span>
                  </div>
                </div>
                
                <button className="yellow-btn confirm-change-btn" onClick={handleSaveChanges}>
                  Confirm Change
                </button>
              </div>

              {/* Vertical Divider */}
              <div className="vertical-divider"></div>

              {/* Change Password Panel - Right */}
              <div className="password-panel">
                <h2 className="panel-title">Change Password</h2>
                
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input 
                    type="password"
                    className="password-input"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    name="currentPassword"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input 
                    type="password"
                    className="password-input"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    name="newPassword"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input 
                    type="password"
                    className="password-input"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    name="confirmPassword"
                  />
                </div>
                
                <button className="yellow-btn confirm-password-btn" onClick={handlePasswordChange}>
                  Confirm New Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modals */}
        {activeSection === "success" && (
          <div className="modal-overlay">
            <div className="success-modal">
              <div className="success-icon">✓</div>
              <h2 className="success-title">Success!</h2>
              <p className="success-message">Your Email / Contact No. successfully changed</p>
              <button 
                className="yellow-btn back-home-btn"
                onClick={() => setActiveSection("profile")}
              >
                Back to Home
              </button>
            </div>
          </div>
        )}

        {activeSection === "passwordSuccess" && (
          <div className="modal-overlay">
            <div className="success-modal">
              <div className="success-icon">✓</div>
              <h2 className="success-title">Password Changed!</h2>
              <p className="success-message">Your password successfully changed</p>
              <button 
                className="yellow-btn back-home-btn"
                onClick={() => setActiveSection("profile")}
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default PassengerProfile;
