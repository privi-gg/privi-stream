import { useEffect } from 'react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import tsunami from 'abi/tsunami.json';
import wTokenGateway from 'abi/wTokenGateway.json';
import logger from 'utils/logger';
import { BigNumber } from 'ethers';
import useInstance from 'hooks/instance';

export const useWithdrawStream = () => {
  const { wTokenGatewayAddress } = useInstance();
  const txRes = useContractWrite({
    mode: 'recklesslyUnprepared',
    address: wTokenGatewayAddress,
    abi: wTokenGateway.abi,
    functionName: 'withdraw',
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
// export const useWithdrawStream = () => {
//   const { instance } = useInstance();
//   const txRes = useContractWrite({
//     mode: 'recklesslyUnprepared',
//     address: instance.instanceAddress,
//     abi: tsunami.abi,
//     functionName: 'withdraw',
//     overrides: {
//       gasLimit: BigNumber.from(2_000_000),
//     },
//   });

//   const { data: receipt } = useWaitForTransaction({ hash: txRes.data?.hash });

//   useEffect(() => {
//     if (receipt) logger.info('Tx receipt:', receipt);
//   }, [receipt]);

//   useEffect(() => {
//     if (txRes.data) logger.info('Tx:', txRes.data);
//     if (txRes.error) logger.error(`Tx error:`, txRes.error);
//   }, [txRes.data, txRes.error]);

//   return txRes;
// };
