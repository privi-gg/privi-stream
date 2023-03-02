import { useEffect } from 'react';
import { useContractWrite, useProvider, useWaitForTransaction } from 'wagmi';
import { BN } from 'privi-utils';
import wTokenGateway from 'abi/wTokenGateway.json';
import logger from 'utils/logger';
import { usePoolContract, useRegistrarContract, useWTokenGatewayContract } from 'hooks/contracts';
import { BigNumberish } from 'ethers';
import { prepareCreateProof } from 'utils/proofs';
import { fetchUserShieldedAccount } from 'utils/pool';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { testWallet1 } from 'config/env';

type CreateStreamArgs = {
  rate: BigNumberish;
  startTime: number;
  stopTime: number;
  receiverAddress: string;
};

type PoolCreateStreamReturnType = ReturnType<typeof useContractWrite> & {
  createStreamAsync: (args: CreateStreamArgs) => Promise<void>;
  testAsync: (args: CreateStreamArgs) => Promise<boolean>;
};

export const usePoolCreateStreamNative = ({
  poolAddress,
}: {
  poolAddress: string;
}): PoolCreateStreamReturnType => {
  const provider = useProvider();
  const wTokenGatewayContract = useWTokenGatewayContract();
  const poolContract = usePoolContract({ poolAddress });
  const registrarContract = useRegistrarContract();
  const { shieldedWallet } = useShieldedAccount();

  const { data, error, writeAsync, ...rest } = useContractWrite({
    mode: 'recklesslyUnprepared',
    address: wTokenGatewayContract.address,
    abi: wTokenGateway.abi,
    functionName: 'create',
    overrides: {
      gasLimit: BN(2_000_000),
    },
  });

  const { data: receipt } = useWaitForTransaction({ hash: data?.hash });

  const generateProof = async ({
    rate,
    startTime,
    stopTime,
    receiverAddress,
  }: CreateStreamArgs) => {
    if (!shieldedWallet) {
      throw new Error('Please login to create stream');
    }

    const receiverSw = await fetchUserShieldedAccount(receiverAddress, registrarContract);
    if (!receiverSw) {
      throw new Error('Recipient shielded account not found');
    }

    const { proofArgs, createData } = await prepareCreateProof({
      rate,
      startTime,
      stopTime,
      from: shieldedWallet,
      to: receiverSw,
    });

    return { proofArgs, createData };
  };

  const validateProof = async (proofArgs: any) => {
    const isValid = await poolContract.verifyCreateProof(proofArgs);
    if (!isValid) {
      throw new Error('Invalid proof');
    }
  };

  const createStreamAsync = async (args: CreateStreamArgs) => {
    const { proofArgs, createData } = await generateProof(args);

    await validateProof(proofArgs);

    const amount = BN(proofArgs.publicAmount);

    await writeAsync?.({
      recklesslySetUnpreparedArgs: [poolAddress, proofArgs, createData],
      recklesslySetUnpreparedOverrides: { value: amount, gasLimit: BN(2_000_000) },
    });
  };

  const testAsync = async (args: CreateStreamArgs) => {
    logger.info(`Simulating create...`);
    if (!testWallet1) {
      throw new Error('No test wallet configured');
    }
    const wallet = testWallet1.connect(provider);

    const { proofArgs, createData } = await generateProof(args);
    await validateProof(proofArgs);

    const amount = BN(proofArgs.publicAmount);
    const contract = wTokenGatewayContract.connect(wallet);

    try {
      const tx = await contract.callStatic.create(poolAddress, proofArgs, createData, {
        value: amount,
        gasLimit: BN(2_000_000),
      });
      logger.info(`Create simulation successful`, tx);
      return true;
    } catch (error) {
      logger.error(`Create simulation failed:`, error);
      return false;
    }
  };

  useEffect(() => {
    if (receipt) logger.info('Tx receipt:', receipt);
  }, [receipt]);

  useEffect(() => {
    if (data) logger.info('Tx:', data);
    if (error) logger.error(`Tx error:`, error);
  }, [data, error]);

  return { data, error, writeAsync, createStreamAsync, testAsync, ...rest };
};
