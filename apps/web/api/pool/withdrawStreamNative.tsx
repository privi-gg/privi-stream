import { useEffect } from 'react';
import { useContractWrite, useProvider, useWaitForTransaction } from 'wagmi';
import { BN } from 'privi-utils';
import wTokenGateway from 'abi/wTokenGateway.json';
import logger from 'utils/logger';
import { usePoolContract, useWTokenGatewayContract } from 'hooks/contracts';
import { prepareWithdrawProof } from 'utils/proofs';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { testWallet1 } from 'config/env';
import { Stream } from '@privi-stream/common';

type WithdrawStreamArgs = {
  stream: Stream;
  outCheckpointTime: number;
  currentTime: number;
  recipient: string;
};

type PoolWithdrawStreamReturnType = ReturnType<typeof useContractWrite> & {
  withdrawStreamAsync: (args: WithdrawStreamArgs) => Promise<void>;
  testAsync: (args: WithdrawStreamArgs) => Promise<boolean>;
};

export const usePoolWithdrawStreamNative = ({
  poolAddress,
}: {
  poolAddress: string;
}): PoolWithdrawStreamReturnType => {
  const provider = useProvider();
  const wTokenGatewayContract = useWTokenGatewayContract();
  const poolContract = usePoolContract({ poolAddress });
  const { shieldedWallet } = useShieldedAccount();

  const { data, error, writeAsync, ...rest } = useContractWrite({
    mode: 'recklesslyUnprepared',
    address: wTokenGatewayContract.address,
    abi: wTokenGateway.abi,
    functionName: 'withdraw',
    overrides: {
      gasLimit: BN(2_000_000),
    },
  });

  const { data: receipt } = useWaitForTransaction({ hash: data?.hash });

  const generateProof = async ({ stream, outCheckpointTime, currentTime }: WithdrawStreamArgs) => {
    if (!shieldedWallet) {
      throw new Error('Please login to create stream');
    }

    const { proofArgs, extData } = await prepareWithdrawProof({
      pool: poolContract,
      stream,
      outCheckpointTime,
      currentTime,
      shieldedWallet,
      recipient: wTokenGatewayContract.address,
    });

    return { proofArgs, extData };
  };

  const validateProof = async (proofArgs: any) => {
    const isValid = await poolContract.verifyWithdrawProof(proofArgs);
    if (!isValid) {
      throw new Error('Invalid proof');
    }
  };

  const withdrawStreamAsync = async (args: WithdrawStreamArgs) => {
    const { proofArgs, extData } = await generateProof(args);
    await validateProof(proofArgs);

    await writeAsync?.({
      recklesslySetUnpreparedArgs: [poolAddress, args.recipient, proofArgs, extData],
      recklesslySetUnpreparedOverrides: { gasLimit: BN(2_000_000) },
    });
  };

  const testAsync = async (args: WithdrawStreamArgs) => {
    logger.info(`Simulating withdraw...`);
    if (!testWallet1) {
      throw new Error('No test wallet configured');
    }

    const wallet = testWallet1.connect(provider);
    const { proofArgs, extData } = await generateProof(args);
    await validateProof(proofArgs);
    const contract = wTokenGatewayContract.connect(wallet);

    try {
      const tx = await contract.callStatic.withdraw(
        poolAddress,
        args.recipient,
        proofArgs,
        extData,
        { gasLimit: BN(2_000_000) },
      );
      logger.info(`withdraw simulation successful`, tx);
      return true;
    } catch (error) {
      logger.error(`withdraw simulation failed:`, error);
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

  return { data, error, writeAsync, withdrawStreamAsync, testAsync, ...rest };
};
