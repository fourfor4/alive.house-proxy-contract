// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./AliveBand.sol";
import "../Songs/AliveNewSong.sol";
import "../Songs/AliveBondedSongV2.sol";

contract AliveBandV2 is AliveBand {
    function createNewSong(
        address _royaltyReceiverSecondary,
        uint96 _royaltyFeesInBips,
        address _royaltyReceiverSplit,
        uint96 _offchainRoyaltyPercentageInBips,
        string memory _songURI,
        string memory _contractURI,
        address _artist,
        uint256[3] memory _songInfos
    ) public onlyGovernor returns (address) {
        uint256 songId = allSongs.length + 1;
        bytes memory data = abi.encodeWithSelector(
            AliveNewSong(address(0)).initialize.selector,
            aliveRegistry,
            _royaltyReceiverSecondary,
            _royaltyFeesInBips,
            _royaltyReceiverSplit,
            _offchainRoyaltyPercentageInBips,
            _songURI,
            _contractURI,
            _artist,
            songId,
            _songInfos
        );

        BeaconProxy song = new BeaconProxy(
            address(
                AliveRegistry(aliveRegistry).getAliveSongImp(2).aliveSongBeacon
            ),
            data
        );
        Song memory newSong;
        newSong.songContract = address(song);
        newSong.songId = songId;
        newSong.songType = 4;
        newSong.splitSecondaryReceiverAddress = _royaltyReceiverSecondary;
        newSong.splitMintReceiverAddress = _royaltyReceiverSplit;
        allSongs.push(newSong);
        emit SongCreated(address(song), songId, 4);
        return address(song);
    }

    function createBondedSongV2(
        address _royaltyReceiverSecondary,
        uint96 _royaltyFeesInBips,
        address _royaltyReceiverSplit,
        uint96 _offchainRoyaltyPercentageInBips,
        string memory _songURI,
        string memory _contractURI,
        address _artist,
        uint256[3] memory _songInfos
    ) public onlyGovernor returns (address) {
        uint256 songId = allSongs.length + 1;
        bytes memory data = abi.encodeWithSelector(
            AliveBondedSongV2(address(0)).initialize.selector,
            aliveRegistry,
            _royaltyReceiverSecondary,
            _royaltyFeesInBips,
            _royaltyReceiverSplit,
            _offchainRoyaltyPercentageInBips,
            _songURI,
            _contractURI,
            _artist,
            songId,
            _songInfos
        );

        BeaconProxy song = new BeaconProxy(
            address(
                AliveRegistry(aliveRegistry).getAliveSongImp(2).aliveSongBeacon
            ),
            data
        );
        Song memory newSong;
        newSong.songContract = address(song);
        newSong.songId = songId;
        newSong.songType = 2;
        newSong.splitSecondaryReceiverAddress = _royaltyReceiverSecondary;
        newSong.splitMintReceiverAddress = _royaltyReceiverSplit;
        allSongs.push(newSong);
        emit SongCreated(address(song), songId, 2);
        return address(song);
    }
}
