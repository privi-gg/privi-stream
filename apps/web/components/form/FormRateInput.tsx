import { FC } from 'react';
import { path } from 'ramda';
import {
  FormControl,
  FormControlProps,
  InputProps,
  Input,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  HStack,
  Text,
  VStack,
  Card,
  Avatar,
} from '@chakra-ui/react';
import { Control, useController } from 'react-hook-form';
import { BalanceText } from 'components/account';
import { TokenPriceText } from 'components/common';
import { parseEther } from 'utils/eth';
import useInstance from 'hooks/instance';

interface FormInputProps extends FormControlProps {
  name: string;
  label?: string;
  defaultValue?: string | number;
  helperText?: string;
  errorMessage?: string;
  placeholder?: string;
  type?: string;
  isRequired?: boolean;
  isInvalid?: boolean;
  control: Control<any>;
  _input?: InputProps;
}

const parseErrorKeys = (name: string): Array<string> => {
  return name.split('.');
};

const FormRateInput: FC<FormInputProps> = ({
  name,
  label,
  control,
  placeholder,
  type = 'text',
  defaultValue = '',
  helperText,
  isRequired,
  isInvalid,
  _input,
  ...props
}) => {
  const { instance } = useInstance();
  const { field, formState } = useController({ name, control, defaultValue });
  const error = path(['errors', ...parseErrorKeys(name), 'message'], formState) as string;

  return (
    <FormControl
      p={0}
      isRequired={isRequired}
      isInvalid={!!error}
      rounded="md"
      borderWidth={1}
      borderColor="white"
      bgColor="gray.50"
      {...props}
    >
      <HStack justify="space-between" alignItems="center" pt={2} px={4}>
        <FormLabel fontWeight="semibold">{label}</FormLabel>
        <BalanceText label="Balance: " />
      </HStack>

      <HStack
        bgColor="white"
        justify="space-between"
        alignItems="center"
        rounded="md"
        px={4}
        py={4}
      >
        <VStack alignItems="flex-start" spacing={0}>
          <Input
            variant="unstyled"
            fontWeight="bold"
            fontSize="2xl"
            size="lg"
            type={type}
            onBlur={field.onBlur}
            placeholder={placeholder}
            onChange={(val: any) => field.onChange(val)}
            value={field.value}
            {..._input}
          />
          <FormHelperText display="flex" flexDirection="row" fontSize="sm" color="gray.500">
            <TokenPriceText amount={parseEther(`${field.value}`)} />
            <Text ml={1}>/ second</Text>
          </FormHelperText>
        </VStack>

        <Card
          display="flex"
          rounded="3xl"
          flexDirection="row"
          justify="space-between"
          alignItems="center"
          alignSelf="center"
          px={2}
          py={2}
        >
          <Avatar src={instance.iconUrl} size="xs" />
          <Text fontWeight="bold" ml={1}>
            {instance.currency}
          </Text>
        </Card>
      </HStack>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  );
};

export default FormRateInput;
