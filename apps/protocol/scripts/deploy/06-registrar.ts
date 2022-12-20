import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;

  const { address: hasherAddress } = await get('hasher');
  const { address: createVerifierAddress } = await get('hasher');
  const { address: withdrawVerifierAddress } = await get('hasher');
  const { address: revokeVerifierAddress } = await get('hasher');

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
