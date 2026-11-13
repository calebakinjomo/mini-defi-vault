// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/vault.sol";

contract VaultTest is Test {
    Vault vault;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        vault = new Vault();
        vm.deal(alice, 10 ether);
        vm.deal(bob, 5 ether);
    }

    function testContractStartsWithZeroBalance() public view {
        assertEq(vault.contractBalance(), 0);
    }

    function testUserStartsWithZeroBalance() public view {
        assertEq(vault.getBalance(alice), 0);
    }

    function testDepositETH() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}();
        assertEq(vault.getBalance(alice), 1 ether);
        assertEq(vault.contractBalance(), 1 ether);
    }

    function testMultipleDeposits() public {
        vm.startPrank(alice);
        vault.deposit{value: 1 ether}();
        vault.deposit{value: 2 ether}();
        vm.stopPrank();
        assertEq(vault.getBalance(alice), 3 ether);
        assertEq(vault.contractBalance(), 3 ether);
    }

    function testDifferentUsersCanDeposit() public {
        vm.prank(alice);
        vault.deposit{value: 2 ether}();
        vm.prank(bob);
        vault.deposit{value: 1 ether}();
        assertEq(vault.getBalance(alice), 2 ether);
        assertEq(vault.getBalance(bob), 1 ether);
        assertEq(vault.contractBalance(), 3 ether);
    }

    function testCannotDepositZeroETH() public {
        vm.prank(alice);
        vm.expectRevert("Send ETH");
        vault.deposit{value: 0}();
    }

    function testWithdrawETH() public {
        vm.startPrank(alice);
        vault.deposit{value: 2 ether}();
        uint256 balanceBefore = alice.balance;
        vault.withdraw();
        uint256 balanceAfter = alice.balance;
        vm.stopPrank();
        assertEq(balanceAfter, balanceBefore + 2 ether);
        assertEq(vault.getBalance(alice), 0);
        assertEq(vault.contractBalance(), 0);
    }

    function testCannotWithdrawWithoutDeposit() public {
        vm.prank(alice);
        vm.expectRevert("Nothing to withdraw");
        vault.withdraw();
    }

    function testBalanceResetsAfterWithdraw() public {
        vm.startPrank(alice);
        vault.deposit{value: 1 ether}();
        vault.withdraw();
        vm.stopPrank();
        assertEq(vault.getBalance(alice), 0);
    }

    function testContractBalanceAfterDeposits() public {
        vm.prank(alice);
        vault.deposit{value: 2 ether}();
        vm.prank(bob);
        vault.deposit{value: 3 ether}();
        assertEq(vault.contractBalance(), 5 ether);
    }

    function testContractBalanceAfterWithdrawals() public {
        vm.prank(alice);
        vault.deposit{value: 1 ether}();
        vm.prank(bob);
        vault.deposit{value: 4 ether}();
        vm.prank(alice);
        vault.withdraw();
        assertEq(vault.contractBalance(), 4 ether);
    }
}
