import { screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Drawer } from './Drawer';

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Confirm cancellation"
        description="This can't be undone."
      >
        <Button>Inside</Button>
      </Dialog>
    </>
  );
}

function DrawerHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer open={open} onOpenChange={setOpen} title="Menu">
        <a href="/shop">Shop</a>
      </Drawer>
    </>
  );
}

describe('Dialog', () => {
  it('traps focus, closes on Escape and returns focus to the trigger', async () => {
    const { user } = renderWithProviders(<DialogHarness />);
    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Confirm cancellation' });
    expect(dialog).toHaveAccessibleDescription("This can't be undone.");
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});

describe('Drawer', () => {
  it('opens as a modal dialog with a close button', async () => {
    const { user } = renderWithProviders(<DrawerHarness />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));
    const drawer = await screen.findByRole('dialog', { name: 'Menu' });
    expect(drawer).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Open drawer' })).toHaveFocus();
  });
});
