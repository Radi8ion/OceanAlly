import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Registry = await ethers.getContractFactory("HazardReportRegistry");
  const registry = await Registry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("HazardReportRegistry:", registryAddr);

  const Oracle = await ethers.getContractFactory("AlertOracle");
  const oracle = await Oracle.deploy(deployer.address, registryAddr);
  await oracle.waitForDeployment();
  const oracleAddr = await oracle.getAddress();
  console.log("AlertOracle:", oracleAddr);

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
