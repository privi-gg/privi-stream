import { FC } from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';
import { useSignMessage } from 'wagmi';
import { SIGN_MESSAGE } from 'config/constants';
import { useUI } from 'contexts/ui';

const SetUpAccountButton: FC<ButtonProps> = ({ ...props }) => {
  const { setModalViewAndOpen, setModalData } = useUI();
  const { isError, isLoading, signMessageAsync } = useSignMessage({ message: SIGN_MESSAGE });

  const handleSetUp = async () => {
    const signature = await signMessageAsync();
    setModalData({ signature });
    setModalViewAndOpen('ACCOUNT_REGISTER');
  };

  return (
    <Button onClick={handleSetUp} disabled={isLoading} colorScheme="gray" {...props}>
      Set up Account
    </Button>
  );
};

export default SetUpAccountButton;
