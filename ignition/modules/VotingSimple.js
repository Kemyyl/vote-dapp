const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VotingSimpleModule", (m) => {
  const candidateNames = m.getParameter("candidateNames", [
    "Alice",
    "Bob",
    "Charlie",
    "Diana",
  ]);

  const voting = m.contract("VotingSimple", [candidateNames]);

  return { voting };
});
