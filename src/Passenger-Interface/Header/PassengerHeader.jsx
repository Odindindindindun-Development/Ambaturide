import React from "react";
import Header_Login from "./Header_Login";

// Minimal wrapper so existing imports of ./Header/PassengerHeader keep working.
export default function PassengerHeader(props) {
  return <Header_Login {...props} />;
}
