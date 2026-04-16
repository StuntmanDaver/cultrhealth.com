import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloridaStateGate } from '@/components/compliance/FloridaStateGate';
import { SERVED_STATES } from '@/lib/config/compliance';

describe('FloridaStateGate', () => {
  it('renders the location prompt and state dropdown', () => {
    render(<FloridaStateGate onPass={vi.fn()} />);
    expect(screen.getByText('Where are you located?')).toBeInTheDocument();
    expect(screen.getByText(/30 U\.S\. states/)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('Continue button is disabled when no state is selected', () => {
    render(<FloridaStateGate onPass={vi.fn()} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('calls onPass when Florida (FL) is selected', () => {
    const onPass = vi.fn();
    render(<FloridaStateGate onPass={onPass} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'FL' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onPass).toHaveBeenCalledOnce();
  });

  it('calls onPass when Texas (TX) is selected — now a served state', () => {
    const onPass = vi.fn();
    render(<FloridaStateGate onPass={onPass} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'TX' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onPass).toHaveBeenCalledOnce();
  });

  it('calls onPass when New York (NY) is selected', () => {
    const onPass = vi.fn();
    render(<FloridaStateGate onPass={onPass} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'NY' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onPass).toHaveBeenCalledOnce();
  });

  it('calls onPass when Washington D.C. (DC) is selected', () => {
    const onPass = vi.fn();
    render(<FloridaStateGate onPass={onPass} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'DC' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onPass).toHaveBeenCalledOnce();
  });

  it('does NOT call onPass for California (CA) — not served and not shippable', () => {
    const onPass = vi.fn();
    render(<FloridaStateGate onPass={onPass} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'CA' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onPass).not.toHaveBeenCalled();
  });

  it('does NOT call onPass for Alabama (AL) — not a served state', () => {
    const onPass = vi.fn();
    render(<FloridaStateGate onPass={onPass} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'AL' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onPass).not.toHaveBeenCalled();
  });

  it('shows "Not available in your state yet" when a non-served state is selected', () => {
    render(<FloridaStateGate onPass={vi.fn()} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'CA' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText('Not available in your state yet')).toBeInTheDocument();
  });

  it('shows expansion message when blocked', () => {
    render(<FloridaStateGate onPass={vi.fn()} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'OH' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText(/actively expanding/i)).toBeInTheDocument();
  });

  it('SERVED_STATES contains exactly 30 jurisdictions', () => {
    expect(SERVED_STATES).toHaveLength(30);
  });

  it('SERVED_STATES includes all expected key states', () => {
    const served = SERVED_STATES as readonly string[];
    expect(served).toContain('FL');
    expect(served).toContain('TX');
    expect(served).toContain('NY');
    expect(served).toContain('DC');
    expect(served).toContain('AZ');
    expect(served).toContain('CO');
  });

  it('SERVED_STATES does not include California', () => {
    expect(SERVED_STATES as readonly string[]).not.toContain('CA');
  });
});
