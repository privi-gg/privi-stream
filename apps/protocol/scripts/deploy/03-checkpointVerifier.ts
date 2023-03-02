import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  const deploymentName = `${network.name}-checkpointVerifier`;
  await deploy(deploymentName, {
    contract: 'contracts/verifiers/CheckpointVerifier.sol:Verifier',
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

deploy.tags = ['verifier', 'checkpointVerifier'];
export default deploy;
