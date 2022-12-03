import { FC, useEffect, useState } from 'react';
import { Utxo } from '@tsunami/utils';
import {
  Box,
  CircularProgress,
  CircularProgressLabel,
  Heading,
  StackProps,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';
import { formatEther } from 'utils/eth';
import dayjs from 'dayjs';
import { useProvider } from 'wagmi';

interface IStreamDetailsProps extends StackProps {
  utxo: Utxo;
}

const RevokeStreamDetail: FC<IStreamDetailsProps> = ({ utxo, ...props }) => {
  const [withdrawAmt, setWithdrawAmt] = useState('0');
  const [progress, setProgress] = useState(0);
  const provider = useProvider();

  useEffect(() => {
    if (!utxo) return;

    provider
      .getBlock('latest')
      .then((b) => b.timestamp)
      .then((currentTime) => {
        const newStopTime = currentTime + 4 * 60;
        if (newStopTime >= utxo.stopTime) {
          setWithdrawAmt('0');
        } else {
          const amt = utxo.rate.mul(utxo.stopTime - newStopTime);
          const amtEth = formatEther(amt);
          setWithdrawAmt(amtEth);
        }

        if (currentTime >= utxo.stopTime) {
          setProgress(100);
        } else {
          const progress = Math.ceil(
            ((currentTime - utxo.startTime) * 100) / (utxo.stopTime - utxo.startTime),
          );
          setProgress(progress);
        }
      });
  }, [utxo, provider]);

  const amount = formatEther(utxo.amount || 0);
  const rate = formatEther(utxo.rate || 0);
  const startTime = dayjs(utxo.startTime * 1000).format('DD MMM hh:mm A');
  const stopTime = dayjs(utxo.stopTime * 1000).format('DD MMM hh:mm A');
  const lastWithdrawTime =
    utxo.startTime === utxo.checkpointTime
      ? '-'
      : dayjs(utxo.checkpointTime * 1000).format('DD MMM hh:mm A');

  return (
    <VStack {...props}>
      <CircularProgress value={progress} color="green.400" size="140px" thickness="16px">
        <CircularProgressLabel>
          <VStack spacing={0}>
            <Text fontSize="xl">{progress}%</Text>
            <Text fontSize="sm">Streamed</Text>
          </VStack>
        </CircularProgressLabel>
      </CircularProgress>
      <Heading fontSize="xl">Stream Details</Heading>
      <TableContainer>
        <Table variant="unstyled">
          <Tbody>
            <Tr>
              <Td>Total Stream Amount</Td>
              <Td>{amount} ETH</Td>
            </Tr>
            <Tr>
              <Td>Start Time</Td>
              <Td>{startTime}</Td>
            </Tr>
            <Tr>
              <Td>Stop Time</Td>
              <Td>{stopTime}</Td>
            </Tr>
            <Tr>
              <Td>Last Withdraw Time</Td>
              <Td>{lastWithdrawTime}</Td>
            </Tr>
            <Tr>
              <Td>Rate</Td>
              <Td>{rate} ETH/sec</Td>
            </Tr>
          </Tbody>
        </Table>
      </TableContainer>
      <Box>
        You can withdraw:
        <Text fontWeight="bold" color="green.500">
          {withdrawAmt} ETH
        </Text>
        from this stream
      </Box>
    </VStack>
  );
};

export default RevokeStreamDetail;
