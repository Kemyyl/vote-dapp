# Vote DApp — TP Final Blockchain

Application de vote décentralisée (DApp) développée avec Solidity, Hardhat et React + ethers.js.

## Présentation

Une association souhaite organiser un vote électronique transparent et infalsifiable. Cette DApp garantit :

- La transparence totale du processus
- L'impossibilité de voter deux fois
- Un résultat vérifiable par tous
- La traçabilité de chaque action via les events blockchain

---

## Architecture du projet

```
vote-dapp/
├── contracts/
│   └── VotingSimple.sol          # Smart contract Solidity
├── test/
│   └── VotingSimple.test.js      # Suite de 49 tests Hardhat (ESM)
├── ignition/
│   └── modules/
│       └── VotingSimple.js       # Module de déploiement Hardhat Ignition
├── frontend/
│   └── src/
│       ├── App.jsx               # Composant principal
│       ├── hooks/
│       │   └── useVoting.js      # Hook custom ethers.js
│       ├── components/
│       │   ├── ConnectWallet.jsx # Connexion MetaMask (avec message si absent)
│       │   ├── StatusBanner.jsx  # Statut du vote
│       │   ├── AdminPanel.jsx    # Panel administrateur
│       │   ├── VoterPanel.jsx    # Panel électeur
│       │   └── ResultsPanel.jsx  # Résultats en temps réel
│       └── constants/
│           └── contract.js       # ABI et adresse du contrat
├── hardhat.config.js             # Config Hardhat (ESM)
├── package.json                  # type: module (ESM)
└── .env                          # SEPOLIA_RPC_URL + PRIVATE_KEY (non versionné)
```

---

## Smart Contract

**Fichier :** `contracts/VotingSimple.sol`

### Phases (WorkflowStatus)

| Valeur | Nom | Description |
|---|---|---|
| `0` | `RegisteringVoters` | Inscriptions ouvertes |
| `1` | `VotingSessionStarted` | Vote en cours |
| `2` | `VotingSessionEnded` | Vote terminé |

### Variables d'état

| Variable | Type | Rôle |
|---|---|---|
| `owner` | `address` | Adresse de l'administrateur |
| `workflowStatus` | `WorkflowStatus` | Phase actuelle |
| `candidates` | `Candidate[]` | Candidats validés |
| `registeredVoters` | `mapping(address => bool)` | Électeurs autorisés |
| `hasVoted` | `mapping(address => bool)` | Électeurs ayant déjà voté |
| `registrationRequested` | `mapping(address => bool)` | Demandes d'inscription |
| `registrationRequestList` | `address[]` | Liste des demandes en attente |
| `pendingCandidateInfo` | `mapping(address => PendingCandidateInfo)` | Candidatures en attente |

### Modifiers

- `onlyOwner` — réservé à l'administrateur
- `onlyVoter` — réservé aux électeurs inscrits

### Events

- `VoterRegistered(address indexed voter)`
- `VoterRegistrationRequested(address indexed voter)`
- `VoterRegistrationRejected(address indexed voter)`
- `CandidateApplicationSubmitted(address indexed candidateAddress, string name)`
- `CandidateApproved(address indexed candidateAddress, string name)`
- `CandidateRejected(address indexed candidateAddress)`
- `CandidateRemoved(uint256 indexed candidateIndex, string name)`
- `WorkflowStatusChanged(uint8 previousStatus, uint8 newStatus)`
- `VotingStarted()`
- `VotingStopped()`
- `VoteCast(address indexed voter, uint256 indexed candidateIndex)`

### Fonctions

| Fonction | Accès | Description |
|---|---|---|
| `addVoter(address)` | Admin | Enregistre un électeur manuellement |
| `approveAllRegistrations()` | Admin | Approuve toutes les demandes en attente en une seule transaction |
| `rejectRegistration(address)` | Admin | Rejette une demande d'inscription |
| `approveCandidate(address)` | Admin | Valide une candidature en attente |
| `rejectCandidate(address)` | Admin | Rejette une candidature |
| `removeCandidate(uint256)` | Admin | Supprime un candidat validé (phase inscription) |
| `startVoting()` | Admin | Ouvre le vote (phase 0 → 1) |
| `stopVoting()` | Admin | Ferme le vote (phase 1 → 2) |
| `reopenRegistration()` | Admin | Revient en phase d'inscription (1 ou 2 → 0) |
| `requestRegistration()` | Public | Soumet une demande d'inscription |
| `registerAsCandidate(string, string)` | Public | Soumet une candidature (nom, description) |
| `vote(uint256)` | Électeur inscrit | Vote pour un candidat |
| `getCandidateCount()` | Public | Nombre de candidats validés |
| `getCandidate(uint256)` | Public | Détails d'un candidat |
| `getPendingCandidates()` | Public | Liste des candidatures en attente |
| `getRegistrationRequests()` | Public | Liste des demandes d'inscription en attente |
| `getWinner()` | Public | Candidat gagnant |
| `votingOpen()` | Public | Retourne `true` si le vote est en cours |

---

## Tests

**49 tests** organisés en 8 groupes :

| Groupe | Nb tests |
|---|---|
| Déploiement | 2 |
| Gestion des électeurs | 3 |
| Ouverture du vote | 2 |
| Fermeture du vote | 4 |
| Vote | 5 |
| Demande d'inscription | 4 |
| Candidature (validation admin) | 10 |
| Phases (WorkflowStatus) | 4 |
| Approbation en masse | 6 |
| Réouverture des inscriptions | 7 |
| Résultats | 2 |

Les tests utilisent la syntaxe **ESM** (`import`) avec Hardhat + Chai.

---

## Installation et lancement

### Prérequis

- Node.js >= 18
- MetaMask installé dans le navigateur

### 1. Installer les dépendances

```bash
npm install
cd frontend && npm install
```

### 2. Lancer les tests

```bash
npx hardhat test
```

### 3. Déployer sur Sepolia

Créer un fichier `.env` à la racine :

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/VOTRE_CLE
PRIVATE_KEY=votre_cle_privee
```

```bash
npx hardhat ignition deploy ignition/modules/VotingSimple.js --network sepolia
```

Copier l'adresse retournée dans `frontend/src/constants/contract.js`.

### 4. Lancer le frontend

```bash
cd frontend
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

---

## Utilisation

### En tant qu'administrateur (compte déployeur)

1. Se connecter avec MetaMask (badge **ADMIN** visible)
2. Approuver les demandes d'inscription une par une ou toutes en même temps
3. Valider / rejeter les candidatures
4. Ouvrir le vote
5. Fermer le vote
6. Revenir en phase d'inscription si besoin

### En tant qu'électeur

1. Se connecter avec MetaMask
2. Soumettre une demande d'inscription (phase inscription)
3. Se présenter comme candidat (phase inscription)
4. Voter pour un candidat une fois le vote ouvert

### En tant que visiteur

- Voir la liste des candidats et les résultats en temps réel
- Ne peut pas voter

---

## Ressources

- [Solidity Documentation](https://docs.soliditylang.org)
- [Hardhat Documentation](https://hardhat.org/docs)
- [ethers.js Documentation](https://docs.ethers.org)
- [React Documentation](https://react.dev)
- [Sepolia Faucet](https://sepoliafaucet.com)
- [Etherscan Sepolia](https://sepolia.etherscan.io)
