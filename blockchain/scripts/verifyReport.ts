import { ethers } from "hardhat";

async function main() {
  const registryAddr = process.env.REGISTRY_ADDRESS!;
  const reportId = process.argv[41]!;
  const confidence = parseInt(process.argv[42] || "90", 10);

  const registry = await ethers.getContractAt("HazardReportRegistry", registryAddr);
  const tx = await registry.verifyReport(reportId as `0x${string}`, confidence);
  console.log("Verify tx:", (await tx.wait())?.hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
