import { ethers, upgrades } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { networks } from '../config';
import { constants } from 'ethers';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId, network } = hre;
  const { deployer } = await getNamedAccounts();
  const deployerSigner = (await ethers.getSigners()).find((s) => s.address === deployer);
  if (!deployerSigner) {
    throw new Error('No deployer signer found');
  }
  const chainId = await getChainId();

  const allDeployments = await deployments.all();
  const hasher = allDeployments[`${network.name}-hasher`].address;
  const createVerifier = allDeployments[`${network.name}-createVerifier`].address;
  const checkpointVerifier = allDeployments[`${network.name}-checkpointVerifier`].address;
  //@todo Get token from cmd line
  const token = networks[chainId].wrappedNativeToken;
  const deploymentName = `${network.name}-${token}-poolProxy`;

  const tokenAddress = networks[chainId].tokens[token].address;
  const numStreamLevels = networks[chainId].tokens[token].numStreamTreeLevels;
  const numCheckpointTreeLevels = networks[chainId].tokens[token].numCheckpointTreeLevels;
  const sanctionsList = networks[chainId].sanctionsList;

  //@todo check possibility to skip
  const PoolImplFactory = await ethers.getContractFactory('Pool', deployerSigner);
  const pool = await upgrades.deployProxy(
    PoolImplFactory,
    [numStreamLevels, numCheckpointTreeLevels],
    {
      kind: 'uups',
      constructorArgs: [tokenAddress, hasher, sanctionsList, createVerifier, checkpointVerifier],
      unsafeAllow: ['constructor', 'state-variable-immutable'],
    },
  );
  deployments.log(`deploying "${deploymentName}" (tx: ${pool.deployTransaction.hash})...: `);
  await pool.deployed();
  const poolImplArtifact = await deployments.getExtendedArtifact('Pool');

  deployments.log(`deployed at ${pool.address}`);
  await deployments.save(deploymentName, {
    abi: poolImplArtifact.abi,
    address: pool.address,
  });
};

deploy.tags = ['pool'];
deploy.dependencies = ['hasher', 'verifier'];
export default deploy;
