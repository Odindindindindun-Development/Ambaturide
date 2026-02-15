import React, { useState, useEffect } from "react";
import "./DriverProfile.css";
import DriverHeader from '../../src/DriverHeader.jsx';
import axios from "axios";
import { useRequireDriver } from "../utils/authGuards.jsx";

function DriverProfile() {
  useRequireDriver();

  const [activeSection, setActiveSection] = useState("profile");
  const [editingField, setEditingField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    gender: "",
    birthdate: "",
    contactNo: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    carBrand: "",
    carModel: "",
    plateNumber: "",
    profilePicture: "",
    licenseImage: "",
    vehicleImage: ""
  });

  const [tempData, setTempData] = useState({ ...formData });

  // Normalize image path -> full URL and append timestamp safely
  const buildImageUrl = (path) => {
    if (!path) return "/profile-pictures/default.jpg";
    const raw = String(path);
    // if already an absolute url, return as-is
    if (/^https?:\/\//i.test(raw) || /^\/\//.test(raw)) return raw;
    // ensure leading slash
    const clean = raw.startsWith("/") ? raw : `/${raw}`;
    return `http://localhost:3001${clean}`;
  };

  const withTimestamp = (url) =>
    url.includes("?") ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;

  // Load driver data on component mount
  useEffect(() => {
    const loadDriverData = async () => {
      try {
        const savedDriver = localStorage.getItem("driver");
        if (savedDriver) {
          const driverData = JSON.parse(savedDriver);
          const driverId = driverData.DriverID;
          
          // Fetch full driver profile from backend
          const response = await axios.get(`http://localhost:3001/api/driver/profile/${driverId}`, {
            withCredentials: true
          });
          
          // Response shape can vary: normalize it and accept aliases
          let fullData = response.data;
          if (fullData.driver) fullData = fullData.driver;
          if (Array.isArray(fullData) && fullData.length) fullData = fullData[0];

          const norm = {
            FirstName: fullData.FirstName || fullData.firstName || fullData.First_Name || "",
            LastName: fullData.LastName || fullData.lastName || "",
            Gender: fullData.Gender || fullData.gender || "",
            BirthDate: fullData.BirthDate || fullData.birthdate || fullData.Birth_Date || "",
            PhoneNumber: fullData.PhoneNumber || fullData.contactNo || fullData.phone || "",
            Email: fullData.Email || fullData.email || "",
            VehicleBrand: fullData.VehicleBrand || fullData.carBrand || fullData.vehicleBrand || "",
            VehicleType: fullData.VehicleType || fullData.carModel || fullData.vehicleType || "",
            PlateNumber: fullData.PlateNumber || fullData.plateNumber || "",
            ProfilePicture: fullData.ProfilePicture || fullData.profilePicture || fullData.ProfilePic || "",
            LicenseImage: fullData.LicenseImage || fullData.licenseImage || fullData.License || "",
            VehiclePicture: fullData.VehiclePicture || fullData.vehicleImage || fullData.VehicleImage || fullData.vehiclePicture || ""
          };

          setFormData({
            firstName: norm.FirstName,
            lastName: norm.LastName,
            gender: norm.Gender,
            birthdate: norm.BirthDate,
            contactNo: norm.PhoneNumber,
            email: norm.Email,
            carBrand: norm.VehicleBrand,
            carModel: norm.VehicleType,
            plateNumber: norm.PlateNumber,
            profilePicture: norm.ProfilePicture,
            licenseImage: norm.LicenseImage,
            vehicleImage: norm.VehiclePicture,
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
        }
      } catch (error) {
        console.error("Error loading driver data:", error);
        // Fallback to localStorage data
        const savedDriver = localStorage.getItem("driver");
        if (savedDriver) {
          const driverData = JSON.parse(savedDriver);
          setFormData(prev => ({
            ...prev,
            firstName: driverData.FirstName || driverData.firstName || "",
            lastName: driverData.LastName || driverData.lastName || "",
            email: driverData.Email || driverData.email || "",
            profilePicture: driverData.ProfilePicture || driverData.profilePicture || "",
            licenseImage: driverData.LicenseImage || driverData.licenseImage || driverData.License || "",
            vehicleImage: driverData.VehiclePicture || driverData.vehiclePicture || driverData.VehicleImage || ""
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    loadDriverData();
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
      const savedDriver = JSON.parse(localStorage.getItem("driver"));
      const driverId = savedDriver?.DriverID;

      if (!driverId) {
        alert("No Driver ID found. Please log in again.");
        return;
      }

      // Prepare default: update basic profile endpoint
      let endpoint = `/api/driver/update/${driverId}`;
      let payload = {};

      // Decide payload and endpoint based on field edited
      if (["firstName", "lastName", "gender", "birthdate"].includes(fieldName)) {
        payload = {
          firstName: tempData.firstName,
          lastName: tempData.lastName,
          gender: tempData.gender,
          birthdate: tempData.birthdate,
        };
      } else if (["carBrand", "carModel", "plateNumber"].includes(fieldName)) {
        // update vehicle info
        endpoint = `/api/driver/update-vehicle/${driverId}`;
        payload = {
          vehicleBrand: tempData.carBrand,
          vehicleType: tempData.carModel,
          plateNumber: tempData.plateNumber,
        };
      } else if (["contactNo", "email"].includes(fieldName)) {
        endpoint = `/api/driver/update-contact/${driverId}`;
        payload = {
          contactNo: tempData.contactNo,
          email: tempData.email,
        };
      } else {
        // unknown field — just apply locally
        setFormData({ ...tempData });
        setEditingField(null);
        return;
      }

      // Optimistically update UI
      setFormData({ ...tempData });
      setEditingField(null);

      const response = await axios.put(
        `http://localhost:3001${endpoint}`,
        payload,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Build updated localStorage object mapping to DB keys
        const updatedDriver = { ...savedDriver };

        // Map fields returned / edited to the stored keys used elsewhere
        if (payload.firstName !== undefined) {
          updatedDriver.FirstName = payload.firstName;
        }
        if (payload.lastName !== undefined) {
          updatedDriver.LastName = payload.lastName;
        }
        if (payload.gender !== undefined) {
          updatedDriver.Gender = payload.gender;
        }
        if (payload.birthdate !== undefined) {
          updatedDriver.BirthDate = payload.birthdate;
        }
        if (payload.vehicleBrand !== undefined) {
          // database column is VehicleBrand
          updatedDriver.VehicleBrand = payload.vehicleBrand;
        }
        if (payload.vehicleType !== undefined) {
          updatedDriver.VehicleType = payload.vehicleType;
        }
        if (payload.plateNumber !== undefined) {
          updatedDriver.PlateNumber = payload.plateNumber;
        }
        if (payload.contactNo !== undefined) {
          updatedDriver.PhoneNumber = payload.contactNo;
        }
        if (payload.email !== undefined) {
          updatedDriver.Email = payload.email;
        }

        localStorage.setItem("driver", JSON.stringify(updatedDriver));
        localStorage.setItem("user", JSON.stringify(updatedDriver));
        window.dispatchEvent(new Event("userUpdated"));

        alert("✅ Updated successfully!");
      } else {
        alert("⚠️ Failed to update.");
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
      const savedDriver = JSON.parse(localStorage.getItem("driver"));
      const driverId = savedDriver?.DriverID;

      if (!driverId) {
        alert("No Driver ID found. Please log in again.");
        return;
      }

      const response = await axios.put(
        `http://localhost:3001/api/driver/update-contact/${driverId}`,
        {
          contactNo: formData.contactNo,
          email: formData.email,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        alert("✅ Contact info updated!");
        // Update both localStorage items
        const updatedDriver = {
          ...savedDriver,
          Email: formData.email,
          PhoneNumber: formData.contactNo,
        };
        
        localStorage.setItem("driver", JSON.stringify(updatedDriver));
        localStorage.setItem("user", JSON.stringify(updatedDriver));
        window.dispatchEvent(new Event('userUpdated'));
        
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
      const savedDriver = JSON.parse(localStorage.getItem("driver"));
      const driverId = savedDriver?.DriverID;

      if (!driverId) {
        alert("No Driver ID found. Please log in again.");
        return;
      }

      const response = await axios.put(
        `http://localhost:3001/api/driver/change-password/${driverId}`,
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

  const handleCarInfoChange = async (e) => {
    e.preventDefault();
    try {
      const savedDriver = JSON.parse(localStorage.getItem("driver"));
      const driverId = savedDriver?.DriverID;

      if (!driverId) {
        alert("No Driver ID found. Please log in again.");
        return;
      }

      const response = await axios.put(
        `http://localhost:3001/api/driver/update-vehicle/${driverId}`,
        {
          vehicleBrand: formData.carBrand,
          vehicleType: formData.carModel,
          plateNumber: formData.plateNumber,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        alert("✅ Car information updated!");
        // Update localStorage
        const updatedDriver = {
          ...savedDriver,
          VehicleBrand: formData.carBrand,
          VehicleType: formData.carModel,
          PlateNumber: formData.plateNumber,
        };
        
        localStorage.setItem("driver", JSON.stringify(updatedDriver));
        localStorage.setItem("user", JSON.stringify(updatedDriver));
        window.dispatchEvent(new Event('userUpdated'));
        
        setActiveSection("carSuccess");
      } else {
        alert("⚠️ Failed to update car info");
      }
    } catch (error) {
      console.error("❌ Error updating car info:", error);
      alert("Server error while updating car information");
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
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      const savedDriver = JSON.parse(localStorage.getItem("driver"));
      const driverId = savedDriver?.DriverID;
      
      if (!driverId) {
        alert("No Driver ID found. Please log in again.");
        return;
      }

      const uploadFormData = new FormData();
      uploadFormData.append("profile", file);

      const response = await axios.post(
        `http://localhost:3001/api/driver/profile-picture/${driverId}`,
        uploadFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        alert("✅ Profile picture updated!");
        const newImagePath = response.data.imagePath;
        
        // Update UI state
        setFormData((prev) => ({
          ...prev,
          profilePicture: newImagePath
        }));

        // Update both localStorage items
        const updatedDriver = {
          ...savedDriver,
          ProfilePicture: newImagePath,
        };
        
        localStorage.setItem("driver", JSON.stringify(updatedDriver));
        localStorage.setItem("user", JSON.stringify(updatedDriver));
        window.dispatchEvent(new Event('userUpdated'));
        
        // Force refresh the image
        setTimeout(() => {
          setFormData((prev) => ({
            ...prev,
            profilePicture: `${newImagePath}?t=${Date.now()}`
          }));
        }, 100);
      }
    } catch (error) {
      console.error("❌ Error uploading profile picture:", error);
      alert("Failed to upload profile picture. Please try again.");
    }
  };

  // Function to handle license image upload
  const handleLicenseImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      const savedDriver = JSON.parse(localStorage.getItem("driver"));
      const driverId = savedDriver?.DriverID;
      
      if (!driverId) {
        alert("No Driver ID found. Please log in again.");
        return;
      }

      const uploadFormData = new FormData();
      uploadFormData.append("license", file);

      const response = await axios.post(
        `http://localhost:3001/api/driver/license-image/${driverId}`,
        uploadFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        alert("✅ License image updated!");
        const newImagePath = response.data.imagePath;
        
        setFormData((prev) => ({
          ...prev,
          licenseImage: newImagePath
        }));

        const updatedDriver = {
          ...savedDriver,
          LicenseImage: newImagePath,
        };
        
        localStorage.setItem("driver", JSON.stringify(updatedDriver));
        localStorage.setItem("user", JSON.stringify(updatedDriver));
        window.dispatchEvent(new Event('userUpdated'));
        
        setTimeout(() => {
          setFormData((prev) => ({
            ...prev,
            licenseImage: `${newImagePath}?t=${Date.now()}`
          }));
        }, 100);
      }
    } catch (error) {
      console.error("❌ Error uploading license image:", error);
      alert("Failed to upload license image. Please try again.");
    }
  };

  // Function to handle vehicle image upload
  const handleVehicleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      const savedDriver = JSON.parse(localStorage.getItem("driver"));
      const driverId = savedDriver?.DriverID;
      
      if (!driverId) {
        alert("No Driver ID found. Please log in again.");
        return;
      }

      const uploadFormData = new FormData();
      uploadFormData.append("vehicle", file);

      const response = await axios.post(
        `http://localhost:3001/api/driver/vehicle-image/${driverId}`,
        uploadFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        alert("✅ Vehicle image updated!");
        const newImagePath = response.data.imagePath;
        
        setFormData((prev) => ({
          ...prev,
          vehicleImage: newImagePath
        }));

        const updatedDriver = {
          ...savedDriver,
          VehiclePicture: newImagePath,
        };
        
        localStorage.setItem("driver", JSON.stringify(updatedDriver));
        localStorage.setItem("user", JSON.stringify(updatedDriver));
        window.dispatchEvent(new Event('userUpdated'));
        
        setTimeout(() => {
          setFormData((prev) => ({
            ...prev,
            vehicleImage: `${newImagePath}?t=${Date.now()}`
          }));
        }, 100);
      }
    } catch (error) {
      console.error("❌ Error uploading vehicle image:", error);
      alert("Failed to upload vehicle image. Please try again.");
    }
  };

  if (loading) {
    return <div className="profile-container">Loading profile...</div>;
  }

  return (
    <>
      <DriverHeader/>

      <div className="profile-container">
        {/* Header Section */}
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
          <div className="passenger-badge">Driver</div>
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
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <span 
                      className="profile-number"
                      style={{ display: formData.profilePicture ? 'none' : 'block' }}
                    >
                      {formData.firstName ? formData.firstName.charAt(0) : 'D'}
                    </span>
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

            {/* Main Content - Three Columns */}
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

              {/* Car Information Panel - Middle */}

              <div className="car-panel">
                <h2 className="panel-title">Car Information</h2>
                
                {/* Car Details in a Card Layout */}
                <div className="car-details-card">
                  {/* Car Brand */}
                  <div className="car-info-item">
                    <label className="car-info-label">Car Brand</label>
                    <div className="car-info-value-container">
                      {editingField === 'carBrand' ? (
                        <div className="edit-mode">
                          <input
                            type="text"
                            className="edit-input car-edit-input"
                            value={tempData.carBrand}
                            onChange={handleTempChange}
                            name="carBrand"
                            placeholder="Enter car brand"
                          />
                          <div className="edit-actions">
                            <button className="save-btn" onClick={() => saveEdit('carBrand')}>✓</button>
                            <button className="cancel-btn" onClick={cancelEdit}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <div className="display-mode">
                          <span className="car-info-value">{formData.carBrand || "Not set"}</span>
                          <button 
                            className="edit-btn car-edit-btn"
                            onClick={() => startEditing('carBrand')}
                          >
                            <span className="edit-icon">✏️</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Car Model */}
                  <div className="car-info-item">
                    <label className="car-info-label">Car Model</label>
                    <div className="car-info-value-container">
                      {editingField === 'carModel' ? (
                        <div className="edit-mode">
                          <input
                            type="text"
                            className="edit-input car-edit-input"
                            value={tempData.carModel}
                            onChange={handleTempChange}
                            name="carModel"
                            placeholder="Enter car model"
                          />
                          <div className="edit-actions">
                            <button className="save-btn" onClick={() => saveEdit('carModel')}>✓</button>
                            <button className="cancel-btn" onClick={cancelEdit}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <div className="display-mode">
                          <span className="car-info-value">{formData.carModel || "Not set"}</span>
                          <button 
                            className="edit-btn car-edit-btn"
                            onClick={() => startEditing('carModel')}
                          >
                            <span className="edit-icon">✏️</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Plate Number */}
                  <div className="car-info-item">
                    <label className="car-info-label">Plate Number</label>
                    <div className="car-info-value-container">
                      {editingField === 'plateNumber' ? (
                        <div className="edit-mode">
                          <input
                            type="text"
                            className="edit-input car-edit-input"
                            value={tempData.plateNumber}
                            onChange={handleTempChange}
                            name="plateNumber"
                            placeholder="Enter plate number"
                          />
                          <div className="edit-actions">
                            <button className="save-btn" onClick={() => saveEdit('plateNumber')}>✓</button>
                            <button className="cancel-btn" onClick={cancelEdit}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <div className="display-mode">
                          <span className="car-info-value plate-number">
                            {formData.plateNumber || "Not set"}
                          </span>
                          <button 
                            className="edit-btn car-edit-btn"
                            onClick={() => startEditing('plateNumber')}
                          >
                            <span className="edit-icon">✏️</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Image Upload Sections */}
                <div className="car-images-section">
                  {/* Vehicle Image */}
                  <div className="image-upload-card">
                    <div className="image-upload-header">
                      <h3 className="image-upload-title">Vehicle Image</h3>
                      <span className="image-required-badge">Required</span>
                    </div>
                    
                    <div className="image-upload-container">
                      <div className="image-preview">
                        {formData.vehicleImage ? (
                          <div className="image-with-actions">
                            <img
                              src={withTimestamp(buildImageUrl(formData.vehicleImage))}
                              alt="Vehicle"
                              className="uploaded-image"
                              onError={(e) => {
                                // prevent infinite loop if default also fails
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/profile-pictures/default.jpg";
                                e.currentTarget.style.display = "block";
                              }}
                            />
                            <button 
                              className="replace-image-btn"
                              onClick={() => document.querySelector('.vehicle-file-input').click()}
                            >
                              Replace Image
                            </button>
                          </div>
                        ) : (
                          <div className="image-placeholder">
                            <span className="placeholder-icon">🚗</span>
                            <span className="placeholder-text">No vehicle image uploaded</span>
                            <span className="placeholder-subtext">Upload a clear photo of your vehicle</span>
                          </div>
                        )}
                      </div>
                      
                      <label className="image-upload-label">
                        <span className="upload-btn primary-upload-btn">
                          {formData.vehicleImage ? 'Change Vehicle Image' : 'Upload Vehicle Image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleVehicleImageChange}
                          className="image-file-input vehicle-file-input"
                        />
                      </label>
                    </div>
                  </div>

                  {/* License Image */}
                  <div className="image-upload-card">
                    <div className="image-upload-header">
                      <h3 className="image-upload-title">Driver's License</h3>
                      <span className="image-required-badge">Required</span>
                    </div>
                    
                    <div className="image-upload-container">
                      <div className="image-preview">
                        {formData.licenseImage ? (
                          <div className="image-with-actions">
                            <img
                              src={withTimestamp(buildImageUrl(formData.licenseImage))}
                              alt="Driver's License"
                              className="uploaded-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <button 
                              className="replace-image-btn"
                              onClick={() => document.querySelector('.license-file-input').click()}
                            >
                              Replace License
                            </button>
                          </div>
                        ) : (
                          <div className="image-placeholder">
                            <span className="placeholder-icon">📄</span>
                            <span className="placeholder-text">No license image uploaded</span>
                            <span className="placeholder-subtext">Upload a clear photo of your driver's license</span>
                          </div>
                        )}
                      </div>
                      
                      <label className="image-upload-label">
                        <span className="upload-btn primary-upload-btn">
                          {formData.licenseImage ? 'Change License Image' : 'Upload License'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLicenseImageChange}
                          className="image-file-input license-file-input"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                
                <button className="yellow-btn confirm-car-btn" onClick={handleCarInfoChange}>
                  Update Car Information
                </button>
              </div>

              {/* Vertical Divider */}
              <div className="vertical-divider"></div>

              {/* Change Password Panel - Right */}
              {/* Change Password Panel - Right */}
                <div className="password-panel">
                  <div className="password-header">
                    <h2 className="panel-title">Change Password</h2>
                    <div className="password-security-badge">
                      <span className="security-icon">🔒</span>
                      Security
                    </div>
                  </div>
                  
                  <div className="password-form-card">
                    <div className="form-group">
                      <label className="form-label">
                        Current Password
                        <span className="required-asterisk">*</span>
                      </label>
                      <div className="password-input-container">
                        <input 
                          type="password"
                          className="password-input"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          name="currentPassword"
                          placeholder="Enter current password"
                        />
                        <span className="input-icon">🔑</span>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        New Password
                        <span className="required-asterisk">*</span>
                      </label>
                      <div className="password-input-container">
                        <input 
                          type="password"
                          className="password-input"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          name="newPassword"
                          placeholder="Enter new password"
                        />
                        <span className="input-icon">🔄</span>
                      </div>
                      {formData.newPassword && (
                        <div className="password-strength">
                          <div className={`strength-bar ${formData.newPassword.length >= 8 ? 'strong' : 'weak'}`}></div>
                          <span className="strength-text">
                            {formData.newPassword.length >= 8 ? 'Strong password' : 'Weak password'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Confirm New Password
                        <span className="required-asterisk">*</span>
                      </label>
                      <div className="password-input-container">
                        <input 
                          type="password"
                          className={`password-input ${formData.confirmPassword && formData.newPassword !== formData.confirmPassword ? 'error' : ''}`}
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          name="confirmPassword"
                          placeholder="Confirm new password"
                        />
                        <span className="input-icon">✅</span>
                      </div>
                      {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                        <div className="error-message">
                          ❌ Passwords do not match
                        </div>
                      )}
                      {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                        <div className="success-message">
                          ✅ Passwords match
                        </div>
                      )}
                    </div>

                    <div className="password-requirements">
                      <h4 className="requirements-title">Password Requirements:</h4>
                      <ul className="requirements-list">
                        <li className={formData.newPassword.length >= 8 ? 'met' : ''}>
                          {formData.newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                        </li>
                        <li className={/[A-Z]/.test(formData.newPassword) ? 'met' : ''}>
                          {/[A-Z]/.test(formData.newPassword) ? '✓' : '○'} One uppercase letter
                        </li>
                        <li className={/[0-9]/.test(formData.newPassword) ? 'met' : ''}>
                          {/[0-9]/.test(formData.newPassword) ? '✓' : '○'} One number
                        </li>
                        <li className={/[!@#$%^&*]/.test(formData.newPassword) ? 'met' : ''}>
                          {/[!@#$%^&*]/.test(formData.newPassword) ? '✓' : '○'} One special character
                        </li>
                      </ul>
                    </div>
                    
                    <button 
                      className={`yellow-btn confirm-password-btn ${
                        !formData.currentPassword || !formData.newPassword || !formData.confirmPassword || formData.newPassword !== formData.confirmPassword ? 'disabled' : ''
                      }`}
                      onClick={handlePasswordChange}
                      disabled={!formData.currentPassword || !formData.newPassword || !formData.confirmPassword || formData.newPassword !== formData.confirmPassword}
                    >
                      Update Password
                    </button>
                  </div>
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

        {activeSection === "carSuccess" && (
          <div className="modal-overlay">
            <div className="success-modal">
              <div className="success-icon">✓</div>
              <h2 className="success-title">Car Info Updated!</h2>
              <p className="success-message">Your car information successfully updated</p>
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

export default DriverProfile;