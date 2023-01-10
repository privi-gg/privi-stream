import { FC, ReactNode } from 'react';
import { default as NextLink } from 'next/link';
import { Link as ChakraLink, LinkProps } from '@chakra-ui/react';

interface ILinkProps extends LinkProps {
  href: string;
  children: ReactNode;
}

const Link: FC<ILinkProps> = ({ href, children, ...props }) => {
  return (
    <NextLink href={href} as={href} passHref>
      <ChakraLink _hover={{ textDecoration: 'none' }} {...props}>
        {children}
      </ChakraLink>
    </NextLink>
  );
};

export default Link;
