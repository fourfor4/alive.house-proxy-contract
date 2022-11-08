// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Beacons/AliveBandBeacon.sol";
import "../Beacons/AliveSongBeacon.sol";
import "../ProxyAdmin.sol";

contract AliveRegistry is Initializable, ProxyAdmin {
    struct AliveSongImp {
        address impAddress;
        uint256 maxMintAmountPerTx;
        AliveSongBeacon aliveSongBeacon;
        uint8 songVersion;
    }

    uint256 initialMaxMintAmountPerTx;

    address public aliveHouseRoyaltyReceiver;
    address public splitsAddress;
    address public adminAddress;

    AliveBandBeacon public aliveBandBeacon;

    mapping(address => bool) public isManagerWallet;
    mapping(address => bool) public isSignerWallet;
    mapping(uint8 => AliveSongImp) public aliveSongByType;

    uint8 public feePercent;
    uint8 public totalSongTypes;

    uint8 public bandVersion;
    uint8 public registryVersion;
    uint8 public houseVersion;

    // Modifier
    modifier onlyAdmin() {
        require(adminAddress == msg.sender, "Only Admin!");
        _;
    }

    // Events
    event AddNewSongImp(address newSongImp, uint256 maxMintAmount);
    event UpgradeAliveBandImp(address to, uint8 version);
    event UpgradeAliveSongImp(uint8 songType, address to, uint8 version);
    event AddManagers(address[] managers);
    event RemoveManagers(address[] managers);
    event ChangeAdmin(address oldAdmin, address newAdmin);
    event UpgradeRegistry(address to, uint8 version);
    event UpgradeHouse(address to, uint8 version);

    function initialize(
        address _aliveHouseRoyaltyReceiver, // Treasury Wallet address
        uint8 _feePercent, // Precentage of Fee
        address _managerWallet, // Alive Manager Wallet address
        address _bandImp, // Initial Band implementation address
        address[] memory _songImps, // Initial Song implementations address
        uint256[] memory _maxMintAmountsPerTx, // Limits of songs per mint
        address _splitsAddress, // Splits Imp address
        address _admin
    ) public initializer {
        require(_feePercent < 100, "Percentage must be less than 100!");
        initialMaxMintAmountPerTx = 10;
        isManagerWallet[_managerWallet] = true;
        aliveHouseRoyaltyReceiver = _aliveHouseRoyaltyReceiver;
        aliveBandBeacon = new AliveBandBeacon(_bandImp);
        totalSongTypes = uint8(_songImps.length);
        adminAddress = _admin;
        unchecked {
            for (uint8 i = 0; i < totalSongTypes; i++) {
                uint256 tempMaxMint;
                if (_maxMintAmountsPerTx[i] != 0) {
                    tempMaxMint = _maxMintAmountsPerTx[i];
                } else {
                    tempMaxMint = initialMaxMintAmountPerTx;
                }
                aliveSongByType[i + 1] = AliveSongImp(
                    _songImps[i],
                    tempMaxMint,
                    new AliveSongBeacon(_songImps[i]),
                    1
                );
            }
        }

        splitsAddress = _splitsAddress;
        bandVersion = 1;
        registryVersion = 1;
        houseVersion = 1;
    }

    function reset(
        address _aliveHouseRoyaltyReceiver, // Treasury Wallet address
        uint8 _feePercent, // Precentage of Fee
        address _managerWallet, // Alive Manager Wallet address
        address _bandImp, // Initial Band implementation address
        address[] memory _songImps, // Initial Song implementations address
        uint256[] memory _maxMintAmountsPerTx, // Limits of songs per mint
        address _splitsAddress // Splits Imp address
    ) external onlyAdmin {
        require(_feePercent < 100, "Percentage must be less than 100!");
        initialMaxMintAmountPerTx = 10;
        isManagerWallet[_managerWallet] = true;
        aliveHouseRoyaltyReceiver = _aliveHouseRoyaltyReceiver;
        aliveBandBeacon = new AliveBandBeacon(_bandImp);

        unchecked {
            for (uint8 i = 0; i < _songImps.length; i++) {
                uint256 tempMaxMint;
                if (_maxMintAmountsPerTx[i] != 0) {
                    tempMaxMint = _maxMintAmountsPerTx[i];
                } else {
                    tempMaxMint = initialMaxMintAmountPerTx;
                }
                aliveSongByType[i + 1] = AliveSongImp(
                    _songImps[i],
                    _maxMintAmountsPerTx[i],
                    new AliveSongBeacon(_songImps[i]),
                    1
                );
            }
        }

        splitsAddress = _splitsAddress;
        bandVersion = 1;
    }

    function getAliveSongMaxMintPerTxByType(uint8 _songType)
        external
        view
        returns (uint256)
    {
        return aliveSongByType[_songType].maxMintAmountPerTx;
    }

    function getAliveSongImp(uint8 _songType)
        external
        view
        returns (AliveSongImp memory)
    {
        require(
            _songType > 0 && _songType <= totalSongTypes,
            "There is no Song that you selected!"
        );
        return aliveSongByType[_songType];
    }

    function updateMaxMintAmountsPerTx(uint256[] calldata _maxMintAmountsPerTx)
        external
        onlyAdmin
    {
        unchecked {
            for (uint8 i = 0; i < totalSongTypes; i++) {
                uint256 tempMaxAmountMint;
                if (_maxMintAmountsPerTx[i] != 0) {
                    tempMaxAmountMint = _maxMintAmountsPerTx[i];
                } else {
                    tempMaxAmountMint = initialMaxMintAmountPerTx;
                }
                aliveSongByType[i + 1].maxMintAmountPerTx = tempMaxAmountMint;
            }
        }
    }

    function updateMaxMintAmountPerTxBySongType(
        uint8 _songType,
        uint256 _maxMintAmount
    ) external onlyAdmin {
        require(
            _songType > 0 && _songType <= totalSongTypes,
            "There is no Song that you selected!"
        );
        require(
            _maxMintAmount > 0,
            "The max mint amount of song must be over 0!"
        );
        aliveSongByType[_songType].maxMintAmountPerTx = _maxMintAmount;
    }

    function updateSplitsAddress(address _newSplit) external onlyAdmin {
        splitsAddress = _newSplit;
    }

    function updateAliveHouseRoyaltyReceiver(address _newTreasuryWallet)
        external
        onlyAdmin
    {
        aliveHouseRoyaltyReceiver = _newTreasuryWallet;
    }

    function updateRoyaltyFee(uint8 _newFeePercent) external onlyAdmin {
        require(_newFeePercent < 100, "Percentage must be less than 100!");
        feePercent = _newFeePercent;
    }

    function addMangerWallets(address[] calldata _newManagerWallets)
        external
        onlyAdmin
    {
        for (uint256 i = 0; i < _newManagerWallets.length; i++) {
            isManagerWallet[_newManagerWallets[i]] = true;
        }
        emit AddManagers(_newManagerWallets);
    }

    function removeManagerWallets(address[] calldata _removeManagerWallets)
        external
        onlyAdmin
    {
        for (uint256 i = 0; i < _removeManagerWallets.length; i++) {
            isManagerWallet[_removeManagerWallets[i]] = false;
        }
        emit RemoveManagers(_removeManagerWallets);
    }

    function addSignerWallets(address[] calldata _newSignerWallets)
        external
        onlyAdmin
    {
        for (uint256 i = 0; i < _newSignerWallets.length; i++) {
            isSignerWallet[_newSignerWallets[i]] = true;
        }
    }

    function removeSignerWallets(address[] calldata _removeSignerWallets)
        external
        onlyAdmin
    {
        for (uint256 i = 0; i < _removeSignerWallets.length; i++) {
            isSignerWallet[_removeSignerWallets[i]] = false;
        }
    }

    function upgradeAliveBandImp(address _to) public onlyAdmin returns (bool) {
        aliveBandBeacon.update(_to);
        bandVersion++;
        emit UpgradeAliveBandImp(_to, bandVersion);
        return true;
    }

    function upgradeAliveSongImp(uint8 _songType, address _to)
        public
        onlyAdmin
        returns (bool)
    {
        require(
            _songType > 0 && _songType <= totalSongTypes,
            "There is no Song that you selected!"
        );
        aliveSongByType[_songType].aliveSongBeacon.update(_to);
        aliveSongByType[_songType].songVersion++;
        emit UpgradeAliveSongImp(
            _songType,
            _to,
            aliveSongByType[_songType].songVersion
        );
        return true;
    }

    function addNewSongImp(address _newSongImp, uint256 _maxMintAmount)
        public
        onlyAdmin
    {
        require(
            _maxMintAmount > 0,
            "The max mint amount of song must be over 0!"
        );
        totalSongTypes = totalSongTypes + 1;
        aliveSongByType[totalSongTypes] = AliveSongImp(
            _newSongImp,
            _maxMintAmount,
            new AliveSongBeacon(_newSongImp),
            1
        );
        emit AddNewSongImp(_newSongImp, _maxMintAmount);
    }

    function changeAdmin(address _to) public onlyAdmin {
        emit ChangeAdmin(adminAddress, _to);
        adminAddress = _to;
    }

    function setInitialMaxMintAmountPerTx(uint256 _maxMintAmount)
        public
        onlyAdmin
    {
        initialMaxMintAmountPerTx = _maxMintAmount;
    }

    function upgradeVersion(
        TransparentUpgradeableProxy proxy,
        address implementation, // New Implementation Address
        uint8 contractNum // AliveRegistry: 0, AliveHouse: 1
    ) public onlyAdmin {
        upgrade(proxy, implementation);
        if (contractNum == 0) {
            registryVersion++;
            emit UpgradeRegistry(implementation, registryVersion);
        } else if (contractNum == 1) {
            houseVersion++;
            emit UpgradeHouse(implementation, houseVersion);
        }
    }

    function getProxyImplementation(TransparentUpgradeableProxy proxy)
        public
        view
        override
        returns (address)
    {
        // We need to manually run the static call since the getter cannot be flagged as view
        // bytes4(keccak256("implementation()")) == 0x5c60da1b
        (bool success, bytes memory returndata) = address(proxy).staticcall(
            hex"5c60da1b"
        );
        require(success);
        return abi.decode(returndata, (address));
    }

    /**
     * @dev Returns the current admin of `proxy`.
     *
     * Requirements:
     *
     * - This contract must be the admin of `proxy`.
     */
    function getProxyAdmin(TransparentUpgradeableProxy proxy)
        public
        view
        override
        returns (address)
    {
        // We need to manually run the static call since the getter cannot be flagged as view
        // bytes4(keccak256("admin()")) == 0xf851a440
        (bool success, bytes memory returndata) = address(proxy).staticcall(
            hex"f851a440"
        );
        require(success);
        return abi.decode(returndata, (address));
    }

    /**
     * @dev Changes the admin of `proxy` to `newAdmin`.
     *
     * Requirements:
     *
     * - This contract must be the current admin of `proxy`.
     */
    function changeProxyAdmin(
        TransparentUpgradeableProxy proxy,
        address newAdmin
    ) public override onlyAdmin {
        proxy.changeAdmin(newAdmin);
    }

    /**
     * @dev Upgrades `proxy` to `implementation` and calls a function on the new implementation. See
     * {TransparentUpgradeableProxy-upgradeToAndCall}.
     *
     * Requirements:
     *
     * - This contract must be the admin of `proxy`.
     */
    function upgradeAndCall(
        TransparentUpgradeableProxy proxy,
        address implementation,
        bytes memory data
    ) public payable override onlyAdmin {
        proxy.upgradeToAndCall{value: msg.value}(implementation, data);
    }

    /**
     * @dev Upgrades `proxy` to `implementation`. See {TransparentUpgradeableProxy-upgradeTo}.
     *
     * Requirements:
     *
     * - This contract must be the admin of `proxy`.
     */
    function upgrade(TransparentUpgradeableProxy proxy, address implementation)
        internal
        override
        onlyAdmin
    {
        proxy.upgradeTo(implementation);
    }
}
