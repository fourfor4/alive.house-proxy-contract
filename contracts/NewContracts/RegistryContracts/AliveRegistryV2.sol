// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./AliveRegistry.sol";

contract AliveRegistryV2 is AliveRegistry {
    string public versionTest;

    function setVersionTest(string memory _testVal) public {
        versionTest = _testVal;
    }
}
