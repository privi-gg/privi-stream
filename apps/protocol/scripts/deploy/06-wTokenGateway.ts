import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { networks } from '../config';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const chainId = await getChainId();
  //@todo Get token from cmd line
  const token = networks[chainId].wrappedNativeToken;
  const deploymentName = `${network.name}-wTokenGateway`;
  const tokenAddress = networks[chainId].tokens[token].address;

  await deploy(deploymentName, {
    contract: 'WTokenGateway',
    from: deployer,
    args: [tokenAddress],
    log: true,
    autoMine: true,
  });
};

deploy.tags = ['wTokenGateway'];
export default deploy;
