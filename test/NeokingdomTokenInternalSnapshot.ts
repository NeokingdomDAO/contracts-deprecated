import { ethers, upgrades } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { solidity } from "ethereum-waffle";
import {
  NeokingdomTokenInternal,
  NeokingdomTokenInternal__factory,
  ShareholderRegistryMock,
  ShareholderRegistryMock__factory,
  VotingMock,
  VotingMock__factory,
} from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { roles } from "./utils/roles";

chai.use(solidity);
chai.use(chaiAsPromised);
const { expect } = chai;

const AddressZero = ethers.constants.AddressZero;

const DAY = 60 * 60 * 24;
const WEEK = DAY * 7;

describe("NeokingdomTokenInternalSnapshot", () => {
  let RESOLUTION_ROLE: string, OPERATOR_ROLE: string;
  let NeokingdomTokenInternal: NeokingdomTokenInternal;
  let voting: VotingMock;
  let shareholderRegistry: ShareholderRegistryMock;
  let deployer: SignerWithAddress,
    account: SignerWithAddress,
    contributor: SignerWithAddress,
    contributor2: SignerWithAddress,
    nonContributor: SignerWithAddress;

  beforeEach(async () => {
    [deployer, account, contributor, contributor2, nonContributor] =
      await ethers.getSigners();

    const NeokingdomTokenInternalFactory = (await ethers.getContractFactory(
      "NeokingdomTokenInternal",
      deployer
    )) as NeokingdomTokenInternal__factory;

    const VotingMockFactory = (await ethers.getContractFactory(
      "VotingMock",
      deployer
    )) as VotingMock__factory;

    const ShareholderRegistryMockFactory = (await ethers.getContractFactory(
      "ShareholderRegistryMock",
      deployer
    )) as ShareholderRegistryMock__factory;

    NeokingdomTokenInternal = (await upgrades.deployProxy(
      NeokingdomTokenInternalFactory,
      ["Test", "TEST"],
      { initializer: "initialize" }
    )) as NeokingdomTokenInternal;
    await NeokingdomTokenInternal.deployed();

    voting = (await upgrades.deployProxy(VotingMockFactory)) as VotingMock;
    await voting.deployed();

    RESOLUTION_ROLE = await roles.RESOLUTION_ROLE();
    await NeokingdomTokenInternal.grantRole(RESOLUTION_ROLE, deployer.address);

    OPERATOR_ROLE = await roles.OPERATOR_ROLE();
    await NeokingdomTokenInternal.grantRole(OPERATOR_ROLE, deployer.address);

    const ESCROW_ROLE = await roles.ESCROW_ROLE();
    await NeokingdomTokenInternal.grantRole(ESCROW_ROLE, deployer.address);

    shareholderRegistry = (await upgrades.deployProxy(
      ShareholderRegistryMockFactory,
      {
        initializer: "initialize",
      }
    )) as ShareholderRegistryMock;
    await shareholderRegistry.deployed();

    await NeokingdomTokenInternal.setVoting(voting.address);
    await NeokingdomTokenInternal.setShareholderRegistry(
      shareholderRegistry.address
    );

    const contributorStatus = await shareholderRegistry.CONTRIBUTOR_STATUS();
    const shareholderStatus = await shareholderRegistry.SHAREHOLDER_STATUS();
    const investorStatus = await shareholderRegistry.INVESTOR_STATUS();

    await setContributor(contributor, true);
    await setContributor(contributor2, true);

    async function setContributor(user: SignerWithAddress, flag: boolean) {
      await shareholderRegistry.mock_isAtLeast(
        contributorStatus,
        user.address,
        flag
      );
      await shareholderRegistry.mock_isAtLeast(
        shareholderStatus,
        user.address,
        flag
      );
      await shareholderRegistry.mock_isAtLeast(
        investorStatus,
        user.address,
        flag
      );
    }
  });

  describe("snapshot logic", async () => {
    it("should increase snapshot id", async () => {
      await NeokingdomTokenInternal.snapshot();
      let snapshotIdBefore =
        await NeokingdomTokenInternal.getCurrentSnapshotId();
      await NeokingdomTokenInternal.snapshot();
      let snapshotIdAfter =
        await NeokingdomTokenInternal.getCurrentSnapshotId();

      expect(snapshotIdBefore.toNumber()).lessThan(snapshotIdAfter.toNumber());
    });

    describe("balanceOfAt", async () => {
      it("should return the balance at the time of the snapshot - mint", async () => {
        await NeokingdomTokenInternal.mint(contributor.address, 10);
        await NeokingdomTokenInternal.snapshot();
        const snapshotIdBefore =
          await NeokingdomTokenInternal.getCurrentSnapshotId();

        await NeokingdomTokenInternal.mint(contributor.address, 3);
        await NeokingdomTokenInternal.snapshot();
        const snapshotIdAfter =
          await NeokingdomTokenInternal.getCurrentSnapshotId();

        const balanceBefore = await NeokingdomTokenInternal.balanceOfAt(
          contributor.address,
          snapshotIdBefore
        );
        const balanceAfter = await NeokingdomTokenInternal.balanceOfAt(
          contributor.address,
          snapshotIdAfter
        );

        expect(balanceBefore).equal(10);
        expect(balanceAfter).equal(13);
      });

      it("should return the balance at the time of the snapshot - transfer send", async () => {
        await NeokingdomTokenInternal.mint(nonContributor.address, 10);
        await NeokingdomTokenInternal.snapshot();
        const snapshotIdBefore =
          await NeokingdomTokenInternal.getCurrentSnapshotId();

        await NeokingdomTokenInternal.connect(nonContributor).transfer(
          contributor.address,
          3
        );

        await NeokingdomTokenInternal.snapshot();
        const snapshotIdAfter =
          await NeokingdomTokenInternal.getCurrentSnapshotId();

        const balanceBefore = await NeokingdomTokenInternal.balanceOfAt(
          nonContributor.address,
          snapshotIdBefore
        );
        const balanceAfter = await NeokingdomTokenInternal.balanceOfAt(
          nonContributor.address,
          snapshotIdAfter
        );

        expect(balanceBefore).equal(10);
        expect(balanceAfter).equal(7);
      });

      it("should return the balance at the time of the snapshot - transfer receive", async () => {
        await NeokingdomTokenInternal.mint(nonContributor.address, 10);
        await NeokingdomTokenInternal.mint(contributor.address, 3);
        await NeokingdomTokenInternal.snapshot();
        const snapshotIdBefore =
          await NeokingdomTokenInternal.getCurrentSnapshotId();

        await NeokingdomTokenInternal.connect(nonContributor).transfer(
          contributor.address,
          4
        );

        await NeokingdomTokenInternal.snapshot();
        const snapshotIdAfter =
          await NeokingdomTokenInternal.getCurrentSnapshotId();

        const balanceBefore = await NeokingdomTokenInternal.balanceOfAt(
          contributor.address,
          snapshotIdBefore
        );
        const balanceAfter = await NeokingdomTokenInternal.balanceOfAt(
          contributor.address,
          snapshotIdAfter
        );

        expect(balanceBefore).equal(3);
        expect(balanceAfter).equal(7);
      });

      it("should return the balance at the time of the snapshot - burn", async () => {
        await NeokingdomTokenInternal.mint(nonContributor.address, 10);
        await NeokingdomTokenInternal.snapshot();
        const snapshotIdBefore =
          await NeokingdomTokenInternal.getCurrentSnapshotId();

        await NeokingdomTokenInternal.burn(nonContributor.address, 4);

        await NeokingdomTokenInternal.snapshot();
        const snapshotIdAfter =
          await NeokingdomTokenInternal.getCurrentSnapshotId();

        const balanceBefore = await NeokingdomTokenInternal.balanceOfAt(
          nonContributor.address,
          snapshotIdBefore
        );
        const balanceAfter = await NeokingdomTokenInternal.balanceOfAt(
          nonContributor.address,
          snapshotIdAfter
        );

        expect(balanceBefore).equal(10);
        expect(balanceAfter).equal(6);
      });
    });

    describe("totalSupplyAt", async () => {
      it("should return the totalSupply at the time of the snapshot - mint", async () => {
        await NeokingdomTokenInternal.mint(contributor.address, 10);
        await NeokingdomTokenInternal.snapshot();
        const snapshotIdBefore =
          await NeokingdomTokenInternal.getCurrentSnapshotId();

        await NeokingdomTokenInternal.mint(nonContributor.address, 3);
        await NeokingdomTokenInternal.snapshot();
        const snapshotIdAfter =
          await NeokingdomTokenInternal.getCurrentSnapshotId();

        const balanceBefore = await NeokingdomTokenInternal.totalSupplyAt(
          snapshotIdBefore
        );
        const balanceAfter = await NeokingdomTokenInternal.totalSupplyAt(
          snapshotIdAfter
        );

        expect(balanceBefore).equal(10);
        expect(balanceAfter).equal(13);
      });

      it("should return the totalSupply at the time of the snapshot - transfer", async () => {
        await NeokingdomTokenInternal.mint(nonContributor.address, 10);
        await NeokingdomTokenInternal.snapshot();
        const snapshotIdBefore =
          await NeokingdomTokenInternal.getCurrentSnapshotId();

        await NeokingdomTokenInternal.connect(nonContributor).transfer(
          contributor.address,
          3
        );
        await NeokingdomTokenInternal.snapshot();
        const snapshotIdAfter =
          await NeokingdomTokenInternal.getCurrentSnapshotId();

        const balanceBefore = await NeokingdomTokenInternal.totalSupplyAt(
          snapshotIdBefore
        );
        const balanceAfter = await NeokingdomTokenInternal.totalSupplyAt(
          snapshotIdAfter
        );

        expect(balanceBefore).equal(10);
        expect(balanceAfter).equal(10);
      });

      it("should return the totalSupply at the time of the snapshot - burn", async () => {
        await NeokingdomTokenInternal.mint(nonContributor.address, 10);
        await NeokingdomTokenInternal.snapshot();
        const snapshotIdBefore =
          await NeokingdomTokenInternal.getCurrentSnapshotId();

        await NeokingdomTokenInternal.burn(nonContributor.address, 7);
        await NeokingdomTokenInternal.snapshot();
        const snapshotIdAfter =
          await NeokingdomTokenInternal.getCurrentSnapshotId();

        const balanceBefore = await NeokingdomTokenInternal.totalSupplyAt(
          snapshotIdBefore
        );
        const balanceAfter = await NeokingdomTokenInternal.totalSupplyAt(
          snapshotIdAfter
        );

        expect(balanceBefore).equal(10);
        expect(balanceAfter).equal(3);
      });
    });
  });
});
