# VeToken Masterchef and Testing

Repo for MasterChef testing

## Quick start

The first things you need to do are cloning this repository and installing its
dependencies:

```sh
git clone https://github.com/nomiclabs/hardhat-hackathon-boilerplate.git
cd veToken-masterchef
npm install
```

Once installed, let's run Hardhat's testing network:

```sh
npx hardhat node
```

Alternately you can run the test suite with:
```sh
npx hardhat test
```

WARNING DEPLOY SCRIPT IS UNWRITTEN
Then, on a new terminal, go to the repository's root folder and run this to
deploy your contract:

```sh
npx hardhat run scripts/deploy.js --network localhost
```

> Note: There's [an issue in `ganache-core`](https://github.com/trufflesuite/ganache-core/issues/650) that can make the `npm install` step fail. 
>
> If you see `npm ERR! code ENOLOCAL`, try running `npm ci` instead of `npm install`.

Open [http://localhost:3000/](http://localhost:3000/) to see your Dapp. You will
need to have [Metamask](https://metamask.io) installed and listening to
`localhost 8545`.

## User Guide

You can find detailed instructions on using this repository and many tips in [its documentation](https://hardhat.org/tutorial).

- [Writing and compiling contracts](https://hardhat.org/tutorial/writing-and-compiling-contracts/)
- [Setting up the environment](https://hardhat.org/tutorial/setting-up-the-environment/)
- [Testing Contracts](https://hardhat.org/tutorial/testing-contracts/)
- [Setting up Metamask](https://hardhat.org/tutorial/hackathon-boilerplate-project.html#how-to-use-it)
- [Hardhat's full documentation](https://hardhat.org/getting-started/)

For a complete introduction to Hardhat, refer to [this guide](https://hardhat.org/getting-started/#overview).

## What’s Included?

Your environment will have everything you need to build a Dapp powered by Hardhat and React.

- [Hardhat](https://hardhat.org/): An Ethereum development task runner and testing network.
- [Mocha](https://mochajs.org/): A JavaScript test runner.
- [Chai](https://www.chaijs.com/): A JavaScript assertion library.
- [ethers.js](https://docs.ethers.io/v5/): A JavaScript library for interacting with Ethereum.
- [Waffle](https://github.com/EthWorks/Waffle/): To have Ethereum-specific Chai assertions/mathers.
- [A sample frontend/Dapp](./frontend): A Dapp which uses [Create React App](https://github.com/facebook/create-react-app).

## Troubleshooting

- `Invalid nonce` errors: if you are seeing this error on the `npx hardhat node`
  console, try resetting your Metamask account. This will reset the account's
  transaction history and also the nonce. Open Metamask, click on your account
  followed by `Settings > Advanced > Reset Account`.

## Feedback, help and news

We'd love to have your feedback on this tutorial. Feel free to reach us through
this repository or [our Discord server](https://invite.gg/HardhatSupport).

Also you can [follow us on Twitter](https://twitter.com/HardhatHQ).

**Happy _building_!**

# VeToken MasterChef Documentation

###### tags: `VeToken Finance` `RaidGuild`

## Deployment

- Deploy MasterChef with the following constructor parameters
    - reward token contract interface (called _cvx from Convex)
    - number of reward tokens issued to ***ALL*** pools per block
    - starting block number; this is the block where rewards will begin to accumulate thereafter
    - ending block; this is the block after where rewards will no longer accumulate

## Setup

- Add new pools by calling the add function and passing in the allocation points, the target LP which will accumulate rewards and an optional rewarder contract address for secondary rewards
- Change a pool's allocation points and/or add a new secondary rewarder contract by calling the set function and passing in the pid (the index of the reward pool in the poolInfo array)

## Caveats and Gotchas

- Caveats and gotchas
    - The rewards cannot be shut off once started.  Convex used a workaround for this by changing all allocation points to only accrue rewards for a pool which is inaccessible.
    - ***DO NOT*** add the same LP token as a reward target more than once.
    - Will not support over 32 separate reward pools.
    - The rewarder member of the PoolInfo struct can be used to add a second reward to pools
    - There's an unused constant in the contract called BONUS_MULTIPLIER; which is by default not actually used anywhere in the rest of the code
    - Secondary rewards must be distributed by contracts with the below IRewarder interface
    - onReward is called when user's deposit or withdraw; and is used to claim secondary rewards
    - emergency withdraw can be used to forgo user rewards and exit LP tokens from the pool - it can be needed if the reward tokens sent to the MasterChef contract, the rewardPerBlock and the startBlock and endBlock are not perfectly sync'd
    - Even if the tokens, reward per block, start and end block aren't perfectly sync'd the last person to withdraw should be able to receive most of their reward by calling safeRewardTransfer; which works in the case of rounding errors during .div operations.
```solidity
interface IRewarder {

    using SafeERC20 for IERC20;

    function onReward(uint256 pid, address user, address recipient, uint256 sushiAmount, uint256 newLpAmount) 
    external;

    function pendingTokens(uint256 pid, address user, uint256 sushiAmount)
    external view returns (IERC20[] memory, uint256[] memory);
}
```
