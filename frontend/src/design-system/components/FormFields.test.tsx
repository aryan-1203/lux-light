import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { Checkbox } from './Checkbox';
import { Input } from './Input';
import { Radio, RadioGroup } from './Radio';
import { Select } from './Select';
import { Switch } from './Switch';
import { Textarea } from './Textarea';

describe('form fields', () => {
  it('Input: visible label, helper and inline error wired with aria', () => {
    renderWithProviders(
      <Input
        label="Pincode"
        helperText="6 digits"
        error="Enter a valid pincode"
        inputMode="numeric"
        required
      />,
    );
    const input = screen.getByLabelText(/pincode/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription('Enter a valid pincode 6 digits');
  });

  it('Input: no aria-invalid without an error', () => {
    renderWithProviders(<Input label="Email" type="email" autoComplete="email" />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });

  it('Textarea and Select are labelled', () => {
    renderWithProviders(
      <>
        <Textarea label="Message" />
        <Select
          label="State"
          placeholder="Select a state"
          options={[
            { value: '27', label: 'Maharashtra' },
            { value: '29', label: 'Karnataka' },
          ]}
        />
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'State' })).toHaveDisplayValue('Select a state');
  });

  it('Checkbox and Switch toggle', async () => {
    const { user } = renderWithProviders(
      <>
        <Checkbox label="Send me WhatsApp updates" />
        <Switch label="Marketing emails" />
      </>,
    );
    const cb = screen.getByRole('checkbox', { name: 'Send me WhatsApp updates' });
    await user.click(screen.getByText('Send me WhatsApp updates'));
    expect(cb).toBeChecked();
    const sw = screen.getByRole('switch', { name: 'Marketing emails' });
    await user.click(sw);
    expect(sw).toBeChecked();
  });

  it('RadioGroup: fieldset legend groups radios with arrow-key support', async () => {
    const { user } = renderWithProviders(
      <RadioGroup legend="Payment method" error="Choose one">
        <Radio name="pm" value="razorpay" label="Pay online" />
        <Radio name="pm" value="cod" label="Cash on delivery" description="₹49 fee" />
      </RadioGroup>,
    );
    const group = screen.getByRole('group', { name: 'Payment method' });
    expect(group).toHaveAttribute('aria-invalid', 'true');
    await user.click(screen.getByRole('radio', { name: 'Pay online' }));
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Cash on delivery' })).toBeChecked();
  });
});
