// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// import "./Contract-harsh/AliveFixedUpgradeable.sol";

contract Attacker {
    address aliveFixedUpgradeable;
    uint256 public index = 1;

    constructor(address _aliveFixedAddress) {
        aliveFixedUpgradeable = _aliveFixedAddress;
    }

    // fallback() external payable {
    //     if (index < 4) {
    //         index = index + 1;
    //         AliveFixedUpgradeable(aliveFixedUpgradeable).fixedMint(
    //             address(this),
    //             1
    //         );
    //     }
    // }
}
