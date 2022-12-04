const { assert, expect } = require('chai');
const {deployments, ethers, getNamedAccounts} = require('hardhat');
const { developmentChain } = require('../../helper-hardhat-config');


!developmentChain.includes(network.name) ? describe.skip : 
describe("FundMe", async () => {
    let fundMe;
    let deployer;
    let mockv3Agg;
    const sendValue = ethers.utils.parseEther("1") //1 eth
    beforeEach(async () => {
        //const accounts = await ethers.getSigners();
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer);
        mockv3Agg = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })

    describe("constructor", async () => {
        it("sets the aggregator addresses correctly", async () => {
            
            const response = await fundMe.getPriceFeed();
            assert.equal(response, mockv3Agg.address)
        })
    })

    describe("fund", async () => {
        it("Fails if you don't send enough eth", async () => {
            await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!")
        })

        it("it updates the amount funded data structure", async () => {
            await fundMe.fund({value: sendValue})
            const response = await fundMe.getAddressToAmountFunded(
                deployer
            )

            assert.equal(response.toString(), sendValue.toString());
        })

        it("adds funder to array of funders", async() => {
            await fundMe.fund({value: sendValue});
            const funder = await fundMe.getFunder(0);
            assert.equal(funder, deployer);
        })

        
    })

    describe("withdraw", async() => {
        beforeEach(async() => {
            await fundMe.fund({value: sendValue})
        })

        it("withdraw eth from a single founder", async() => {
            //arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

            //act
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1);
            const {gasUsed, effectiveGasPrice} = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);


            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
            
            //gascost


            //assert 
            assert.equal(endingFundMeBalance, 0);
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())
        })

        it("allows us to withdraw with multiple funders", async() => {

            //arrange
            const accounts = await ethers.getSigners()

            for(let x = 1; x < 6; x++) {
                const fundMeConnectedContract = await fundMe.connect(accounts[x]);
                await fundMeConnectedContract.fund({value: sendValue})

                
            }

            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

            //Act
            const transactionResponse = await fundMe.cheaperWithdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const {gasUsed, effectiveGasPrice} = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);

            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

            //assert 
            assert.equal(endingFundMeBalance, 0);
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())
            
            //make sure the funders are reset properly
            //await expect(fundMe.getFunder(0)).to.be.reverted
            await expect(fundMe.getFunder({ value: 0 })).to.be.reverted;
            for(i = 1; i < 6; i++) {
                assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
            }

        })

        it("only allows the owner to withdraw", async () => {
            const accounts = await ethers.getSigners()
            const attacker = accounts[1];
            const attackerConnectedContract = await fundMe.connect(attacker);
            await expect(attackerConnectedContract.cheaperWithdraw()).to.be.revertedWith("FundMe__NotOwner")
        })
    })
})