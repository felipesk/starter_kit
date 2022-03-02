pragma solidity ^0.5.0;

contract Marketplace {
  string public name;
  uint public productCount = 0;
  mapping(uint => Product) public products;

  struct Product {
    uint id;
    string name;
    uint price;
    address payable owner;
    bool purchased;
  }

  event ProductCreate (
    uint id,
    string name,
    uint price,
    address payable owner,
    bool purchased
  );

  event ProductPurchased (
    uint id,
    string name,
    uint price,
    address payable owner,
    bool purchased
  );

  constructor() public {
    name = "Dapp University Marketplace";
  }

  function createProduct(string memory _name, uint _price) public{
    //Require valid _name
    require(bytes(_name).length > 0);
    //Require valid _price
    require(_price > 0);
    //Increment product count
    productCount ++;
    //creates Product
    products[productCount] = Product(productCount, _name, _price, msg.sender, false);
    //triggers event
    emit ProductCreate(productCount, _name, _price, msg.sender, false);
  }

  function purchaseProduct(uint _id) public payable{
    //Fetch the products
    Product memory _product = products[_id];
    //Fetch the owner
    address payable _seller = _product.owner;
    //Make sure the product is valid
    require(_product.id > 0 && _product.id <= productCount);
    //Require enough Ether in the transaction
    require(msg.value >= _product.price);
    //Require that the product has not been purchased
    require(!_product.purchased);
    //Require the buyer is not the seller
    require(_seller != msg.sender);
    //Transfer ownership
    _product.owner = msg.sender;
    //Marked as purchased
    _product.purchased = true;
    //Update the product in the mapping
    products[_id] = _product;
    //Pay the seller
    address(_seller).transfer(msg.value);
    //Trigger an event
    emit ProductPurchased(_id, _product.name, _product.price, msg.sender, true);
  }
}
