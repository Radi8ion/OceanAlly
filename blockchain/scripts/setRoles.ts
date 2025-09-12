import { ethers } from "hardhat";

const VALIDATOR_ROLE = ethers.id("VALIDATOR_ROLE");
const ORACLE_ROLE = ethers.id("ORACLE_ROLE");

async function main() {
  const validator = process.env.VALIDATOR_ADDRESS!;
  const oracle = process.env.ORACLE_ADDRESS!;
  const registryAddr = process.env.REGISTRY_ADDRESS!;
  const oracleAddr = process.env.ORACLE_CONTRACT_ADDRESS!;

  const registry = await ethers.getContractAt("HazardReportRegistry", registryAddr);
  await (await registry.grantRole(VALIDATOR_ROLE, validator)).wait();
  await (await registry.grantRole(ORACLE_ROLE, oracle)).wait();

  const alertOracle = await ethers.getContractAt("AlertOracle", oracleAddr);
  await (await alertOracle.grantRole(ORACLE_ROLE, oracle)).wait();

  console.log("Roles granted.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
