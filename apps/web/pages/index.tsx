import {
  Box,
  Button,
  Center,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
} from '@chakra-ui/react';
import { Layout } from 'components/common/layout';
import { ROUTES } from 'config/constants';
import { useRouter } from 'next/router';
import Script from 'next/script';
import logger from 'utils/logger';

export default function Home() {
  const router = useRouter();
  return (
    <Layout>
      <Script src="js/snarkjs.min.js" onLoad={() => logger.info('SnarkJs Loaded!')} />
      <VStack alignItems="stretch" spacing={8} w="sm" mx="auto" my={24}>
        <Button onClick={() => router.push(ROUTES.CREATE)}>Create Stream</Button>
        <Button onClick={() => router.push(ROUTES.WITHDRAW)}>Withdraw Stream</Button>
        <Button onClick={() => router.push(ROUTES.REVOKE)}>Revoke Stream</Button>
      </VStack>
    </Layout>
  );
}
