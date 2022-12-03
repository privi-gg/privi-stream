import { Box, Center, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { Layout } from 'components/common/layout';
import { CreateStream, RevokeStream, WithdrawStream } from 'components/stream';
import Script from 'next/script';
import logger from 'utils/logger';

export default function Home() {
  return (
    <Layout>
      <Script src="js/snarkjs.min.js" onLoad={() => logger.info('SnarkJs Loaded!')} />

      <Box>
        <Tabs isFitted>
          <TabList>
            <Tab>Create</Tab>
            <Tab>Withdraw</Tab>
            <Tab>Revoke</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Center>
                <CreateStream maxW={600} />
              </Center>
            </TabPanel>
            <TabPanel>
              <Center>
                <WithdrawStream maxW={600} />
              </Center>
            </TabPanel>
            <TabPanel>
              <Center>
                <RevokeStream maxW={600} />
              </Center>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Layout>
  );
}
