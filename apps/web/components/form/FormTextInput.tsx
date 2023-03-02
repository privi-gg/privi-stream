import { FC } from 'react';
import { path } from 'ramda';
import {
  FormControl,
  FormControlProps,
  InputProps,
  Input,
  FormLabel,
  FormErrorMessage,
  HStack,
  Box,
  Tooltip,
} from '@chakra-ui/react';
import { Control, useController } from 'react-hook-form';
import { InfoIcon } from 'components/icons';

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

const FormTextInput: FC<FormInputProps> = ({
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
  const { field, formState } = useController({ name, control, defaultValue });
  const error = path(['errors', ...parseErrorKeys(name), 'message'], formState) as string;

  return (
    <FormControl
      p={0}
      isRequired={isRequired}
      isInvalid={!!error}
      rounded="md"
      borderWidth={1}
      borderColor="gray.100"
      bgColor="gray.50"
      {...props}
    >
      <HStack alignItems="center" spacing={0} pt={2} px={4}>
        <FormLabel fontWeight="semibold">{label}</FormLabel>
        {helperText && (
          <Tooltip hasArrow label={helperText}>
            <Box pb={2}>
              <InfoIcon color="gray" />
            </Box>
          </Tooltip>
        )}
      </HStack>

      <Box bgColor="white" alignItems="center" rounded="md" px={4} py={2}>
        <Input
          variant="unstyled"
          fontWeight="bold"
          fontSize="md"
          size="lg"
          type={type}
          onBlur={field.onBlur}
          placeholder={placeholder}
          onChange={(val: any) => field.onChange(val)}
          value={field.value}
          {..._input}
        />
      </Box>
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  );
};

export default FormTextInput;
