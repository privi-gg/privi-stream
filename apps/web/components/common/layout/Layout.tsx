import { VStack, Box, StackProps, Divider } from '@chakra-ui/react';
import Footer from './Footer';
import Header from './Header';

const Layout: React.FC<StackProps> = ({ children, ...props }) => {
  return (
    <VStack w="full" align={'stretch'} {...props}>
      <Header borderBottomColor="gray.200" borderBottomWidth={1} />

      <Box minH="81vh" flex={1}>
        {children}
      </Box>
      {/* <Footer /> */}
    </VStack>
  );
};

export default Layout;
