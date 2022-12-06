![Test workflow](https://github.com/NeokingdomDAO/contracts/actions/workflows/node.yml/badge.svg)

# Neokingdom DAO Contracts

Welcome to the Neokingdom DAO Contacts.

## Deployments

Neokingdom DAO will live on EVMOS.

### v1

```
Deploy DAO
  Network: evmos
  ChainId: 9001
  Deployer address: 


⛏️  Mine contracts
  Voting.sol
    - proxy at 
    - implementation at 

  ShareholderRegistry.sol
    - proxy at 
    - implementation at 

  TelediskoToken.sol
    - proxy at 
    - implementation at 

  ResolutionManager.sol
    - proxy at 
    - implementation at 
```

- [Voting](https://evm.evmos.org/address/0x469EF10604015A07dD4CBca3Ff5baeb80B41bfF4) ``
- [ShareholderRegistry](https://evm.evmos.org/address/0xeB13EBE7613f9FC03A4ac091574Dc04ceb45562f) ``
- [NeokingdomToken](https://evm.evmos.org/address/0x64Fd2411C9b6c0d2F6F70dAA77Bac63E93D6AB2B) ``
- [ResolutionManager](https://evm.evmos.org/address/0xA65d12De252c60EBD251b3aE45d6029e9eBCA5E7) ``
- [Treasury (Safe) on EVMOS](https://safe.evmos.org/evmos:0xBa4e22770217342d3a805527e7AfdF5147cA0827) `0xBa4e22770217342d3a805527e7AfdF5147cA0827` or `evmos1hf8zyaczzu6z6w5q25n70t7l29ru5zp8uwepyk`
- [Treasury (Safe) on Ethereum](https://app.safe.global/eth:0xb850A71e0eB68CAcc0de4BC21bE88577E88548F8) `0xb850A71e0eB68CAcc0de4BC21bE88577E88548F8`

## Commands

```
# Clean the build dir, sometimes this is a good idea
npx hardhat clean

# Compile the contracts
npx hardhat compile

# Test the contracts
npx hardhat test

# Deploy to production
npx hardhat deploy --network evmos
```
