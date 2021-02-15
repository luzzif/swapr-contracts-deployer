# Swapr contracts deployer

A helper repo that can be used to deploy Swapr-related contracts
(core/periphery/) to any given EVM-compatible network.

## Getting started

The project basically consists in a Hardhat task that performs the deployment
itself.

In order to use it, clone the repo on your local machine, install the
dependencies by launching

```
yarn
```

in the project's root, and create a `.env` file with the following structure:

```
PRIVATE_KEY="a private key"
```

This private key will be used to derive the account that will perform the
deployment, and that will ultimately be the owner of the platform's contracts.

## How to use

To actually trigger a deployiment, simply run:

```
yarn deploy
```

The following parameters are required for the command to work as expected:

- `--network`: specifies the network on which you want to perform the
  deployment. Valid values are listed in the `hardhat.config.js`.
- `--protocol-fee-native-asset-receiver`: the address that will receive the
  protocol fee, after it's been converted to the chain's native asset (ETH,
  xDAI, etc).
- `--protocol-fee-fallback-receiver`: The address that will receive the protocol
  fee when it cannot be converted to the chain's native asset.
- `--token-registry-address`: the address of the token registry used on Swapr.
  Check [this link](https://github.com/nicoelzer/dxDAO-Token-Registry) out for
  more info.
- `--token-registry-list-id`: the unique identifier of the token list,
  registered in the previously passed token registry instance, that will be used
  by the staking contracts to perform input validation.
- `--native-asset-wrapper-address`: the address of the contract that wraps the
  native asset in the target chain.
- `--owner-address`: An address that will become the owner of the contracts
  after deployment. If not specified, the account generated from the passed in
  private key (i.e. the deployer) will be the owner.
