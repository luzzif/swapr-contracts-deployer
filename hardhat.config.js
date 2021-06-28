require("dotenv").config();
require("@nomiclabs/hardhat-truffle5");
require("./tasks/deploy");
require("./tasks/check-deployment");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    networks: {
        arbitrumTestnetV5: {
            url: "https://kovan5.arbitrum.io/rpc",
            accounts: [process.env.PRIVATE_KEY],
            gasPrice: 0,
            gas: 1000000000,
            timeout: 100000,
        },
        arbitrumMainnet: {
            url: "https://arb1.arbitrum.io/rpc",
            accounts: [process.env.PRIVATE_KEY],
            gasPrice: 0,
            timeout: 100000,
        },
        arbitrumRinkebyTestnet: {
            url: "https://rinkeby.arbitrum.io/rpc",
            accounts: [process.env.PRIVATE_KEY],
            gasPrice: 0,
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
