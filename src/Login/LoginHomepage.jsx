import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import manDrivingIMG from '../assets/driving-homepage.jpg';
import './PassengerLogin/PassengerloginCss/LoginHomepage.css';
import Header from '../Header';

function LoginHomepage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const userType = localStorage.getItem("userType"); // 'passenger' or 'driver'
    const token = localStorage.getItem("authToken");

    if (token && userType === "passenger") {
      navigate("/PassengerHomepage");
    } else if (token && userType === "driver") {
      navigate("/Dashboard/DriverBooking");
    }
  }, [navigate]);

  const handlePassengerClick = () => {
    const userType = localStorage.getItem("userType");
    const token = localStorage.getItem("authToken");

    if (token && userType === "passenger") {
      navigate("/PassengerHomepage");
    } else {
      navigate("/PassengerLogin");
    }
  };

  const handleDriverClick = () => {
    const userType = localStorage.getItem("userType");
    const token = localStorage.getItem("authToken");

    if (token && userType === "driver") {
      navigate("/Dashboard/DriverBooking");
    } else {
      navigate("/DriverLogin");
    }
  };

  return (
    <>
      <Header />
      <div className="app-container">
        <div className="homepage-container">
          <div className="homepage-left">
            <h2>Login to access your account</h2>
            <div className="button-group">
              <button className="btn rider" onClick={handlePassengerClick}>
                Passenger
              </button>
              <button className="btn driver" onClick={handleDriverClick}>
                Driver
              </button>
            </div>
          </div>

          <div className="homepage-right">
            <img src={manDrivingIMG} alt="Person driving" />
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginHomepage;
