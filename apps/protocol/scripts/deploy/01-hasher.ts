import { poseidonArtifact } from 'privi-utils';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  const abi = poseidonArtifact.abi;
  const bytecode = poseidonArtifact.bytecode as string;

  const deploymentName = `${network.name}-hasher`;
  await deploy(deploymentName, {
    from: deployer,
    contract: {
      abi,
      bytecode,
    },
    log: true,
    autoMine: true,
  });
};

deploy.tags = ['hasher'];
export default deploy;
