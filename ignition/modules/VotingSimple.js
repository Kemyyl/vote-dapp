const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VotingSimpleModule", (m) => {
  const candidateNames = m.getParameter("candidateNames", [
    "Anthony",
    "Abdu",
    "Kemyl",
    "Saf",
  ]);

  const voting = m.contract("VotingSimple", [candidateNames]);

  return { voting };
});
