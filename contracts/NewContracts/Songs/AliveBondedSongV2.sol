// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./AliveBondedSong.sol";

contract AliveBondedSongV2 is AliveBondedSong {
    string public version = "Bonded V2";

    function setUpcountRate(uint8 _times) external returns (uint256) {
        uint256 temp = upcountRate * _times;
        upcountRate = temp;
        return temp;
    }
}
