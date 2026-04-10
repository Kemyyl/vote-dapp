const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("VotingSimple", function () {
  const CANDIDATE_NAMES = ["Anthony", "Abdu", "Kemyl", "Saf"];

  async function deployFixture() {
    const [owner, voter1, voter2, voter3, nonVoter] = await ethers.getSigners();
    const VotingSimple = await ethers.getContractFactory("VotingSimple");
    const voting = await VotingSimple.deploy(CANDIDATE_NAMES);
    return { voting, owner, voter1, voter2, voter3, nonVoter };
  }

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
      expect(await voting.getCandidateCount()).to.equal(CANDIDATE_NAMES.length);
      for (let i = 0; i < CANDIDATE_NAMES.length; i++) {
        const [name, , , voteCount] = await voting.getCandidate(i);
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

  // ─── Fermeture du vote ────────────────────────────────────────────────────

  describe("Fermeture du vote", function () {
    it("Test 5b : l'admin peut fermer le vote", async function () {
      const { voting } = await loadFixture(deployFixture);
      await voting.startVoting();
      await expect(voting.stopVoting()).to.emit(voting, "VotingStopped");
      expect(await voting.votingOpen()).to.be.false;
    });

    it("Test 5c : un non-admin ne peut PAS fermer le vote", async function () {
      const { voting, voter1 } = await loadFixture(deployFixture);
      await voting.startVoting();
      await expect(voting.connect(voter1).stopVoting()).to.be.revertedWith("Not the owner");
    });

    it("Test 5d : impossible de fermer un vote déjà fermé", async function () {
      const { voting } = await loadFixture(deployFixture);
      await expect(voting.stopVoting()).to.be.revertedWith("Voting is not open");
    });

    it("Test 5e : impossible de voter après fermeture du vote", async function () {
      const { voting, voter1 } = await loadFixture(deployAndOpenFixture);
      await voting.stopVoting();
      await expect(voting.connect(voter1).vote(0)).to.be.revertedWith("Voting is not open");
    });
  });

  // ─── Vote ──────────────────────────────────────────────────────────────────

  describe("Vote", function () {
    it("Test 7 : un électeur autorisé peut voter", async function () {
      const { voting, voter1 } = await loadFixture(deployAndOpenFixture);
      await expect(voting.connect(voter1).vote(0))
        .to.emit(voting, "VoteCast")
        .withArgs(voter1.address, 0);
      const [, , , voteCount] = await voting.getCandidate(0);
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


  // ─── Demande d'inscription ────────────────────────────────────────────────

  describe("Demande d'inscription", function () {
    it("Un utilisateur peut demander à être inscrit", async function () {
      const { voting, nonVoter } = await loadFixture(deployFixture);
      await expect(voting.connect(nonVoter).requestRegistration())
        .to.emit(voting, "VoterRegistrationRequested")
        .withArgs(nonVoter.address);
      expect(await voting.registrationRequested(nonVoter.address)).to.be.true;
    });

    it("Impossible de demander deux fois", async function () {
      const { voting, nonVoter } = await loadFixture(deployFixture);
      await voting.connect(nonVoter).requestRegistration();
      await expect(voting.connect(nonVoter).requestRegistration()).to.be.revertedWith(
        "Already requested"
      );
    });

    it("Impossible de demander si déjà inscrit", async function () {
      const { voting, voter1 } = await loadFixture(deployFixture);
      await voting.addVoter(voter1.address);
      await expect(voting.connect(voter1).requestRegistration()).to.be.revertedWith(
        "Already registered"
      );
    });

    it("Impossible de demander quand le vote est ouvert", async function () {
      const { voting, nonVoter } = await loadFixture(deployFixture);
      await voting.startVoting();
      await expect(voting.connect(nonVoter).requestRegistration()).to.be.revertedWith(
        "Registration is closed"
      );
    });
  });

  // ─── Candidature ──────────────────────────────────────────────────────────

  describe("Candidature (validation admin requise)", function () {
    it("Un utilisateur peut soumettre une candidature (en attente)", async function () {
      const { voting, nonVoter } = await loadFixture(deployFixture);
      await expect(voting.connect(nonVoter).registerAsCandidate("Jean", "Mon programme"))
        .to.emit(voting, "CandidateApplicationSubmitted")
        .withArgs(nonVoter.address, "Jean");
      // Pas encore dans la liste officielle
      expect(await voting.getCandidateCount()).to.equal(CANDIDATE_NAMES.length);
      // Bien marqué comme en attente
      const info = await voting.pendingCandidateInfo(nonVoter.address);
      expect(info.exists).to.be.true;
    });

    it("L'admin peut approuver une candidature", async function () {
      const { voting, nonVoter } = await loadFixture(deployFixture);
      await voting.connect(nonVoter).registerAsCandidate("Jean", "Mon programme");
      await expect(voting.approveCandidate(nonVoter.address))
        .to.emit(voting, "CandidateApproved")
        .withArgs(nonVoter.address, "Jean");
      expect(await voting.getCandidateCount()).to.equal(CANDIDATE_NAMES.length + 1);
    });

    it("L'admin peut rejeter une candidature", async function () {
      const { voting, nonVoter } = await loadFixture(deployFixture);
      await voting.connect(nonVoter).registerAsCandidate("Jean", "");
      await expect(voting.rejectCandidate(nonVoter.address))
        .to.emit(voting, "CandidateRejected")
        .withArgs(nonVoter.address);
      expect(await voting.getCandidateCount()).to.equal(CANDIDATE_NAMES.length);
      const info = await voting.pendingCandidateInfo(nonVoter.address);
      expect(info.exists).to.be.false;
    });

    it("Impossible de soumettre deux candidatures", async function () {
      const { voting, nonVoter } = await loadFixture(deployFixture);
      await voting.connect(nonVoter).registerAsCandidate("Jean", "");
      await expect(voting.connect(nonVoter).registerAsCandidate("Jean Dupont", ""))
        .to.be.revertedWith("Application already submitted");
    });

    it("Le nom ne peut pas être vide", async function () {
      const { voting, nonVoter } = await loadFixture(deployFixture);
      await expect(voting.connect(nonVoter).registerAsCandidate("", ""))
        .to.be.revertedWith("Name required");
    });

    it("Impossible de se présenter quand le vote est ouvert", async function () {
      const { voting, nonVoter } = await loadFixture(deployFixture);
      await voting.startVoting();
      await expect(voting.connect(nonVoter).registerAsCandidate("Jean", ""))
        .to.be.revertedWith("Registration is closed");
    });

    it("La description est bien enregistrée après approbation", async function () {
      const { voting, nonVoter } = await loadFixture(deployFixture);
      await voting.connect(nonVoter).registerAsCandidate("Jean", "Mon programme détaillé");
      await voting.approveCandidate(nonVoter.address);
      const idx = CANDIDATE_NAMES.length;
      const [name, description] = await voting.getCandidate(idx);
      expect(name).to.equal("Jean");
      expect(description).to.equal("Mon programme détaillé");
    });

    it("L'admin peut supprimer un candidat validé", async function () {
      const { voting, nonVoter } = await loadFixture(deployFixture);
      await voting.connect(nonVoter).registerAsCandidate("Jean", "");
      await voting.approveCandidate(nonVoter.address);
      const countBefore = Number(await voting.getCandidateCount());
      await expect(voting.removeCandidate(CANDIDATE_NAMES.length))
        .to.emit(voting, "CandidateRemoved");
      expect(await voting.getCandidateCount()).to.equal(countBefore - 1);
    });

    it("Impossible de supprimer un candidat quand le vote est ouvert", async function () {
      const { voting } = await loadFixture(deployFixture);
      await voting.startVoting();
      await expect(voting.removeCandidate(0)).to.be.revertedWith("Registration is closed");
    });

    it("getPendingCandidates retourne la liste complète", async function () {
      const { voting, voter3, nonVoter } = await loadFixture(deployFixture);
      await voting.connect(voter3).registerAsCandidate("Alice", "");
      await voting.connect(nonVoter).registerAsCandidate("Bob", "");
      const [addrs, names] = await voting.getPendingCandidates();
      expect(addrs.length).to.equal(2);
      expect(names[0]).to.equal("Alice");
      expect(names[1]).to.equal("Bob");
    });
  });

  // ─── Phases ───────────────────────────────────────────────────────────────

  describe("Phases (WorkflowStatus)", function () {
    it("La phase initiale est RegisteringVoters (0)", async function () {
      const { voting } = await loadFixture(deployFixture);
      expect(await voting.workflowStatus()).to.equal(0);
    });

    it("startVoting passe en phase VotingSessionStarted (1)", async function () {
      const { voting } = await loadFixture(deployFixture);
      await voting.startVoting();
      expect(await voting.workflowStatus()).to.equal(1);
    });

    it("stopVoting passe en phase VotingSessionEnded (2)", async function () {
      const { voting } = await loadFixture(deployFixture);
      await voting.startVoting();
      await voting.stopVoting();
      expect(await voting.workflowStatus()).to.equal(2);
    });

    it("Impossible d'ajouter un électeur hors phase d'inscription", async function () {
      const { voting, voter1 } = await loadFixture(deployFixture);
      await voting.startVoting();
      await expect(voting.addVoter(voter1.address)).to.be.revertedWith(
        "Registration is closed"
      );
    });
  });

  describe("Résultats", function () {
    it("Test 12 : getWinner retourne le bon candidat", async function () {
      const { voting, voter1, voter2, voter3 } = await loadFixture(deployFixture);
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
      await voting.addVoter(voter3.address);
      await voting.startVoting();

      await voting.connect(voter1).vote(1); 
      await voting.connect(voter2).vote(1); 
      await voting.connect(voter3).vote(0); 

      const [winnerIndex, winnerName, winnerVotes] = await voting.getWinner();
      expect(winnerIndex).to.equal(1);
      expect(winnerName).to.equal("Abdu");
      expect(winnerVotes).to.equal(2);
    });

    it("Test 13 : en cas d'égalité, retourne le premier candidat", async function () {
      const { voting, voter1, voter2 } = await loadFixture(deployFixture);
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
      await voting.startVoting();

      await voting.connect(voter1).vote(0); 
      await voting.connect(voter2).vote(1); 

      // En cas d'égalité, le premier candidat (index 0) doit gagner
      const [winnerIndex] = await voting.getWinner();
      expect(winnerIndex).to.equal(0);
    });
  });
});
