import { Center } from '@chakra-ui/react';
import { Layout } from 'components/common/layout';
import { RevokeStream } from 'components/stream';
import Script from 'next/script';
import logger from 'utils/logger';

export default function Revoke() {
  return (
    <Layout>
      <Script src="js/snarkjs.min.js" onLoad={() => logger.info('SnarkJs Loaded!')} />
      <Center my={16}>
        <RevokeStream maxW={1400} />
      </Center>
    </Layout>
  );
}
