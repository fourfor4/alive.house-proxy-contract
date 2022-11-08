// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./AliveCommonSong.sol";
import "../RegistryContracts/AliveRegistry.sol";

contract AliveNewSong is AliveCommonSong {
    uint256 public songId;
    uint8 public songType;
    uint256 public initialPrice;
    uint256 public currentPrice;
    uint256 public discountRate;

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
        __ERC721A_init("AliveE4", "AE4");
        _grantRole(DEFAULT_ADMIN_ROLE, _artist);
        _grantRole(GOVERNANCE_ROLE, _artist);
        _grantRole(PAUSER_ROLE, _artist);

        aliveRegistry = _aliveRegistry;
        mintRoyaltyReceiver = _royaltyReceiverSplit;
        offchainRoyaltyPercentageInBips = _offchainRoyaltyPercentageInBips;
        _setDefaultRoyalty(_royaltyReceiverSecondary, _royaltyFeesInBips);

        songId = _songId;
        baseURI = _songURI;
        contractURI = _contractURI;
        songType = 4;

        maxMintAmount = _songInfos[0];
        initialPrice = _songInfos[1];
        currentPrice = _songInfos[1];
        discountRate = _songInfos[2];
    }

    function getPrice(uint256 _quantity)
        public
        view
        returns (uint256 totalPrice)
    {
        //  require(totalSupply() + amount <= maxBondedCurve, "max supply reached");
        require(_quantity > 0);
        uint256 price = currentPrice;
        uint256 temp = currentPrice;

        unchecked {
            for (uint256 i = 1; i < _quantity; i++) {
                if (temp >= discountRate) {
                    temp = temp - discountRate;
                }
                price = price + temp;
            }
        }
        return price;
    }

    function mint(address _to, uint256 _quantity) public payable nonReentrant {
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
        super._mint(_to, _quantity);
        emit SongMinted(_to, _quantity, totalSupply(), address(this));
    }
}
