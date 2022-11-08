// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../NewBandContract.sol";
import "./NewMintType.sol";

contract V2BandContract is BandContract {
    function createSongNewType(
        address _royaltyReceiverSecondary,
        address royaltyReceiverMint,
        uint96 _offchainRoyalty,
        string memory _uri,
        string memory _contractURI,
        uint96 _royaltyFeesInBips,
        address _artist,
        uint256[6] calldata _configureDutchAuction
    ) public onlyGovernor returns (address) {
        uint256 id = allSongs.length + 1;
        bytes memory data = abi.encodeWithSelector(
            TestNewEdition(address(0)).initialize.selector,
            _royaltyReceiverSecondary,
            _royaltyFeesInBips,
            royaltyReceiverMint,
            _offchainRoyalty,
            _uri,
            _contractURI,
            id,
            _artist,
            address(msg.sender),
            _configureDutchAuction
        );

        BeaconProxy song = new BeaconProxy(
            address(Registry(aliveRegistry).nftBeacons()[3]),
            data
        );

        Songs memory newSong;
        newSong.nftContract = address(song);
        newSong.songId = id;
        newSong.songType = 3;
        newSong.splitSecondaryReceiverAddress = _royaltyReceiverSecondary;
        newSong.splitMintReceiverAddress = royaltyReceiverMint;
        allSongs.push(newSong);
        emit songAdded(address(song), allSongs.length, 4);
        return address(song);
    }
}
