import { ethers } from "hardhat";
import { uploadToIPFS } from "../utils/ipfs";
import crypto from "crypto";

async function main() {
  const registryAddr = process.env.REGISTRY_ADDRESS!;
  const web3Token = process.env.WEB3_STORAGE_TOKEN!;
  const hazardType = process.argv[41] || "high_waves";
  const location = process.argv[42] || "POINT(72.8777 19.0760)"; // WKT example (lon lat)
  const media = (process.argv[43] || "").split(",").filter(Boolean);

  const metadata = {
    hazardType, location, submittedAt: new Date().toISOString()
  };
  const cid = await uploadToIPFS(web3Token, media, metadata);
  const ipfsCid = `ipfs://${cid}/metadata.json`;

  const unique = `${hazardType}:${location}:${cid}`;
  const reportId = "0x" + crypto.createHash("sha256").update(unique).digest("hex");

  const registry = await ethers.getContractAt("HazardReportRegistry", registryAddr);
  const tx = await registry.submitReport(reportId, ipfsCid, hazardType, location);
  const rcpt = await tx.wait();
  console.log("Submitted:", rcpt?.hash, "CID:", ipfsCid, "ReportID:", reportId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
