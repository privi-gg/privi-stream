import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import networks from '../../constants/network';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const chainId = await getChainId();
  const tokenAddress = networks[chainId].wrappedNativeCurrency;

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
