// SPDX-License-Identifier: PPL
pragma solidity ^0.8.24;

import {GaIA} from "../src/contracts/GaIA.sol";

interface Vm {
    function envUint(string calldata name) external view returns (uint256 value);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeployGaIA {
    Vm private constant VM = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (GaIA gaia) {
        uint256 privateKey = VM.envUint("PRIVATE_KEY");

        VM.startBroadcast(privateKey);
        gaia = new GaIA();
        VM.stopBroadcast();
    }
}
