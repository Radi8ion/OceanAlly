import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveOfflineReport = async (report) => {
  let stored = await AsyncStorage.getItem("offlineReports");
  let reports = stored ? JSON.parse(stored) : [];
  reports.push(report);
  await AsyncStorage.setItem("offlineReports", JSON.stringify(reports));
};

export const getOfflineReports = async () => {
  let stored = await AsyncStorage.getItem("offlineReports");
  return stored ? JSON.parse(stored) : [];
};
