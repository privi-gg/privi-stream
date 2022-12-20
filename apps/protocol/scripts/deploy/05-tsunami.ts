import { ethers } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import networks from '../../constants/network';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deployer } = await getNamedAccounts();

  const { hasher, createVerifier, withdrawVerifier, revokeVerifier } = await deployments.all();

  const numLevels = 20;
  const maxDepositAmount = ethers.utils.parseEther('1');
  const chainId = await getChainId();
  const tokenAddress = networks[chainId].wrappedNativeCurrency;

  await deployments.deploy('tsunami', {
    contract: 'Tsunami',
    from: deployer,
    args: [
      numLevels,
      maxDepositAmount,
      tokenAddress,
      hasher.address,
      createVerifier.address,
      withdrawVerifier.address,
      revokeVerifier.address,
    ],
    log: true,
    autoMine: true,
  });
};

deploy.tags = ['tsunami'];
deploy.dependencies = ['hasher', 'verifier'];
export default deploy;
