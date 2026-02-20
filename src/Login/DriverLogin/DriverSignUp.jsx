import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DriverSignUp.css';
import DriverHeader from '../../../src/DriverHeader.jsx'

const getPasswordStrength = (pwd) => {
  const criteria = {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd),
  };
  const score = Object.values(criteria).filter(Boolean).length;
  let level = '';
  if (pwd.length === 0) level = '';
  else if (score <= 2) level = 'weak';
  else if (score <= 4) level = 'medium';
  else level = 'strong';
  return { level, criteria, score };
};

function DriverSignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
    vehicleType: '',
    vehiclePlate: ''
  });
  const [licenseImage, setLicenseImage] = useState(null);
  const [vehicleImage, setVehicleImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const { level: strengthLevel, criteria } = getPasswordStrength(formData.password);

  // compute form validity so the submit button is disabled until all required fields are present
  const { email, password, confirmPassword, licenseNumber, vehicleType, vehiclePlate } = formData;
  const isFormValid =
    String(email || "").trim() !== "" &&
    String(password || "").length > 0 &&
    String(confirmPassword || "").length > 0 &&
    String(licenseNumber || "").trim() !== "" &&
    String(vehicleType || "").trim() !== "" &&
    String(vehiclePlate || "").trim() !== "" &&
    licenseImage !== null &&
    vehicleImage !== null &&
    password === confirmPassword;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLicenseImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLicenseImage(file);
    }
  };

  const handleVehicleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVehicleImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { email, password, confirmPassword, licenseNumber, vehicleType, vehiclePlate } = formData;

    if (!email || !password || !confirmPassword || !licenseNumber || !vehicleType || !vehiclePlate) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!licenseImage || !vehicleImage) {
      setError('Please upload both images');
      return;
    }

    try {
      const data = new FormData();
      data.append("firstName", "Driver");
      data.append("lastName", "User");
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("licenseNumber", formData.licenseNumber);
      data.append("vehicleType", formData.vehicleType); // Now sending the actual value directly
      data.append("plateNumber", formData.vehiclePlate);
      data.append("licenseImage", licenseImage);
      data.append("vehicleImage", vehicleImage);

      console.log("📤 Sending data:", {
        email: formData.email,
        vehicleType: formData.vehicleType,
        plateNumber: formData.vehiclePlate
      });

      const res = await fetch("http://localhost:3001/api/driver/signup", {
        method: "POST",
        body: data
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.message || "Failed to register driver");
        return;
      }

      alert("✅ Driver registered successfully!");
      navigate("/DriverLogin");

    } catch (err) {
      console.error(err);
      setError("Server error occurred");
    }
  };

  return (
    <>
      <DriverHeader />
      <div className="app-container">
        <div className="homepage-container">
          <div className="form-content">
            <div className="gmail-logo">
              <div className="logo-circle">
                <svg viewBox="0 0 24 24" width="40" height="40">
                  <path fill="#1a73e8" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
            </div>
            <div className="login-header">
              <h2>Create your Driver Account</h2>
              <p>Start earning with Ambaturide</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-columns">
                <div className="form-column">
                  <div className="form-group">
                    <label htmlFor="email">Email or Phone Number</label>
                    <input
                      type="text"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email or phone number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="password-input-container">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {formData.password.length > 0 && (
                      <>
                        <div className="strength-bar-wrapper">
                          <div className={`strength-bar strength-bar--${strengthLevel}`}>
                            <span /><span /><span />
                          </div>
                          <span className={`strength-label strength-label--${strengthLevel}`}>
                            {strengthLevel === 'weak' && '⚠ Weak'}
                            {strengthLevel === 'medium' && '◑ Medium'}
                            {strengthLevel === 'strong' && '✔ Strong'}
                          </span>
                        </div>
                        <ul className="password-requirements">
                          <li className={criteria.length ? 'met' : ''}>At least 8 characters</li>
                          <li className={criteria.uppercase ? 'met' : ''}>Uppercase letter (A–Z)</li>
                          <li className={criteria.lowercase ? 'met' : ''}>Lowercase letter (a–z)</li>
                          <li className={criteria.number ? 'met' : ''}>Number (0–9)</li>
                          <li className={criteria.symbol ? 'met' : ''}>Symbol (!@#$%^&*…)</li>
                        </ul>
                      </>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="password-input-container">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {/* Driver License Information */}
                  <div className="form-group">
                    <label htmlFor="licenseNumber">Driver's License Number</label>
                    <input
                      type="text"
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      placeholder="Enter your driver's license number"
                      required
                    />
                  </div>
                </div>

                <div className="form-column">
                  {/* Vehicle Information */}
                  <div className="form-group">
                    <label htmlFor="vehicleType">Vehicle Type</label>
                    <select
                      id="vehicleType"
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleInputChange}
                      required
                      className="select-input"
                    >
                      <option value="">Select vehicle type</option>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="Van">Van</option>
                      <option value="Motorcycle">Motorcycle</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="vehiclePlate">Vehicle Plate Number</label>
                    <input
                      type="text"
                      id="vehiclePlate"
                      name="vehiclePlate"
                      value={formData.vehiclePlate}
                      onChange={handleInputChange}
                      placeholder="Enter your vehicle plate number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="licenseImage">Driver's License Image</label>
                    <input
                      type="file"
                      id="licenseImage"
                      accept="image/*"
                      onChange={handleLicenseImageChange}
                      required
                      className="file-input"
                    />
                    {licenseImage && (
                      <div className="file-preview">
                        <span>Selected: {licenseImage.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="vehicleImage">Vehicle Image</label>
                    <input
                      type="file"
                      id="vehicleImage"
                      accept="image/*"
                      onChange={handleVehicleImageChange}
                      required
                      className="file-input"
                    />
                    {vehicleImage && (
                      <div className="file-preview">
                        <span>Selected: {vehicleImage.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={!isFormValid}
              >
                Sign Up as Driver
              </button>

              {!isFormValid && (
                <div className="error-message" style={{ marginTop: 8 }}>
                  Please complete all required fields and upload both images. Passwords must match.
                </div>
              )}

              <div className="divider">
                <span>Already have an account?</span>
              </div>

              <button
                type="button"
                className="create-account-btn"
                onClick={() => navigate('/DriverLogin')}
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default DriverSignUp;