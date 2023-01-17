// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Arrays.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../NeokingdomTokenInternal/NeokingdomTokenInternal.sol";

contract NewNeokingdomTokenInternalMock is NeokingdomTokenInternal {
    event VestingSet2(address from, address to, uint256 amount);

    function mintVesting(address to, uint256 amount) public virtual override {
        emit VestingSet2(msg.sender, to, amount);
    }
}
