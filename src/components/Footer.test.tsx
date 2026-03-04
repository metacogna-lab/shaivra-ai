import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Footer from './Footer';
import { APP_NAME } from '../constants';

describe('Footer component', () => {
  it('renders the marketing copy and app name', () => {
    render(<Footer onNavigate={() => {}} />);
    expect(screen.getByText(APP_NAME)).toBeInTheDocument();
    expect(screen.getByText(/Boutique private intelligence/i)).toBeInTheDocument();
  });

  it('invokes navigation callback when CTA is clicked', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Footer onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: /Mission & Values/i }));
    expect(onNavigate).toHaveBeenCalledWith('mission');

    await user.click(screen.getByText(APP_NAME));
    expect(onNavigate).toHaveBeenCalledWith('landing');
  });
});
