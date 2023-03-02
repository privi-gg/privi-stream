import { ModalProps } from '@chakra-ui/react';
import React, {
  useReducer,
  useMemo,
  useContext,
  createContext,
  FC,
  PropsWithChildren,
} from 'react';

type ModalConfig = Partial<ModalProps>;

interface State {
  modalView: string;
  isModalOpen: boolean;
  modalData: any;
  modalConfig: {};
}

export const modalViews = {
  ACCOUNT_REGISTER: 'ACCOUNT_REGISTER',
  ACCOUNT_LOGIN: 'ACCOUNT_LOGIN',
};

type ModalView = keyof typeof modalViews;

type Action =
  | {
      type: 'SET_MODAL_VIEW';
      view: ModalView;
    }
  | {
      type: 'OPEN_MODAL';
    }
  | {
      type: 'CLOSE_MODAL';
    }
  | {
      type: 'SET_MODAL_DATA';
      data: any;
    }
  | {
      type: 'SET_MODAL_CONFIG';
      config: ModalConfig;
    };

const initialState: State = {
  modalView: '',
  isModalOpen: false,
  modalData: null,
  modalConfig: {},
};

export const UIContext = createContext<State | any>(initialState);
UIContext.displayName = 'UIContext';

const uiReducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'SET_MODAL_VIEW':
      return { ...state, modalView: action.view };
    case 'OPEN_MODAL':
      return { ...state, isModalOpen: true };
    case 'CLOSE_MODAL':
      return { ...state, isModalOpen: false };
    case 'SET_MODAL_DATA':
      return { ...state, modalData: action.data };
    case 'SET_MODAL_CONFIG':
      return { ...state, modalConfig: action.config };
    default:
      return state;
  }
};

export const UIProvider: FC<PropsWithChildren> = (props) => {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  const openModal = () => dispatch({ type: 'OPEN_MODAL' });
  const closeModal = () => dispatch({ type: 'CLOSE_MODAL' });
  const setModalView = (view: ModalView) => dispatch({ type: 'SET_MODAL_VIEW', view });
  const setModalData = (data: any) => {
    dispatch({ type: 'SET_MODAL_DATA', data });
  };
  const setModalConfig = (config: ModalConfig) => {
    dispatch({ type: 'SET_MODAL_CONFIG', config });
  };
  const setModalViewAndOpen = (view: ModalView) => {
    setModalView(view);
    openModal();
  };

  const value = useMemo(
    () => ({
      ...state,
      openModal,
      closeModal,
      setModalView,
      setModalData,
      setModalConfig,
      setModalViewAndOpen,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state],
  );

  return <UIContext.Provider value={value} {...props} />;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error(`useUI must be used within a UIProvider`);
  }
  return context;
};
