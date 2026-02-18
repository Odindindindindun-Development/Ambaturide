import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import PassengerHomepage from "./Passenger-Interface/PassengerHomepage.jsx";
import DriverSignUp from "./Login/DriverLogin/DriverSignUp.jsx";
import LoginHomepage from "./Login/LoginHomepage.jsx";
import PassengerLogin from "./Login/PassengerLogin/PassengerLogin.jsx";
import PassengerSignUp from "./Login/PassengerLogin/PassengerSignUp.jsx";
import DriverLogin from "./Login/DriverLogin/DriverLogin.jsx";
import PassengerProfile from "./Passenger-Interface/PassengerProfile.jsx";
import Passenger_Booking from "./Passenger-Interface/Passenger_Booking.jsx";
import PassengerBookingStatus from "./Passenger-Interface/PassengerBookingStatus.jsx";

// Driver pages
import DriverBooking from "./Driver-Interface/DriverBooking.jsx";
import DriverProfile from "./Driver-Interface/DriverProfile.jsx";
import Reviews from "./Driver-Interface/Reviews.jsx";
import DriverBookingStatus from "./Driver-Interface/DriverBookingStatus.jsx";

// Admin layout + subpages
import Admin from "./AdminInterface/Admin.jsx";
import AdminPanel from "./AdminInterface/AdminPanel2.jsx"; // <- add this import
import NewDriversPanel from "./AdminInterface/NewDrivers.jsx";
import DriverListPanel from "./AdminInterface/DriverList.jsx";
import BookingListPanel from "./AdminInterface/BookingList.jsx";
import Inquiries from "./AdminInterface/Inquiries.jsx";
import DriverReports from "./AdminInterface/DriverReports.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Passenger */}
        <Route path="/" element={<PassengerHomepage />} />
        <Route path="/LoginHomepage" element={<LoginHomepage />} />
        <Route path="/PassengerLogin" element={<PassengerLogin />} />
        <Route path="/PassengerSignUp" element={<PassengerSignUp />} />
        <Route path="/Passenger_Booking" element={<Passenger_Booking />} />
        <Route path="/PassengerProfile" element={<PassengerProfile />} />
        <Route path="/PassengerBookingStatus" element={<PassengerBookingStatus />} />

        {/* Driver */}
        <Route path="/DriverSignUp" element={<DriverSignUp />} />
        <Route path="/DriverLogin" element={<DriverLogin />} />
        <Route path="/DriverBooking" element={<DriverBooking />} />
        <Route path="/DriverProfile" element={<DriverProfile />} />
        <Route path="/Reviews" element={<Reviews />} />
        <Route path="/DriverBookingStatus" element={<DriverBookingStatus />} />

        {/* Admin layout with nested routes (lowercase /admin) */}
        <Route path="/admin" element={<Admin />}>
          <Route index element={<NewDriversPanel />} />
          <Route path="new-drivers" element={<NewDriversPanel />} />
          <Route path="drivers" element={<DriverListPanel />} />
          <Route path="bookings" element={<BookingListPanel />} />
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="DriverReports" element={<DriverReports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

