// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./AliveHouse.sol";

contract AliveHouseV2 is AliveHouse {
    string public versionTest;

    function setVersionTest(string memory _testVal) public {
        versionTest = _testVal;
    }
}
