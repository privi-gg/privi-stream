import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy('registrar', {
    contract: 'Registrar',
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

deploy.tags = ['tsunami'];
export default deploy;
