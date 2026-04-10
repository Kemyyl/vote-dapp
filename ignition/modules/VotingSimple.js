import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VotingSimpleModule", (m) => {
  const candidateNames = m.getParameter("candidateNames", [
    "Anthony",
    "Abdu",
    "Kemyl",
    "Saf",
  ]);

  const voting = m.contract("VotingSimple", [candidateNames]);

  return { voting };
});
