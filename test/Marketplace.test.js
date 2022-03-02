const Marketplace = artifacts.require('./Marketplace.sol')
require('chai').use(require('chai-as-promised')).should()

contract('Marketplace', ([deployer, buyer, seller]) =>{
  let marketplace

  before(async () =>{
    marketplace = await Marketplace.deployed()
  })

  describe('deployment',async () =>{
    it('deploys successfully', async() =>{
      const address = await marketplace.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has a name', async() =>{
      const name = await marketplace.name()
      assert.equal(name, 'Dapp University Marketplace')
    })
  })

  describe('products',async () =>{
    let result, productCount
    before(async () =>{
      result = await marketplace.createProduct('iPhone X', web3.utils.toWei('1','Ether'),{from:seller})
      productCount = await marketplace.productCount()
    })

    it('creates products', async() =>{
      //Success
      assert.equal(productCount, 1)
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
      assert.equal(event.name, 'iPhone X', 'name is correct')
      assert.equal(event.price, '1000000000000000000', 'price is correct')
      assert.equal(event.owner, seller, 'owner is correct')
      assert.equal(event.purchased, false, 'purchased is correct')

      //Failure: Product must have a name
      await marketplace.createProduct('', web3.utils.toWei('1','Ether'),{from:seller}).should.be.rejected

      //Failure: Product must have a price
      await marketplace.createProduct('iPhone X', 0 ,{from:seller}).should.be.rejected
    })

    it('lists products', async() =>{
      const products =  await marketplace.products(productCount)
      assert.equal(products.id.toNumber(), productCount.toNumber(), 'id is correct')
      assert.equal(products.name, 'iPhone X', 'name is correct')
      assert.equal(products.price, '1000000000000000000', 'price is correct')
      assert.equal(products.owner, seller, 'owner is correct')
      assert.equal(products.purchased, false, 'purchased is correct')
    })

    it('Sells products', async() =>{
      //Track seller balance before purchase
      let oldSellerBalance
      oldSellerBalance = await web3.eth.getBalance(seller)
      oldSellerBalance = new web3.utils.BN(oldSellerBalance)

      //success: buyer makes purchase
      result = await marketplace.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('1','Ether')})

      const event =  result.logs[0].args
      assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
      assert.equal(event.name, 'iPhone X', 'name is correct')
      assert.equal(event.price, '1000000000000000000', 'price is correct')
      assert.equal(event.owner, buyer, 'owner is correct')
      assert.equal(event.purchased, true, 'purchased is correct')

      //check that seller receives funds
      let newSellerBalance
      newSellerBalance = await web3.eth.getBalance(seller)
      newSellerBalance = new web3.utils.BN(newSellerBalance)

      let price
      price = web3.utils.toWei('1','Ether')
      price = new web3.utils.BN(price)

      const expectedBalance = oldSellerBalance.add(price)
      assert.equal(newSellerBalance.toString(), expectedBalance.toString())

      //failure: make sure product exists
      await marketplace.purchaseProduct(productCount+1, {from: buyer, value: web3.utils.toWei('1','Ether')}).should.be.rejected

      //failure: enought ether
      await marketplace.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('0.5','Ether')}).should.be.rejected

      //failure: deployer ries to buy the product. product can't be purchased twice
      await marketplace.purchaseProduct(productCount, {from: deployer, value: web3.utils.toWei('1','Ether')}).should.be.rejected

      //failure: buyer tries to buy again. ie buyer can't be the seller
      await marketplace.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('1','Ether')}).should.be.rejected
    })

  })
})
