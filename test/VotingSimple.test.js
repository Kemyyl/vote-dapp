const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("VotingSimple", function () {
  const CANDIDATE_NAMES = ["Alice", "Bob", "Charlie"];

  async function deployFixture() {
    const [owner, voter1, voter2, voter3, nonVoter] = await ethers.getSigners();
    const VotingSimple = await ethers.getContractFactory("VotingSimple");
    const voting = await VotingSimple.deploy(CANDIDATE_NAMES);
    return { voting, owner, voter1, voter2, voter3, nonVoter };
  }

  // Helper : déploie + inscrit voter1 & voter2 + ouvre le vote
  async function deployAndOpenFixture() {
    const { voting, owner, voter1, voter2, voter3, nonVoter } = await loadFixture(deployFixture);
    await voting.addVoter(voter1.address);
    await voting.addVoter(voter2.address);
    await voting.startVoting();
    return { voting, owner, voter1, voter2, voter3, nonVoter };
  }

  // ─── Déploiement ───────────────────────────────────────────────────────────

  describe("Déploiement", function () {
    it("Test 1 : initialise correctement les candidats", async function () {
      const { voting } = await loadFixture(deployFixture);
      expect(await voting.getCandidateCount()).to.equal(3);
      for (let i = 0; i < 3; i++) {
        const [name, voteCount] = await voting.getCandidate(i);
        expect(name).to.equal(CANDIDATE_NAMES[i]);
        expect(voteCount).to.equal(0);
      }
    });

    it("Test 1 : définit le bon owner", async function () {
      const { voting, owner } = await loadFixture(deployFixture);
      expect(await voting.owner()).to.equal(owner.address);
    });
  });

  // ─── Gestion des électeurs ─────────────────────────────────────────────────

  describe("Gestion des électeurs", function () {
    it("Test 2 : l'admin peut ajouter un électeur", async function () {
      const { voting, voter1 } = await loadFixture(deployFixture);
      await expect(voting.addVoter(voter1.address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(voter1.address);
      expect(await voting.registeredVoters(voter1.address)).to.be.true;
    });

    it("Test 3 : un non-admin ne peut PAS ajouter d'électeur", async function () {
      const { voting, voter1, voter2 } = await loadFixture(deployFixture);
      await expect(voting.connect(voter1).addVoter(voter2.address)).to.be.revertedWith(
        "Not the owner"
      );
    });

    it("Test 4 : impossible d'ajouter deux fois le même électeur", async function () {
      const { voting, voter1 } = await loadFixture(deployFixture);
      await voting.addVoter(voter1.address);
      await expect(voting.addVoter(voter1.address)).to.be.revertedWith("Already registered");
    });
  });

  // ─── Ouverture du vote ─────────────────────────────────────────────────────

  describe("Ouverture du vote", function () {
    it("Test 5 : l'admin peut ouvrir le vote", async function () {
      const { voting } = await loadFixture(deployFixture);
      await expect(voting.startVoting()).to.emit(voting, "VotingStarted");
      expect(await voting.votingOpen()).to.be.true;
    });

    it("Test 6 : un non-admin ne peut PAS ouvrir le vote", async function () {
      const { voting, voter1 } = await loadFixture(deployFixture);
      await expect(voting.connect(voter1).startVoting()).to.be.revertedWith("Not the owner");
    });
  });

  // ─── Vote ──────────────────────────────────────────────────────────────────

  describe("Vote", function () {
    it("Test 7 : un électeur autorisé peut voter", async function () {
      const { voting, voter1 } = await loadFixture(deployAndOpenFixture);
      await expect(voting.connect(voter1).vote(0))
        .to.emit(voting, "VoteCast")
        .withArgs(voter1.address, 0);
      const [, voteCount] = await voting.getCandidate(0);
      expect(voteCount).to.equal(1);
      expect(await voting.hasVoted(voter1.address)).to.be.true;
    });

    it("Test 8 : un électeur ne peut voter qu'une seule fois", async function () {
      const { voting, voter1 } = await loadFixture(deployAndOpenFixture);
      await voting.connect(voter1).vote(0);
      await expect(voting.connect(voter1).vote(0)).to.be.revertedWith("Already voted");
    });

    it("Test 9 : un non-électeur ne peut PAS voter", async function () {
      const { voting, nonVoter } = await loadFixture(deployAndOpenFixture);
      await expect(voting.connect(nonVoter).vote(0)).to.be.revertedWith(
        "Not a registered voter"
      );
    });

    it("Test 10 : impossible de voter si le vote est fermé", async function () {
      const { voting, voter1 } = await loadFixture(deployFixture);
      await voting.addVoter(voter1.address);
      // Vote pas encore ouvert
      await expect(voting.connect(voter1).vote(0)).to.be.revertedWith("Voting is not open");
    });

    it("Test 11 : impossible de voter pour un candidat inexistant", async function () {
      const { voting, voter1 } = await loadFixture(deployAndOpenFixture);
      await expect(voting.connect(voter1).vote(99)).to.be.revertedWith("Invalid candidate");
    });
  });

  // ─── Résultats ─────────────────────────────────────────────────────────────

  describe("Résultats", function () {
    it("Test 12 : getWinner retourne le bon candidat", async function () {
      const { voting, voter1, voter2, voter3 } = await loadFixture(deployFixture);
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
      await voting.addVoter(voter3.address);
      await voting.startVoting();

      await voting.connect(voter1).vote(1); // Bob
      await voting.connect(voter2).vote(1); // Bob
      await voting.connect(voter3).vote(0); // Alice

      const [winnerIndex, winnerName, winnerVotes] = await voting.getWinner();
      expect(winnerIndex).to.equal(1);
      expect(winnerName).to.equal("Bob");
      expect(winnerVotes).to.equal(2);
    });

    it("Test 13 : en cas d'égalité, retourne le premier candidat", async function () {
      const { voting, voter1, voter2 } = await loadFixture(deployFixture);
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
      await voting.startVoting();

      await voting.connect(voter1).vote(0); // Alice
      await voting.connect(voter2).vote(1); // Bob (égalité)

      // En cas d'égalité, le premier candidat (index 0) doit gagner
      const [winnerIndex] = await voting.getWinner();
      expect(winnerIndex).to.equal(0);
    });
  });
});
