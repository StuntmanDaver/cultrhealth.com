import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloridaStateGate } from '@/components/compliance/FloridaStateGate';

describe('FloridaStateGate', () => {
  it('renders the state dropdown and Continue button', () => {
    render(<FloridaStateGate onPass={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('calls onPass when Florida is selected and Continue is clicked', () => {
    const onPass = vi.fn();
    render(<FloridaStateGate onPass={onPass} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'FL' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onPass).toHaveBeenCalledOnce();
  });

  it('does NOT call onPass for a non-Florida state', () => {
    const onPass = vi.fn();
    render(<FloridaStateGate onPass={onPass} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'TX' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onPass).not.toHaveBeenCalled();
  });

  it('shows blocked message after selecting a non-Florida state and clicking Continue', () => {
    render(<FloridaStateGate onPass={vi.fn()} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'CA' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText(/currently available only in Florida/i)).toBeInTheDocument();
  });

  it('Continue button is disabled when no state selected', () => {
    render(<FloridaStateGate onPass={vi.fn()} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });
});
