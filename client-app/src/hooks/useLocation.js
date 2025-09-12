import { useState } from "react";
import * as Location from "expo-location";

export default function useLocation() {
  const [location, setLocation] = useState(null);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access location denied");
      return;
    }
    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
  };

  return { location, getLocation };
}
