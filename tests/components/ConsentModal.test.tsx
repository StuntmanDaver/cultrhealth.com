import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConsentModal } from '@/components/compliance/ConsentModal';

// Mock IntersectionObserver as a proper class
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  root = null;
  rootMargin = '';
  thresholds: number[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    mockObserve();
  }
  observe() { mockObserve(); }
  disconnect() { mockDisconnect(); }
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

describe('ConsentModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConsent: vi.fn(),
    tierSlug: 'core',
  };

  it('renders when isOpen is true', () => {
    render(<ConsentModal {...defaultProps} />);
    expect(
      screen.getByText('Informed Consent for Telehealth Services')
    ).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ConsentModal {...defaultProps} isOpen={false} />);
    expect(
      screen.queryByText('Informed Consent for Telehealth Services')
    ).not.toBeInTheDocument();
  });

  it('renders all consent sections', () => {
    render(<ConsentModal {...defaultProps} />);
    expect(screen.getByText('Nature of Services')).toBeInTheDocument();
    expect(screen.getByText('Compounded Medications')).toBeInTheDocument();
    expect(screen.getByText('Risks & Benefits')).toBeInTheDocument();
    expect(screen.getByText('Prescription Requirements')).toBeInTheDocument();
    expect(screen.getByText('No Guarantee of Results')).toBeInTheDocument();
    expect(screen.getByText('Refund & Cancellation')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Emergency')).toBeInTheDocument();
  });

  it('has button disabled initially', () => {
    render(<ConsentModal {...defaultProps} />);
    const button = screen.getByRole('button', {
      name: 'I Agree & Continue to Payment',
    });
    expect(button).toBeDisabled();
  });

  it('has checkbox disabled until user scrolls to bottom', () => {
    render(<ConsentModal {...defaultProps} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<ConsentModal {...defaultProps} onClose={onClose} />);
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<ConsentModal {...defaultProps} onClose={onClose} />);
    // The backdrop is the first div inside the outer container
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows FDA status section for tiers with therapies', () => {
    render(<ConsentModal {...defaultProps} tierSlug="core" />);
    expect(
      screen.getByText('FDA Status of Selected Therapies')
    ).toBeInTheDocument();
  });

  it('does not show FDA status section for club tier', () => {
    render(<ConsentModal {...defaultProps} tierSlug="club" />);
    expect(
      screen.queryByText('FDA Status of Selected Therapies')
    ).not.toBeInTheDocument();
  });
});
