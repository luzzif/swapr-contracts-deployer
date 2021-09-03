require("dotenv").config();
require("@nomiclabs/hardhat-truffle5");
require("./tasks/deploy");
require("./tasks/check-deployment");

const infuraId = process.env.INFURA_ID;
const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    networks: {
        arbitrumTestnetV5: {
            url: "https://kovan5.arbitrum.io/rpc",
            accounts,
            gasPrice: 0,
            gas: 1000000000,
            timeout: 100000,
        },
        arbitrumMainnet: {
            url: "https://arb1.arbitrum.io/rpc",
            accounts,
            gasPrice: 0,
            timeout: 100000,
        },
        rinkeby: {
            url: `https://rinkeby.infura.io/v3/${infuraId}`,
            accounts,
        },
        arbitrumRinkebyTestnet: {
            url: "https://rinkeby.arbitrum.io/rpc",
            accounts,
            gasPrice: 0,
            timeout: 100000,
        },
        sokol: {
            url: "https://sokol.poa.network",
            accounts,
            gasPrice: 1000000000,
            timeout: 100000,
        },
        xdai: {
            url: "https://rpc.xdaichain.com/",
            accounts,
            gasPrice: 1000000000,
            timeout: 100000,
        },
    },
};
