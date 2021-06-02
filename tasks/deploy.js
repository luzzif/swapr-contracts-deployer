const { task } = require("hardhat/config");

// require EXACT bytecodes
const {
    abi: factoryAbi,
    bytecode: factoryBytecode,
} = require("../dxswap-core/build/DXswapFactory.json");
const {
    abi: feeSetterAbi,
    bytecode: feeSetterBytecode,
} = require("../dxswap-core/build/DXswapFeeSetter.json");
const {
    abi: feeReceiverAbi,
    bytecode: feeReceiverBytecode,
} = require("../dxswap-core/build/DXswapFeeReceiver.json");
const {
    abi: routerAbi,
    bytecode: routerBytecode,
} = require("../dxswap-periphery/build/DXswapRouter.json");
const {
    abi: swaprERC20StakingRewardsDistributionFactoryAbi,
    bytecode: swaprERC20StakingRewardsDistributionFactoryBytecode,
} = require("../swapr-staking-rewards-distribution-contracts/build/SwaprERC20StakingRewardsDistributionFactory.json");

task(
    "deploy",
    "Deploys the whole contracts suite and optionally verifies source code on Etherscan"
)
    .addOptionalParam(
        "ownerAddress",
        "An address that will become the owner of the contracts after deployment. If not specified, the account generated from the passed in private key (i.e. the deployer) will be the owner"
    )
    .addParam(
        "protocolFeeNativeAssetReceiver",
        "The address that will receive the protocol fee, after it's been converted to the chain's native asset (ETH, xDAI, etc)"
    )
    .addParam(
        "protocolFeeFallbackReceiver",
        "The address that will receive the protocol fee when it cannot be converted to the chain's native asset"
    )
    .addParam(
        "nativeAssetWrapperAddress",
        "The address of the contract that wraps the native asset in the target chain"
    )
    .addFlag(
        "deployFarming",
        "Whether or not to deploy farming-related contracts"
    )
    .setAction(async (taskArguments, hre) => {
        const {
            protocolFeeNativeAssetReceiver,
            protocolFeeFallbackReceiver,
            nativeAssetWrapperAddress,
            ownerAddress,
            deployFarming,
        } = taskArguments;

        const [accountAddress] = await hre.web3.eth.getAccounts();

        console.log(
            "Using native asset protocol fee receiver:",
            protocolFeeNativeAssetReceiver
        );
        console.log(
            "Using exotic, fallback protocol fee receiver:",
            protocolFeeFallbackReceiver
        );
        console.log("Using native asset wrapper:", nativeAssetWrapperAddress);
        console.log("Using account:", accountAddress);
        console.log();

        console.log("Deploying factory");
        const factoryContract = await new hre.web3.eth.Contract(factoryAbi)
            .deploy({
                data: factoryBytecode.toString("hex"),
                arguments: [accountAddress], // initially set the fee to setter to the deployer
            })
            .send({ from: accountAddress });

        console.log("Deploying fee receiver");
        const feeReceiverContract = await new hre.web3.eth.Contract(
            feeReceiverAbi
        )
            .deploy({
                data: feeReceiverBytecode.toString("hex"),
                arguments: [
                    accountAddress,
                    factoryContract.options.address,
                    nativeAssetWrapperAddress,
                    protocolFeeNativeAssetReceiver,
                    protocolFeeFallbackReceiver,
                ],
            })
            .send({ from: accountAddress });

        console.log("Setting correct fee receiver in factory");
        await factoryContract.methods
            .setFeeTo(feeReceiverContract.options.address)
            .send({ from: accountAddress });
        console.log("Updating protocol fee receivers");
        await feeReceiverContract.methods
            .changeReceivers(
                protocolFeeNativeAssetReceiver,
                protocolFeeFallbackReceiver
            )
            .send({ from: accountAddress });

        console.log("Deploying fee setter");
        const feeSetterContract = await new hre.web3.eth.Contract(feeSetterAbi)
            .deploy({
                data: feeSetterBytecode.toString("hex"),
                arguments: [accountAddress, factoryContract.options.address],
            })
            .send({ from: accountAddress });

        console.log("Setting correct fee setter in factory");
        await factoryContract.methods
            .setFeeToSetter(feeSetterContract.options.address)
            .send({ from: accountAddress });

        // periphery
        console.log("Deploying router");
        const routerContract = await new hre.web3.eth.Contract(routerAbi)
            .deploy({
                data: routerBytecode.toString("hex"),
                arguments: [
                    factoryContract.options.address,
                    nativeAssetWrapperAddress,
                ],
            })
            .send({ from: accountAddress });

        // staking rewards distribution (liquidity mining)
        let stakingRewardsFactoryContract = null;
        if (deployFarming) {
            stakingRewardsFactoryContract = await new hre.web3.eth.Contract(
                swaprERC20StakingRewardsDistributionFactoryAbi
            )
                .deploy({
                    data: swaprERC20StakingRewardsDistributionFactoryBytecode.toString(
                        "hex"
                    ),
                    arguments: [
                        "0x0000000000000000000000000000000000000000",
                        "0x0000000000000000000000000000000000000000",
                    ],
                })
                .send({ from: accountAddress });
        } else {
            console.log("skipping farming contracts deployment");
        }

        if (ownerAddress) {
            console.log();
            console.log(
                "Transferring ownership of the contracts to the given address"
            );

            console.log("Transferring fee receiver ownership");
            await feeReceiverContract.methods
                .transferOwnership(ownerAddress)
                .send({ from: accountAddress });

            console.log("Transferring fee setter ownership");
            await feeSetterContract.methods
                .transferOwnership(ownerAddress)
                .send({ from: accountAddress });

            if (deployFarming) {
                console.log(
                    "Transferring ERC20 staking rewards distribution factory validator ownership"
                );
                await stakingRewardsFactoryContract.methods
                    .transferOwnership(ownerAddress)
                    .send({ from: accountAddress });
            }

            console.log(
                "Full ownership correctly transferred to the specified owner address"
            );
        }

        console.log();
        console.log(`== Core ==`);
        console.log(
            `Factory deployed at address ${factoryContract.options.address}`
        );
        console.log(
            `Fee setter deployed at address ${feeSetterContract.options.address}`
        );
        console.log(
            `Fee receiver deployed at address ${feeReceiverContract.options.address}`
        );
        console.log();
        console.log(`== Periphery ==`);
        console.log(
            `Router deployed at address ${routerContract.options.address}`
        );

        if (deployFarming) {
            console.log();
            console.log(`== Staking rewards distribution factory ==`);
            console.log(
                `Factory deployed at address ${stakingRewardsFactoryContract.options.address}`
            );
        }
    });
