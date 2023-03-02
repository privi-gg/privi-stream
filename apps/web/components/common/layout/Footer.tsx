import { Icon, StackProps, HStack, Text, Link } from '@chakra-ui/react';
import { ArrowUpRightIcon, TwitterIcon } from 'components/icons';
import { socialLinks } from 'config/constants';

const Footer: React.FC<StackProps> = ({ ...props }) => {
  return (
    <HStack as="footer" p={4} w="100%" justify="space-between" alignItems="center" {...props}>
      <HStack color="gray.500">
        <Link href={socialLinks.about} target="_blank">
          About Us
        </Link>
        <Text>·</Text>
        <Link href={socialLinks.docs} target="_blank">
          <HStack>
            <Text>Documentation</Text>
            <ArrowUpRightIcon />
          </HStack>
        </Link>
      </HStack>
      <Link href={socialLinks.twitter} target="_blank">
        <Icon as={TwitterIcon} color="gray.500" boxSize={6} />
      </Link>
    </HStack>
  );
};

export default Footer;
