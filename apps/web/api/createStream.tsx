import { useEffect } from 'react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import tsunami from 'abi/tsunami.json';
import logger from 'utils/logger';
import { BigNumber } from 'ethers';
import { tsunamiAddress } from 'config/network';

export const useCreateStream = () => {
  const txRes = useContractWrite({
    mode: 'recklesslyUnprepared',
    address: tsunamiAddress,
    abi: tsunami.abi,
    functionName: 'create',
    overrides: {
      gasLimit: BigNumber.from(2_000_000),
    },
  });

  const { data: receipt } = useWaitForTransaction({ hash: txRes.data?.hash });

  useEffect(() => {
    if (receipt) logger.info('Tx receipt:', receipt);
  }, [receipt]);

  useEffect(() => {
    if (txRes.data) logger.info('Tx:', txRes.data);
    if (txRes.error) logger.error(`Tx error:`, txRes.error);
  }, [txRes.data, txRes.error]);

  return txRes;
};
