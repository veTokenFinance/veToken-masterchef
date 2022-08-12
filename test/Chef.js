// const { BN, constants, expectEvent, expectRevert, time } = require('openzeppelin-test-helpers');
const { constants, time } = require('openzeppelin-test-helpers');
const { expect, use } = require("chai");
const { ethers, network } = require("hardhat");
const { solidity } = require("ethereum-waffle");

use(solidity);

const REWARD_PER_BLOCK = ethers.utils.parseEther("100");
const TOTAL = 100 * 1000;
const TOTAL_REWARDS = ethers.utils.parseEther(TOTAL.toString());

// helper function for identifying object methods
// const getMethods = (obj) => {
        // let properties = new Set()
        // let currentObj = obj
        // do {
        //     Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
        //     }
        // while ((currentObj = Object.getPrototypeOf(currentObj)))
        //     return [...properties.keys()].filter(item => typeof obj[item] === 'function')
        // }

describe("MasterChef Tests", function () {
    
    let DummyLPToken;
    let VeToken;
    let MasterChef;
    let dummyLPToken1;
    let dummyLPToken2;
    let veToken;
    let masterChef;
    let owner;
    let user1;
    let user2;
    let current_block_data;
    let start_block;
    let end_block;
    let before_farming_starts;

    beforeEach(async function () {

    current_block_data = await hre.ethers.provider.getBlock("latest");
    start_block = current_block_data.number + 200;
    end_block = start_block + 1000;

    [owner, user1, user2] = await ethers.getSigners();

    DummyLPToken = await ethers.getContractFactory("DummyLPToken");
    dummyLPToken1 = await DummyLPToken.deploy();
    await dummyLPToken1.deployed();
    dummyLPToken2 = await DummyLPToken.deploy();
    await dummyLPToken2.deployed();
    VeToken = await ethers.getContractFactory("VeToken");
    veToken = await VeToken.deploy();
    await veToken.deployed();
    veTokenAddress = veToken.address;
    MasterChef = await ethers.getContractFactory("VeTokenMasterChef");
    masterChef = await MasterChef.deploy(veTokenAddress, REWARD_PER_BLOCK, start_block, end_block);
    await masterChef.deployed();
    await dummyLPToken1.mint(user1.address, ethers.utils.parseEther("400"));
    await dummyLPToken1.mint(user2.address, ethers.utils.parseEther("100"));
    await dummyLPToken2.mint(user1.address, ethers.utils.parseEther("1000"));
    await dummyLPToken2.mint(user2.address, ethers.utils.parseEther("1000"));
    await veToken.mint(masterChef.address, TOTAL_REWARDS);
    before_farming_starts = 0;
  });

    it("Should set the right owner", async function () {
        expect(await masterChef.owner()).to.equal(owner.address);
    });

    it("Should have the correct reward token set", async function () {
        expect(await masterChef.cvx()).to.equal(veToken.address);
    });

    it("Should have the correct reward per block set", async function () {
        expect(await masterChef.rewardPerBlock()).to.equal(REWARD_PER_BLOCK);
    });

    it("Should have the correct start block set", async function () {
        expect(await masterChef.startBlock()).to.equal(start_block);
    });

    it("Should have the correct end block set", async function () {
        expect(await masterChef.endBlock()).to.equal(end_block);
    });

    it("Should have the correct balance of reward tokens", async function () {
        expect(await veToken.balanceOf(masterChef.address)).to.equal(TOTAL_REWARDS);
    })

    it("Should set the added pool boolean for veToken at deployment", async function () {
        expect(await masterChef.isAddedPool(veToken.address)).to.equal(true);
    });

    it("Should have pool length zero at deployment", async function () {
        expect(await masterChef.poolLength()).to.equal(0);
    });

    it("Should allow adding new mining pools; and increase pool length", async function() {
        await masterChef.add(70, dummyLPToken1.address, constants.ZERO_ADDRESS);
        expect(await masterChef.poolLength()).to.equal(1);
    });

    it("Should return pool info from added mining pools with correct allocation points", async function() {
        await masterChef.add(70, dummyLPToken1.address, constants.ZERO_ADDRESS);
        let poolInfo = await(masterChef.poolInfo(0));
        let allocation_points = poolInfo.allocPoint;
        expect(allocation_points).to.equal(70);
    });

    it("Should allow owner to change existing mining pool data", async function() {
        await masterChef.add(70, dummyLPToken1.address, constants.ZERO_ADDRESS);
        await masterChef.set(0, 100, constants.ZERO_ADDRESS, false);
        let poolInfo = await(masterChef.poolInfo(0));
        let allocation_points = poolInfo.allocPoint;
        expect(allocation_points).to.equal(100);
    });

    it("Should return no multiplier before farming starts", async function() {
        let zero_multiplier = await masterChef.getMultiplier(before_farming_starts, start_block);
        let total_blocks_between = start_block - before_farming_starts;
        expect(zero_multiplier).to.equal(total_blocks_between);
    })

    it("Should allow users to deposit; and return their correct user info", async function() {
        await masterChef.add(70, dummyLPToken1.address, constants.ZERO_ADDRESS);
        await dummyLPToken1.connect(user1).approve(masterChef.address, ethers.utils.parseEther("400"));
        await masterChef.connect(user1).deposit(0, ethers.utils.parseEther("400"));
        let user1Info = await masterChef.userInfo(0, user1.address);
        expect(user1Info.rewardDebt).to.equal(0);
    })

    it("Should allow users to withdraw", async function() {
        await masterChef.add(70, dummyLPToken1.address, constants.ZERO_ADDRESS);
        await dummyLPToken1.connect(user1).approve(masterChef.address, ethers.utils.parseEther("400"));
        await masterChef.connect(user1).deposit(0, ethers.utils.parseEther("400"));
        let user1Info = await masterChef.userInfo(0, user1.address);
        await masterChef.connect(user1).withdraw(0, ethers.utils.parseEther("400"));
        user1Info = await masterChef.userInfo(0, user1.address);
        expect(user1Info.amount).to.equal(0);
    })

    it("Should allow users to claim pending reward tokens", async function() {
        // add pools; set approvals and deposit
        await masterChef.add(50, dummyLPToken1.address, constants.ZERO_ADDRESS);
        await masterChef.add(50, dummyLPToken2.address, constants.ZERO_ADDRESS);

        await dummyLPToken1.connect(user1).approve(masterChef.address, ethers.utils.parseEther("400"));
        await dummyLPToken1.connect(user2).approve(masterChef.address, ethers.utils.parseEther("100"));

        await dummyLPToken2.connect(user1).approve(masterChef.address, ethers.utils.parseEther("1000"));
        await dummyLPToken2.connect(user2).approve(masterChef.address, ethers.utils.parseEther("1000"));

        await masterChef.connect(user1).deposit(0, ethers.utils.parseEther("400"));
        await masterChef.connect(user2).deposit(0, ethers.utils.parseEther("100"));

        await masterChef.connect(user1).deposit(1, ethers.utils.parseEther("1000"));
        await masterChef.connect(user2).deposit(1, ethers.utils.parseEther("1000"));

        // advancing time to the end of the farming period
        current_block_data = await hre.ethers.provider.getBlock("latest");
        let block_number = current_block_data.number;

        for(block_number; block_number < 1200; block_number++) {
            await time.advanceBlock();
        }

        await masterChef.connect(user1).claim(0, user1.address);
        await masterChef.connect(user1).claim(1, user1.address);
        await masterChef.connect(user2).claim(0, user2.address);
        await masterChef.connect(user2).claim(1, user2.address);

        for(block_number; block_number < 1400; block_number++) {
            await time.advanceBlock();
        }

        await masterChef.connect(user1).claim(0, user1.address);
        await masterChef.connect(user1).claim(1, user1.address);
        await masterChef.connect(user2).claim(0, user2.address);
        await masterChef.connect(user2).claim(1, user2.address);
        expect(await veToken.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("65000"));

    })

});