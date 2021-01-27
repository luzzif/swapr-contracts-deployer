const { task } = require("hardhat/config");

task(
    "deploy",
    "Deploys the whole contracts suite and optionally verifies source code on Etherscan"
)
    .addParam(
        "protocolFeeReceiver",
        "The address that will receive the protocol fee"
    )
    .addParam(
        "tokenRegistryAddress",
        "The address of the token registry used on Swapr"
    )
    .addParam(
        "tokenRegistryListId",
        "The unique identifier of token registry list id used to validate tokens on Swapr"
    )
    .addParam("wethAddress", "The WETH token address on the chosen network")
    .setAction(async (taskArguments, hre) => {
        const {
            protocolFeeReceiver,
            wethAddress,
            tokenRegistryAddress,
            tokenRegistryListId,
        } = taskArguments;
        const [accountAddress] = await hre.web3.eth.getAccounts();

        console.log("Using protocol fee receiver:", protocolFeeReceiver);
        console.log("Using weth:", wethAddress);
        console.log("Using account:", accountAddress);
        console.log();

        console.log("Deploying core deployer");
        const CoreDeployer = hre.artifacts.require("DXswapDeployer");
        const coreDeployer = await CoreDeployer.new(
            protocolFeeReceiver,
            accountAddress,
            wethAddress,
            [],
            [],
            []
        );

        // core
        console.log("Funding deployer");
        await hre.web3.eth.sendTransaction({
            from: accountAddress,
            to: coreDeployer.address,
            value: 1, // 1 wei
        });
        console.log("Calling deploy");
        const { receipt } = await coreDeployer.deploy();
        const { logs } = receipt;
        const factoryAddress = logs.find(
            (event) => event.event === "PairFactoryDeployed"
        ).args.factory;
        const feeReceiverAddress = logs.find(
            (event) => event.event === "FeeReceiverDeployed"
        ).args.feeReceiver;
        const feeSetterAddress = logs.find(
            (event) => event.event === "FeeSetterDeployed"
        ).args.feeSetter;

        // periphery
        const Router = hre.artifacts.require("DXswapRouter");
        console.log("Deploying router");
        const router = await Router.new(factoryAddress, wethAddress);

        // staking rewards distribution (liquidity mining)
        const DefaultRewardTokensValidator = hre.artifacts.require(
            "DefaultRewardTokensValidator"
        );
        console.log("Deploying reward tokens validator");
        const defaultRewardTokensValidator = await DefaultRewardTokensValidator.new(
            tokenRegistryAddress,
            tokenRegistryListId
        );
        console.log("Deploying stakable token validator");
        const DefaultStakableTokenValidator = hre.artifacts.require(
            "DefaultStakableTokenValidator"
        );
        console.log("Deploying staking reward distributions factory");
        const defaultStakableTokenValidator = await DefaultStakableTokenValidator.new(
            tokenRegistryAddress,
            tokenRegistryListId,
            factoryAddress
        );
        const StakingRewardsFactory = hre.artifacts.require(
            "SwaprERC20StakingRewardsDistributionFactory"
        );
        const stakingRewardsFactory = await StakingRewardsFactory.new(
            defaultRewardTokensValidator.address,
            defaultRewardTokensValidator.address
        );

        console.log();
        console.log(`== Core ==`);
        console.log(`Factory deployed at address ${factoryAddress}`);
        console.log(`Fee setter deployed at address ${feeSetterAddress}`);
        console.log(`Fee receiver deployed at address ${feeReceiverAddress}`);
        console.log();
        console.log(`== Periphery ==`);
        console.log(`Router deployed at address ${router.address}`);
        console.log();
        console.log(`== Staking rewards distribution factory ==`);
        console.log(
            `Reward tokens validator deployed at address ${defaultRewardTokensValidator.address}`
        );
        console.log(
            `Stakable token validator deployed at address ${defaultStakableTokenValidator.address}`
        );
        console.log(
            `Factory deployer at address ${stakingRewardsFactory.address}`
        );
    });
