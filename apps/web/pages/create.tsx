import { Center } from '@chakra-ui/react';
import { Layout } from 'components/common/layout';
import { CreateStreamNative } from 'components/stream';
import Script from 'next/script';
import logger from 'utils/logger';

export default function Create() {
  return (
    <Layout>
      <Script src="js/snarkjs.min.js" onLoad={() => logger.info('SnarkJs Loaded!')} />
      <Center mt={4}>
        <CreateStreamNative maxW={600} />
      </Center>
    </Layout>
  );
}
