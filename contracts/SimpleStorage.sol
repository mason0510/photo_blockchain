pragma solidity ^0.4.18;

contract SimpleStorage {
  string [] storedData;

  function addData(string x) public {
    storedData.push(x);
  }

  function getData(uint i) public view returns (uint,string) {
    return (storedData.length,storedData[i]);
  }
}
