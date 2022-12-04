const {network} = require("hardhat");
const {developmentChain, decimals, initial_answer} = require("../helper-hardhat-config");

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;


    if(developmentChain.includes(network.name)) {
        log("Local network detected, deploying mocks . . .");
        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [decimals, initial_answer]
        })
        log("Mocks deployed");
        log("---------------------------------------");
    }
}

module.exports.tags = ["all", "mocks"]