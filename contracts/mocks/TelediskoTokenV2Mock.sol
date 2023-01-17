// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../NeokingdomTokenInternal/NeokingdomTokenInternal.sol";
import "../extensions/Roles.sol";

contract NeokingdomTokenInternalV2Mock is NeokingdomTokenInternal {
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        if (
            _shareholderRegistry.getStatus(from) ==
            _shareholderRegistry.SHAREHOLDER_STATUS()
        ) {
            // Amount set to zero so it just consumes what's expired
            _drainOffers(from, address(0), 0);
            require(
                amount <= _unlockedBalance[from],
                "NeokingdomTokenInternal: transfer amount exceeds unlocked tokens"
            );
        }
    }
}
