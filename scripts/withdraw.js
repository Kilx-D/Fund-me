const { ethers, getNamedAccounts } = require("hardhat");


(async () => {
  const {deployer} = await getNamedAccounts()
  const fundMe = await ethers.getContract("FundMe", deployer);
  console.log("Funding . . .");

  const transactionResponse = await fundMe.withdraw();
  await transactionResponse.wait(1);

  console.log("Got it back !")
})()