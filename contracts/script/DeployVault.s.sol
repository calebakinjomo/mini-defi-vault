//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/vault.sol";

contract DeployVault is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);
        Vault vault = new Vault();

        console.log("Vault deployed at:");
        console.log(address(vault));
        vm.stopBroadcast();
    }
}
