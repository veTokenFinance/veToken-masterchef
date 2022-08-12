// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts-0.6/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-0.6/math/SafeMath.sol";

contract VeToken is ERC20 {
    using SafeMath for uint256;

    address public operator;

    uint256 public constant maxSupply = 100 * 1000000 * 1e18; //100mil

    constructor() public ERC20("veToken Finance", "VE3D") {
        operator = msg.sender;
    }

    function setOperator(address _operator) external {
        require(msg.sender == operator, "!auth");
        operator = _operator;
    }

    function mint(address _to, uint256 _amount) external {
        require(msg.sender == operator, "!authorized");
        require(totalSupply().add(_amount) < maxSupply, "Exceeed max supply!");

        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external {
        require(msg.sender == operator, "!authorized");

        _burn(_from, _amount);
    }
}