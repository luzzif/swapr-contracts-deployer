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

task(
    "deploy",
    "Deploys the whole contracts suite and optionally verifies source code on Etherscan"
)
    .addParam(
        "ownerAddress",
        "An address that will become the owner of the contracts after deployment."
    )
    .addParam(
        "nativeAssetWrapperAddress",
        "The address of the contract that wraps the native asset in the target chain"
    )
    .setAction(async (taskArguments, hre) => {
        const { nativeAssetWrapperAddress, ownerAddress } = taskArguments;

        const [accountAddress] = await hre.web3.eth.getAccounts();

        console.log("Using native asset wrapper:", nativeAssetWrapperAddress);
        console.log("Using account:", accountAddress);
        console.log(
            "Deployer's balance:",
            hre.web3.utils.fromWei(
                await hre.web3.eth.getBalance(accountAddress)
            )
        );
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
                    ownerAddress,
                    factoryContract.options.address,
                    nativeAssetWrapperAddress,
                    ownerAddress,
                    ownerAddress,
                ],
            })
            .send({ from: accountAddress });

        console.log("Deploying fee setter");
        const feeSetterContract = await new hre.web3.eth.Contract(feeSetterAbi)
            .deploy({
                data: feeSetterBytecode.toString("hex"),
                arguments: [ownerAddress, factoryContract.options.address],
            })
            .send({ from: accountAddress });

        console.log("Setting correct fee receiver in factory");
        await factoryContract.methods
            .setFeeTo(feeReceiverContract.options.address)
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

        console.log();
        console.log(`== Owners ==`);
        console.log(
            `Fee setter owned by address ${await feeSetterContract.methods
                .owner()
                .call()}`
        );
        console.log(
            `Fee receiver owned by address ${await feeReceiverContract.methods
                .owner()
                .call()}`
        );

        console.log();
        console.log(`== Checks ==`);
        console.log(
            `Fee setter is set to ${await factoryContract.methods
                .feeToSetter()
                .call()} in factory`
        );
        console.log(
            `Fee receiver is set to ${await factoryContract.methods
                .feeTo()
                .call()} in factory`
        );
    });
