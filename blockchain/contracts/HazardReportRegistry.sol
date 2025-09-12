// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HazardReportRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    struct HazardReport {
        address reporter;
        string ipfsCid;        // IPFS CID for metadata+media
        string hazardType;     // e.g. "tsunami"
        string location;       // encoded WKT/WKB/GeoJSON snippet
        uint64 timestamp;      // unix seconds
        bool verified;
        uint8 confidence;      // 0-100 from AI/analyst/oracle
    }

    mapping(bytes32 => HazardReport) public reports;
    mapping(address => uint256) public reporterReputation;

    event ReportSubmitted(bytes32 indexed reportId, address indexed reporter, string hazardType, string location, string ipfsCid);
    event ReportVerified(bytes32 indexed reportId, uint8 confidence, address indexed validator);
    event ReputationUpdated(address indexed reporter, uint256 newScore);
    event AlertTriggered(bytes32 indexed reportId, string alertType, uint256 severity);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VALIDATOR_ROLE, admin);
    }

    function getReport(bytes32 reportId) external view returns (HazardReport memory) {
        return reports[reportId];
    }

    function submitReport(
        bytes32 reportId,
        string calldata ipfsCid,
        string calldata hazardType,
        string calldata location
    ) external nonReentrant {
        require(reports[reportId].timestamp == 0, "Report exists");
        reports[reportId] = HazardReport({
            reporter: msg.sender,
            ipfsCid: ipfsCid,
            hazardType: hazardType,
            location: location,
            timestamp: uint64(block.timestamp),
            verified: false,
            confidence: 0
        });
        emit ReportSubmitted(reportId, msg.sender, hazardType, location, ipfsCid);
    }

    function verifyReport(bytes32 reportId, uint8 confidence) external onlyRole(VALIDATOR_ROLE) {
        require(reports[reportId].timestamp != 0, "No report");
        require(!reports[reportId].verified, "Already verified");
        require(confidence <= 100, "Invalid confidence");
        reports[reportId].verified = true;
        reports[reportId].confidence = confidence;

        address rep = reports[reportId].reporter;
        reporterReputation[rep] += confidence;

        emit ReportVerified(reportId, confidence, msg.sender);
        emit ReputationUpdated(rep, reporterReputation[rep]);
    }

    // Oracle or automation hook to escalate alerts (e.g., from Chainlink Functions or off-chain service)
    function triggerAlert(bytes32 reportId, string calldata alertType, uint256 severity)
        external
        onlyRole(ORACLE_ROLE)
    {
        require(reports[reportId].timestamp != 0, "No report");
        emit AlertTriggered(reportId, alertType, severity);
    }
}