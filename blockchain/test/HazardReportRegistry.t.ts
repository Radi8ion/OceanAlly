import { expect } from "chai";
import { ethers } from "hardhat";

describe("HazardReportRegistry", () => {
  it("submits and verifies a report", async () => {
    const [admin, validator, alice] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("HazardReportRegistry");
    const registry = await Registry.connect(admin).deploy(admin.address);
    await registry.waitForDeployment();

    const VALIDATOR_ROLE = ethers.id("VALIDATOR_ROLE");
    await (await registry.grantRole(VALIDATOR_ROLE, validator.address)).wait();

    const reportId = ethers.keccak256(ethers.toUtf8Bytes("demo"));
    await (await registry.connect(alice).submitReport(reportId, "ipfs://cid/metadata.json", "high_waves", "POINT(0 0)")).wait();

    const r = await registry.getReport(reportId);
    expect(r.reporter).to.eq(alice.address);
    expect(r.verified).to.eq(false);

    await (await registry.connect(validator).verifyReport(reportId, 95)).wait();

    const r2 = await registry.getReport(reportId);
    expect(r2.verified).to.eq(true);
    expect(r2.confidence).to.eq(95);
  });

  it("blocks unverifiable callers", async () => {
    const [admin, attacker] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("HazardReportRegistry");
    const registry = await Registry.connect(admin).deploy(admin.address);
    await registry.waitForDeployment();

    const reportId = ethers.keccak256(ethers.toUtf8Bytes("demo2"));
    await (await registry.connect(attacker).submitReport(reportId, "ipfs://cid2/metadata.json", "tsunami", "POINT(1 1)")).wait();

    await expect(registry.connect(attacker).verifyReport(reportId, 80)).to.be.reverted;
  });
});
