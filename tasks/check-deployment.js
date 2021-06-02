const { task } = require("hardhat/config");

const { abi: factoryAbi } = require("../dxswap-core/build/DXswapFactory.json");
const {
    abi: feeSetterAbi,
} = require("../dxswap-core/build/DXswapFeeSetter.json");
const {
    abi: feeReceiverAbi,
} = require("../dxswap-core/build/DXswapFeeReceiver.json");

task(
    "check-deployment",
    "Deploys the whole contracts suite and optionally verifies source code on Etherscan"
)
    .addParam("factoryAddress", "The address at which the factory is deployed.")
    .addParam(
        "feeReceiverAddress",
        "The address at which the fee receiver is deployed."
    )
    .addParam(
        "feeSetterAddress",
        "The address at which the fee setter is deployed."
    )
    .addParam(
        "expectedOwner",
        "The address which is expected to own the deployment."
    )
    .setAction(async (taskArguments, hre) => {
        const {
            factoryAddress,
            feeSetterAddress,
            feeReceiverAddress,
            expectedOwner,
        } = taskArguments;

        console.log("Using factory address:", factoryAddress);
        console.log("Using fee setter address:", feeSetterAddress);
        console.log("Using fee receiver address:", feeReceiverAddress);

        console.log();

        const factoryContract = await new hre.web3.eth.Contract(
            factoryAbi,
            factoryAddress
        );
        const feeSetterContract = await new hre.web3.eth.Contract(
            feeSetterAbi,
            feeSetterAddress
        );
        const feeReceiverContract = await new hre.web3.eth.Contract(
            feeReceiverAbi,
            feeReceiverAddress
        );

        const feeReceiverFromFactory = await factoryContract.methods
            .feeTo()
            .call();
        const feeSetterFromFactory = await factoryContract.methods
            .feeToSetter()
            .call();

        const feeReceiverOwner = await feeReceiverContract.methods
            .owner()
            .call();
        const feeSetterOwner = await feeSetterContract.methods.owner().call();

        const factoryFromFeeReceiver = await feeReceiverContract.methods
            .factory()
            .call();
        const factoryFromFeeSetter = await feeSetterContract.methods
            .factory()
            .call();

        const nativeAssetFeeReceiver = await feeReceiverContract.methods
            .ethReceiver()
            .call();
        const fallbackAssetFeeReceiver = await feeReceiverContract.methods
            .fallbackReceiver()
            .call();

        console.log();
        console.log(`== Checks ==`);
        console.log(`Fee receiver from factory: ${feeReceiverFromFactory}`);
        console.log(`Fee setter from factory: ${feeSetterFromFactory}`);
        console.log();
        console.log(`Fee receiver owned by: ${feeReceiverOwner}`);
        console.log(`Fee setter owned by: ${feeSetterOwner}`);
        console.log();
        console.log(`Factory from fee receiver: ${factoryFromFeeReceiver}`);
        console.log(`Factory from fee setter: ${factoryFromFeeSetter}`);
        console.log();
        console.log(
            `Native asset wrapper from fee receiver: ${await feeReceiverContract.methods
                .WETH()
                .call()}`
        );
        console.log(
            `Native asset receiver from fee receiver: ${nativeAssetFeeReceiver}`
        );
        console.log(
            `Fallback receiver from fee receiver: ${fallbackAssetFeeReceiver}`
        );

        if (
            feeReceiverOwner !== expectedOwner ||
            feeSetterOwner !== expectedOwner ||
            nativeAssetFeeReceiver !== expectedOwner ||
            fallbackAssetFeeReceiver !== expectedOwner ||
            feeReceiverFromFactory !== feeReceiverAddress ||
            feeSetterFromFactory !== feeSetterAddress ||
            factoryFromFeeReceiver !== factoryAddress ||
            factoryFromFeeSetter !== factoryAddress
        ) {
            throw new Error("inconsistencies found");
        }
    });
