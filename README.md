# Vote DApp — TP Bonus Blockchain

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
│   └── VotingSimple.test.js      # Suite de 18 tests Hardhat
├── ignition/
│   └── modules/
│       └── VotingSimple.js       # Module de déploiement Hardhat Ignition
├── frontend/
│   └── src/
│       ├── App.jsx               # Composant principal
│       ├── hooks/
│       │   └── useVoting.js      # Hook custom ethers.js
│       ├── components/
│       │   ├── ConnectWallet.jsx # Connexion MetaMask
│       │   ├── StatusBanner.jsx  # Statut du vote
│       │   ├── AdminPanel.jsx    # Panel administrateur
│       │   ├── VoterPanel.jsx    # Panel électeur
│       │   └── ResultsPanel.jsx  # Résultats en temps réel
│       └── constants/
│           └── contract.js       # ABI et adresse du contrat
├── hardhat.config.js
└── .env                          # SEPOLIA_RPC_URL + PRIVATE_KEY (non versionné)
```

---

## Smart Contract

**Fichier :** `contracts/VotingSimple.sol`

### Variables d'état

| Variable | Type | Rôle |
|---|---|---|
| `owner` | `address` | Adresse de l'administrateur |
| `votingOpen` | `bool` | État du vote (ouvert/fermé) |
| `candidates` | `Candidate[]` | Liste des candidats |
| `registeredVoters` | `mapping(address => bool)` | Électeurs autorisés |
| `hasVoted` | `mapping(address => bool)` | Électeurs ayant déjà voté |

### Modifiers

- `onlyOwner` — réservé à l'administrateur
- `onlyVoter` — réservé aux électeurs inscrits
- `votingIsOpen` — nécessite que le vote soit ouvert

### Events

- `VoterRegistered(address indexed voter)`
- `VotingStarted()`
- `VotingStopped()`
- `VoteCast(address indexed voter, uint256 indexed candidateIndex)`

### Fonctions

| Fonction | Accès | Description |
|---|---|---|
| `addVoter(address)` | Admin | Enregistre un électeur |
| `startVoting()` | Admin | Ouvre le vote |
| `stopVoting()` | Admin | Ferme le vote |
| `vote(uint256)` | Électeur inscrit | Vote pour un candidat |
| `getCandidateCount()` | Public | Nombre de candidats |
| `getCandidate(uint256)` | Public | Nom et votes d'un candidat |
| `getWinner()` | Public | Candidat gagnant |

---

## Tests

**18 tests** couvrant tous les cas requis par le TP :

| # | Scénario |
|---|---|
| 1 | Déploiement — candidats initialisés à 0 vote, owner correct |
| 2 | L'admin peut ajouter un électeur + event émis |
| 3 | Un non-admin ne peut PAS ajouter d'électeur |
| 4 | Impossible d'ajouter deux fois le même électeur |
| 5 | L'admin peut ouvrir le vote + event émis |
| 5b | L'admin peut fermer le vote + event émis |
| 5c | Un non-admin ne peut PAS fermer le vote |
| 5d | Impossible de fermer un vote déjà fermé |
| 5e | Impossible de voter après fermeture du vote |
| 6 | Un non-admin ne peut PAS ouvrir le vote |
| 7 | Un électeur autorisé peut voter — compteur incrémenté, event émis |
| 8 | Un électeur ne peut voter qu'une seule fois |
| 9 | Un non-électeur ne peut PAS voter |
| 10 | Impossible de voter si le vote est fermé |
| 11 | Impossible de voter pour un candidat inexistant |
| 12 | `getWinner` retourne le bon candidat |
| 13 | En cas d'égalité, retourne le premier candidat (index 0) |

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

### 3. Déployer en local (réseau Hardhat)

```bash
npx hardhat node
npx hardhat ignition deploy ignition/modules/VotingSimple.js --network localhost
```

### 4. Déployer sur Sepolia

Créer un fichier `.env` à la racine :

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/VOTRE_CLE
PRIVATE_KEY=votre_cle_privee
```

```bash
npx hardhat ignition deploy ignition/modules/VotingSimple.js --network sepolia
```

Copier l'adresse du contrat déployé dans `frontend/src/constants/contract.js`.

### 5. Lancer le frontend

```bash
cd frontend
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

---

## Utilisation

### En tant qu'administrateur (compte déployeur)

1. Se connecter avec MetaMask (badge **ADMIN** visible)
2. Ajouter des électeurs via le panel admin (entrer une adresse Ethereum)
3. Ouvrir le vote
4. Fermer le vote quand souhaité

### En tant qu'électeur inscrit

1. Se connecter avec MetaMask
2. Vérifier son statut d'électeur inscrit
3. Voter pour un candidat (si le vote est ouvert)

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
