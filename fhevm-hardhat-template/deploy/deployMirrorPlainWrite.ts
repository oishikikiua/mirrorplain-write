import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedMirrorPlainWrite = await deploy("MirrorPlainWrite", {
    from: deployer,
    log: true,
  });

  console.log(`MirrorPlainWrite contract: `, deployedMirrorPlainWrite.address);
};

export default func;
func.id = "deploy_mirrorPlainWrite";
func.tags = ["MirrorPlainWrite"];

