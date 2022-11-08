// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "@openzeppelin/contracts/access/Ownable.sol";

interface IRegistry  {

    function isManagerWallet(address) external view returns(bool);
    function Imps() external view returns(address[] memory);
    function aliveHouseRoyaltyReceiver() external view returns(address);
    function feePercentage() external view returns(uint256);
}