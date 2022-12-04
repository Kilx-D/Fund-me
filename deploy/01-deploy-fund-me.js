const {networkConfig, developmentChain} = require("../helper-hardhat-config");
const {network } = require("hardhat")
const {verify} = require("../utils/verify");

module.exports = async({getNamedAccounts, deployments}) => {
    const {deploy, log, get} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;
    console.log(`the chain id is ${chainId}`)

    //if chain is x use address y
    //if chain is a use address b

    let ethUsdPriceFeedAddress; //= networkConfig[chainId]["ethUsdPriceFeed"];
    console.log(`the network name is ${network.name}`)
    if(developmentChain.includes(network.name)) {
        const ethUsdAggregator = await get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
        console.log(`price feed address is ${ethUsdPriceFeedAddress}`)
    }

    //if the contract doesn't exist, we dploy a minaml vewrsion of for our local testing


    //when going for local host
    //use a mock
    const args = [ethUsdPriceFeedAddress];
    console.log(`args are ${args}`)
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, //put price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations
    })

    console.log("deployed the contract")

    if(
        !developmentChain.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ){
        console.log(`etherscan api key is ${process.env.ETHERSCAN_API_KEY}`)
        await verify(fundMe.address, args)
    }

    log("---------------------------------------------------------------")
}

console.log("almost done with script")
module.exports.tags = ["all", "fundme"]