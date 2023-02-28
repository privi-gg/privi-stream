import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { networks } from '../config';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const chainId = await getChainId();
  const token = networks[chainId].wrappedNativeToken;
  const tokenAddress = networks[chainId].tokens[token].address;

  await deploy('wTokenGateway', {
    contract: 'WTokenGateway',
    from: deployer,
    args: [tokenAddress],
    log: true,
    autoMine: true,
  });
};

deploy.tags = ['wTokenGateway'];
export default deploy;
