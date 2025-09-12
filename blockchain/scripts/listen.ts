// Backend Listener Script for HazardReportRegistry Events
import { ethers } from "ethers";
import "dotenv/config";
import HazardReportRegistryAbi from "../contracts/HazardReportRegistry.sol/HazardReportRegistry.json";

const WS_URL = process.env.AMOY_WS_URL || "wss://rpc-amoy.polygon.technology/";
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS!;

async function main() {
  const provider = new ethers.WebSocketProvider(WS_URL);
  const contract = new ethers.Contract(REGISTRY_ADDRESS, HazardReportRegistryAbi.abi, provider);

  contract.on("ReportSubmitted", (reportId, reporter, hazardType, location, ipfsCid, event) => {
    console.log("ReportSubmitted", { reportId, reporter, hazardType, location, ipfsCid, blockNumber: event.blockNumber });
  });
  
  contract.on("ReportVerified", (reportId, confidence, validator, event) => {
    console.log("ReportVerified", { reportId, confidence: Number(confidence), validator, blockNumber: event.blockNumber });
  });

  contract.on("AlertTriggered", (reportId, alertType, severity, event) => {
    console.log("AlertTriggered", { reportId, alertType, severity: Number(severity), blockNumber: event.blockNumber });
  });

  console.log("Listening for events...");
}

main().catch(console.error);
