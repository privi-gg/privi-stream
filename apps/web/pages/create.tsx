import { Box, Center, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { Layout } from 'components/common/layout';
import { CreateStream } from 'components/stream';
import Script from 'next/script';
import logger from 'utils/logger';

export default function Create() {
  return (
    <Layout>
      <Script src="js/snarkjs.min.js" onLoad={() => logger.info('SnarkJs Loaded!')} />
      <Center my={16}>
        <CreateStream maxW={600} />
      </Center>
    </Layout>
  );
}
