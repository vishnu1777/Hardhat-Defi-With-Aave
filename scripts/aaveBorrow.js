
const { getNamedAccounts, ethers, network } = require("hardhat")
const{ getWeth ,AMOUNT} = require("../scripts/getWeth")
const{networkConfig, developmentChains,} = require("../helper-hardhat-config")

async function main(){
    await getWeth()
    const{deployer} = await getNamedAccounts()
    
    const lendingPool = await getLendingPool(deployer)
    console.log(`lendingPool address is: ${lendingPool.address}`)
    
    const wethAddress = networkConfig[network.config.chainId].wethToken
    // We have to approve other contracts or people to use our token
    //Then we can lend our token
    await approveErc20(wethAddress,lendingPool.address,AMOUNT, deployer)
    console.log("Depositing...")
    await lendingPool.deposit(wethAddress,AMOUNT,deployer,0)
    console.log("Deposited")
    let {availableBorrowsETH,totalDebtETH} = await getBorrowUserData(lendingPool,deployer)
    // Before Borrowing we have to get The conversion rate of ETH TO Dai
    const daiPrice =  await getDaiPrice()
    //The below code gives us the amount of Dai we can actually borrow
    // we can borrow 95% so we used 0.95 under our code
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
    console.log(`This much of Dai we can Borrow:${amountDaiToBorrowWei}`)
    // After Depositing We Can borrow Assets 
    const daiAddress = networkConfig[network.config.chainId].daiToken 
     await borrowDai(daiAddress,lendingPool,amountDaiToBorrowWei,deployer)
    // After Borrowing Let's repay some 
    await repayBorrowedDai(daiAddress,lendingPool,amountDaiToBorrowWei,deployer)
    await getBorrowUserData(lendingPool,deployer)


}
// To repay we have to approve first and then we can repay
async function repayBorrowedDai(daiAddress,lendingPool,amount,account){
    await approveErc20(daiAddress,lendingPool.address,amount,account)
    const repay = await lendingPool.repay(daiAddress,amount,1,account)
    await repay.wait(1)
    console.log("Repayed Dai MF!!")
    

}

async function borrowDai(daiAddress,lendingPool,amountDaiToBorrowWei,account){
    // 1 is the interestRate: Dai has Stable Interest rate of 1
    // 0 is the referalcode Since we have no referalCode
    const tx =  await lendingPool.borrow(daiAddress,amountDaiToBorrowWei,1,0,account)
    await tx.wait(1)
    console.log("You've Borrowed")
}


async function getDaiPrice(){
    // Thus we are only reading from the contract we don't need to pass the signer to the getContract function
    const daiPrice = await ethers.getContractAt("AggregatorV3Interface",networkConfig[network.config.chainId].daiEthPriceFeed)
    const price  = (await daiPrice.latestRoundData())[1]//This returns the first index val 
    //i,e the answer present in latestRoundData Function
    console.log(`converted price is :${price}`)

    return price

}

async function getBorrowUserData(lendingPool,account)
{
    const{  totalCollateralETH,
        totalDebtETH,
        availableBorrowsETH}  = await lendingPool.getUserAccountData(account)
    console.log(`You have total Collateral ${totalCollateralETH} Worth of ETH`)
    console.log(`You have Total Base Debt of: ${totalDebtETH} `)
    console.log(`You have Available Borrow Base of: ${availableBorrowsETH}`)
    return {availableBorrowsETH,totalDebtETH}

}


async function getLendingPool(account) {
    // Since we are sending transaction Through lendingPoolAddresses we have to include our signer or deployer
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        networkConfig[network.config.chainId].lendingPoolAddressesProvider /* "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5"*/
        ,account
    )
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)
    return lendingPool
}

async function approveErc20(erc20Address,spenderAddress,amountToSpend,account){
    const erc20Token = await ethers.getContractAt("IERC20",erc20Address,account)
    const tx = await erc20Token.approve(spenderAddress,amountToSpend)
    await tx.wait(1)
    console.log("Approved!!")
}

  main().then(() => process.exit(0))
  .catch((error) => {
      console.error(error)
      process.exit(1)
  })