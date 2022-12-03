import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { KeyPair } from '@tsunami/utils';
import { deployContract } from './helpers/utils';

describe.skip('Registrar', function () {
  async function fixture() {
    const registrar = await deployContract('Registrar');
    return { registrar };
  }

  it('registrar works correctly', async () => {
    const { registrar } = await loadFixture(fixture);
    const [sender] = await ethers.getSigners();

    const [keyPair] = KeyPair.createRandomPairs();
    const shieldedAddress = keyPair.address();

    await expect(registrar.connect(sender).register(shieldedAddress))
      .to.emit(registrar, 'ShieldedAddress')
      .withArgs(sender.address, shieldedAddress);
  });
});
