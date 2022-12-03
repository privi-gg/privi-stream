import { FC } from 'react';
import { Button, FormControl, FormControlProps, FormLabel } from '@chakra-ui/react';
import { Control, Controller } from 'react-hook-form';
//@ts-ignore
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CustomDateInput = ({ value, onClick }: any) => (
  <Button variant="solid" onClick={onClick}>
    {value || '--/--/-- --:--'}
  </Button>
);

CustomDateInput.displayName = 'CustomDateInput';

interface FormDatePickerProps extends FormControlProps {
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
  _datePicker?: DatePicker;
}

const FormDatePicker: FC<FormDatePickerProps> = ({
  label,
  control,
  name,
  defaultValue,
  _datePicker,
  ...restProps
}) => {
  return (
    <FormControl w="sm" maxW="100%" {...restProps}>
      <FormLabel htmlFor={name} fontWeight="semibold">
        {label}
      </FormLabel>
      <Controller
        control={control}
        name={name}
        defaultValue={defaultValue}
        render={({ field }) => (
          <DatePicker
            placeholderText={label}
            onChange={(date: any) => field.onChange(date)}
            selected={field.value || defaultValue}
            dateFormat="dd MMMM yyyy hh:mm"
            customInput={<CustomDateInput />}
            showYearDropdown
            showTimeInput
            {..._datePicker}
          />
        )}
      />
    </FormControl>
  );
};

export default FormDatePicker;
