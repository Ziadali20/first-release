import { createContext, useState } from "react";

export let UserContext = createContext();

export default function UserContextProvider(props) {
  const [userData, setUserData] = useState(null);
  const [rfmData, setRfmData] = useState({
    segmentData: null,
    monthlyRevenue: null,
    dailyRevenue: null,
    topCustomers: null,
    topProducts: null,
    geographicalRevenue: null,
    monthlyCustomerAcquisition:null
  });

  return (
    <UserContext.Provider value={{ userData, setUserData, rfmData, setRfmData }}>
      {props.children}
    </UserContext.Provider>
  );
}