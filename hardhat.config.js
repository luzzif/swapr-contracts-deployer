require("dotenv").config();
require("@nomiclabs/hardhat-truffle5");
require("./tasks/deploy");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    networks: {
        arbitrumTestnetV4: {
            url: "https://kovan4.arbitrum.io/rpc",
            accounts: [process.env.PRIVATE_KEY],
            gasPrice: 0,
            gas: 1000000000,
            timeout: 100000,
        },
        sokol: {
            url: "https://sokol.poa.network",
            accounts: [process.env.PRIVATE_KEY],
            gasPrice: 1000000000,
            timeout: 100000,
        },
        xdai: {
            url: "https://rpc.xdaichain.com/",
            accounts: [process.env.PRIVATE_KEY],
            gasPrice: 1000000000,
            timeout: 100000,
        },
    },
};
