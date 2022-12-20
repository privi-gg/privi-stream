import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
const genContract = require('xcircomlib/src/poseidon_gencontract.js');

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  const abi = genContract.generateABI(2) as any[];
  const bytecode = genContract.createCode(2) as any;

  await deploy('hasher', {
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
