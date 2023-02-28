import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const deploymentName = `${network.name}-createVerifier`;
  await deploy(deploymentName, {
    from: deployer,
    contract: 'contracts/verifiers/CreateVerifier.sol:Verifier',
    args: [],
    log: true,
    autoMine: true,
  });
};

deploy.tags = ['verifier', 'createVerifier'];
export default deploy;
