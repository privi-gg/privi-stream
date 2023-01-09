import { Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton } from '@chakra-ui/react';
import { AccountLogIn, AccountRegister } from 'components/account';

import { useUI } from 'contexts/ui';

const ManagedModal: React.FC = () => {
  const { isModalOpen, closeModal, modalView } = useUI();

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalBody p={0}>
          {modalView === 'ACCOUNT_REGISTER' && <AccountRegister />}
          {modalView === 'ACCOUNT_LOGIN' && <AccountLogIn />}
          {/* {modalView === 'VIEW_2' && <VIEW2 />} */}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ManagedModal;
