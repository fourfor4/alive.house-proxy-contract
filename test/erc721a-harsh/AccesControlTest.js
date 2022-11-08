const { assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, upgrades } = require("hardhat");

// TODO - test and see some private functions are only callable by aliveMangers, and call all the functions that are accessible by artist in band contract and song contracts. test all the onlyAdmin and onlyGovernor modifier functions in alivecore as well.
