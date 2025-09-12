import { ethers } from "hardhat";

async function main() {
  const oracleAddr = process.env.ORACLE_CONTRACT_ADDRESS!;
  const reportId = process.argv[41]!;
  const alertType = process.argv[42] || "EMERGENCY";
  const severity = parseInt(process.argv[43] || "8", 10);

  const oracle = await ethers.getContractAt("AlertOracle", oracleAddr);
  const tx = await oracle.pushAlert(reportId as `0x${string}`, alertType, severity);
  console.log("Alert tx:", (await tx.wait())?.hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
