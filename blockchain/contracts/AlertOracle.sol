// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

interface IHazardReportRegistry {
    function triggerAlert(bytes32 reportId, string calldata alertType, uint256 severity) external;
}

contract AlertOracle is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    IHazardReportRegistry public registry;

    event OracleAlert(bytes32 indexed reportId, string alertType, uint256 severity);

    constructor(address admin, address registryAddr) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
        registry = IHazardReportRegistry(registryAddr);
    }

    // This function is meant to be called by a whitelisted off-chain oracle (or Chainlink Functions router via a proxy)
    function pushAlert(bytes32 reportId, string calldata alertType, uint256 severity) external onlyRole(ORACLE_ROLE) {
        registry.triggerAlert(reportId, alertType, severity);
        emit OracleAlert(reportId, alertType, severity);
    }
}
