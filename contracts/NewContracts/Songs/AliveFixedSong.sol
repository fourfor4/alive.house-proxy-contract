// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./AliveCommonSong.sol";
import "../RegistryContracts/AliveRegistry.sol";

contract AliveFixedSong is AliveCommonSong {
    uint256 public songId;
    uint8 public songType;
    uint256 public initialPrice;
    uint256 public startedAt;

    function initialize(
        address _aliveRegistry,
        address _royaltyReceiverSecondary, // royalityReceiver
        uint96 _royaltyFeesInBips, // this royality is for secondary sale and mint, which will be 0xsplit address of  band
        address _royaltyReceiverSplit,
        uint96 _offchainRoyaltyPercentageInBips, // bips = %*100 - this is in % roYALTY THAT THE ARTIST offers from the revenue generated from the band - 5% for e.g, this means artist will do a drop of 5% of his revenue for all his nft holders to claim the royalty.
        string memory _songURI,
        string memory _contractURI,
        address _artist,
        uint256 _songId,
        uint256[3] memory _songInfos
    ) external initializer initializerERC721A {
        __ERC721A_init("AliveE1", "AE1");
        _grantRole(DEFAULT_ADMIN_ROLE, _artist);
        _grantRole(GOVERNANCE_ROLE, _artist);
        _grantRole(PAUSER_ROLE, _artist);
        band = msg.sender;

        aliveRegistry = _aliveRegistry;
        mintRoyaltyReceiver = _royaltyReceiverSplit;
        offchainRoyaltyPercentageInBips = _offchainRoyaltyPercentageInBips;
        _setDefaultRoyalty(_royaltyReceiverSecondary, _royaltyFeesInBips);

        songId = _songId;
        baseURI = _songURI;
        contractURI = _contractURI;
        songType = 1;

        maxMintAmount = _songInfos[0];
        initialPrice = _songInfos[1];
        startedAt = _songInfos[2];
    }

    function getPrice(uint256 _quantity) public view returns (uint256 price) {
        return initialPrice * _quantity;
    }

    function mint(address _to, uint256 _quantity)
        public
        payable
        whenNotPaused
        nonReentrant
    {
        require(block.timestamp > startedAt);
        require(
            _quantity <
                AliveRegistry(aliveRegistry).getAliveSongMaxMintPerTxByType(
                    songType
                ),
            "You can mint Songs more than Limit per mint!"
        );
        require(
            totalSupply() + _quantity <= maxMintAmount,
            "Can't mint more than Limit!"
        );
        require(_quantity > 0, "You must mint more than 0!");
        uint256 price = getPrice(_quantity);
        require(msg.value >= price, "Insufficient funds!");
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        uint256 feePercent = AliveRegistry(aliveRegistry).feePercent();
        uint256 feePrice = (price * feePercent) / 100;
        payable(AliveRegistry(aliveRegistry).aliveHouseRoyaltyReceiver())
            .transfer(feePrice);
        payable(mintRoyaltyReceiver).transfer(price - feePrice);
        uint256 currentTotalSupply = totalSupply();
        super._mint(_to, _quantity);
        for (uint256 i = 0; i < _quantity; i++) {
            addressTokenIds[_to].push(currentTotalSupply + i + 1);
        }
        emit SongMinted(_to, _quantity, totalSupply(), address(this));
    }

    function updateStartAt(uint256 time) public onlyAdmin {
        startedAt = time;
    }
}
