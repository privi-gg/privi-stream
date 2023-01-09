import { FC, ReactNode } from 'react';
import { default as NextLink, LinkProps } from 'next/link';
import { Link as ChakraLink } from '@chakra-ui/react';

interface ILinkProps extends LinkProps {
  href: string;
  children: ReactNode;
}

const Link: FC<ILinkProps> = ({ href, children, ...props }) => {
  return (
    <NextLink href={href} as={href} passHref {...props}>
      <ChakraLink textDecoration="none">{children}</ChakraLink>
    </NextLink>
  );
};

export default Link;
