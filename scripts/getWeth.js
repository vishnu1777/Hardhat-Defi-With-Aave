const { getNamedAccounts, ethers } = require("hardhat")
const AMOUNT = ethers.utils.parseEther("0.02")
async function getWeth(){
    const{deployer} = await getNamedAccounts()
    //call the deposit function on the weth contract
    // we need the abi , contract address to interact
    // once we compile our solidity file we will get our abi
    // to get the Abi got to: https://etherscan.io/token/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
    // Grab the contract address of the mainNet i,e :0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    const IWeth = await ethers.getContractAt(
        /* This is the contract Name:*/"IWeth",/* This is the Main net address:*/"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        /*This is the address of */deployer)
   // We used the mainNet address because we are using MainNet Forking 
   // Which is another method in which our local host pretends to be the mainNet
   //In This way There is no need to use Mocks to run Tests     
   const tx =  await IWeth.deposit({value:AMOUNT})
   await tx.wait(1)
   const WethBalance = await IWeth.balanceOf(deployer)
   console.log(WethBalance.toString())
}   

module.exports = {getWeth,AMOUNT}