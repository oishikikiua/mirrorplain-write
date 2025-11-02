import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { MirrorPlainWrite, MirrorPlainWrite__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  mentor: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("MirrorPlainWrite")) as MirrorPlainWrite__factory;
  const contract = (await factory.deploy()) as MirrorPlainWrite;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("MirrorPlainWrite", function () {
  let signers: Signers;
  let contract: MirrorPlainWrite;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { 
      deployer: ethSigners[0], 
      alice: ethSigners[1], 
      bob: ethSigners[2],
      mentor: ethSigners[3]
    };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This test suite runs only on FHEVM mock environment`);
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  describe("Submit Entry", function () {
    it("should submit encrypted entry and accumulate totals", async function () {
      const wordCount = 500;
      const duration = 1800; // 30 minutes in seconds

      const encryptedWords = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(wordCount)
        .encrypt();

      const encryptedDuration = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(duration)
        .encrypt();

      const timestamp = Math.floor(Date.now() / 1000);

      const tx = await contract
        .connect(signers.alice)
        .submitEntry(
          encryptedWords.handles[0],
          encryptedWords.inputProof,
          encryptedDuration.handles[0],
          encryptedDuration.inputProof,
          timestamp
        );
      
      await tx.wait();

      // Verify entry count
      const entryCount = await contract.getUserEntryCount(signers.alice.address);
      expect(entryCount).to.eq(1);

      // Decrypt and verify totals
      const encryptedTotalWords = await contract.getUserTotalWords(signers.alice.address);
      const decryptedWords = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedTotalWords,
        contractAddress,
        signers.alice
      );
      expect(decryptedWords).to.eq(wordCount);

      const encryptedTotalTime = await contract.getUserTotalTime(signers.alice.address);
      const decryptedTime = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedTotalTime,
        contractAddress,
        signers.alice
      );
      expect(decryptedTime).to.eq(duration);
    });

    it("should accumulate multiple entries correctly", async function () {
      const entries = [
        { words: 300, duration: 600 },
        { words: 450, duration: 900 },
        { words: 200, duration: 400 }
      ];

      for (const entry of entries) {
        const encryptedWords = await fhevm
          .createEncryptedInput(contractAddress, signers.alice.address)
          .add32(entry.words)
          .encrypt();

        const encryptedDuration = await fhevm
          .createEncryptedInput(contractAddress, signers.alice.address)
          .add32(entry.duration)
          .encrypt();

        const tx = await contract
          .connect(signers.alice)
          .submitEntry(
            encryptedWords.handles[0],
            encryptedWords.inputProof,
            encryptedDuration.handles[0],
            encryptedDuration.inputProof,
            Math.floor(Date.now() / 1000)
          );
        
        await tx.wait();
      }

      const entryCount = await contract.getUserEntryCount(signers.alice.address);
      expect(entryCount).to.eq(3);

      const encryptedTotalWords = await contract.getUserTotalWords(signers.alice.address);
      const decryptedWords = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedTotalWords,
        contractAddress,
        signers.alice
      );
      
      const expectedTotal = entries.reduce((sum, e) => sum + e.words, 0);
      expect(decryptedWords).to.eq(expectedTotal);
    });
  });

  describe("Set Goals", function () {
    it("should set weekly and monthly goals", async function () {
      const weeklyGoal = 3500;
      const monthlyGoal = 15000;

      const encryptedWeekly = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(weeklyGoal)
        .encrypt();

      const encryptedMonthly = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(monthlyGoal)
        .encrypt();

      const tx = await contract
        .connect(signers.alice)
        .setGoals(
          encryptedWeekly.handles[0],
          encryptedWeekly.inputProof,
          encryptedMonthly.handles[0],
          encryptedMonthly.inputProof
        );
      
      await tx.wait();

      // Decrypt and verify goals
      const encryptedWeeklyGoal = await contract.getUserWeeklyGoal(signers.alice.address);
      const decryptedWeekly = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedWeeklyGoal,
        contractAddress,
        signers.alice
      );
      expect(decryptedWeekly).to.eq(weeklyGoal);

      const encryptedMonthlyGoal = await contract.getUserMonthlyGoal(signers.alice.address);
      const decryptedMonthly = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedMonthlyGoal,
        contractAddress,
        signers.alice
      );
      expect(decryptedMonthly).to.eq(monthlyGoal);
    });
  });

  describe("Check Milestone", function () {
    it("should return encrypted boolean for milestone comparison", async function () {
      // Submit entry with 1000 words
      const wordCount = 1000;
      const encryptedWords = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(wordCount)
        .encrypt();

      const encryptedDuration = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(600)
        .encrypt();

      await contract
        .connect(signers.alice)
        .submitEntry(
          encryptedWords.handles[0],
          encryptedWords.inputProof,
          encryptedDuration.handles[0],
          encryptedDuration.inputProof,
          Math.floor(Date.now() / 1000)
        );

      // Check if total words > 500 (should be true)
      const threshold = 500;
      const encryptedThreshold = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(threshold)
        .encrypt();

      const tx = await contract
        .connect(signers.alice)
        .checkMilestone(
          1,
          encryptedThreshold.handles[0],
          encryptedThreshold.inputProof
        );

      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });
  });

  describe("Mentor Authorization", function () {
    it("should authorize mentor and allow access to aggregated data", async function () {
      // Alice submits entry
      const wordCount = 800;
      const encryptedWords = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(wordCount)
        .encrypt();

      const encryptedDuration = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(1200)
        .encrypt();

      await contract
        .connect(signers.alice)
        .submitEntry(
          encryptedWords.handles[0],
          encryptedWords.inputProof,
          encryptedDuration.handles[0],
          encryptedDuration.inputProof,
          Math.floor(Date.now() / 1000)
        );

      // Alice authorizes mentor
      const tx = await contract
        .connect(signers.alice)
        .allowMentor(signers.mentor.address);
      
      await tx.wait();

      // Verify authorization
      const isAuthorized = await contract.isMentorAuthorized(
        signers.alice.address,
        signers.mentor.address
      );
      expect(isAuthorized).to.be.true;

      // Mentor should be able to decrypt alice's totals
      const encryptedTotalWords = await contract.getUserTotalWords(signers.alice.address);
      const decryptedWords = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedTotalWords,
        contractAddress,
        signers.mentor  // Mentor can decrypt due to FHE.allow
      );
      expect(decryptedWords).to.eq(wordCount);
    });

    it("should revoke mentor access", async function () {
      // First submit an entry to initialize encrypted values
      const wordCount = 150;
      const duration = 900; // 15 minutes
      const timestamp = Math.floor(Date.now() / 1000);

      const encryptedWords = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(wordCount)
        .encrypt();
      const encryptedDuration = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(duration)
        .encrypt();

      await contract
        .connect(signers.alice)
        .submitEntry(
          encryptedWords.handles[0],
          encryptedWords.inputProof,
          encryptedDuration.handles[0],
          encryptedDuration.inputProof,
          timestamp
        );

      // Now authorize then revoke
      await contract.connect(signers.alice).allowMentor(signers.mentor.address);
      
      const tx = await contract.connect(signers.alice).revokeAccess(signers.mentor.address);
      await tx.wait();

      const isAuthorized = await contract.isMentorAuthorized(
        signers.alice.address,
        signers.mentor.address
      );
      expect(isAuthorized).to.be.false;
    });

    it("should reject self-authorization", async function () {
      await expect(
        contract.connect(signers.alice).allowMentor(signers.alice.address)
      ).to.be.revertedWith("Cannot authorize self");
    });

    it("should reject zero address authorization", async function () {
      await expect(
        contract.connect(signers.alice).allowMentor(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid mentor address");
    });
  });

  describe("View Functions", function () {
    it("should retrieve individual entry data", async function () {
      const wordCount = 600;
      const duration = 900;
      const timestamp = Math.floor(Date.now() / 1000);

      const encryptedWords = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(wordCount)
        .encrypt();

      const encryptedDuration = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(duration)
        .encrypt();

      await contract
        .connect(signers.alice)
        .submitEntry(
          encryptedWords.handles[0],
          encryptedWords.inputProof,
          encryptedDuration.handles[0],
          encryptedDuration.inputProof,
          timestamp
        );

      const [words, dur, ts] = await contract.getUserEntry(signers.alice.address, 0);
      
      expect(ts).to.eq(timestamp);

      // Decrypt entry data
      const decryptedWords = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        words,
        contractAddress,
        signers.alice
      );
      expect(decryptedWords).to.eq(wordCount);

      const decryptedDuration = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        dur,
        contractAddress,
        signers.alice
      );
      expect(decryptedDuration).to.eq(duration);
    });
  });
});

