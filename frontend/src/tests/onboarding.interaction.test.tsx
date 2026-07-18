import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { api, ApiError } from '../lib/api';

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual('../lib/api');
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

describe('Questionnaire Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupOnboarding = async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ id: 'user1', email: 'test@example.com' }); // Auth
    vi.mocked(api.get).mockRejectedValueOnce(new ApiError('Not Found', 404)); // Profile 404
    
    window.history.pushState({}, 'Test', '/onboarding');
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Let's understand your skin/i)).toBeInTheDocument();
    });
  };

  it('fourth concern is rejected with feedback, but can still be deselected', async () => {
    await setupOnboarding();
    
    // Select 3 concerns
    fireEvent.click(screen.getByLabelText(/^Breakouts$/i));
    fireEvent.click(screen.getByLabelText(/Post-acne marks/i));
    fireEvent.click(screen.getByLabelText(/Uneven tone/i));
    
    // Try to select 4th
    fireEvent.click(screen.getByLabelText(/Redness/i));
    
    expect(screen.getByText(/Maximum 3 selections allowed/i)).toBeInTheDocument();
    
    // Deselect one
    fireEvent.click(screen.getByLabelText(/^Breakouts$/i));
    
    // Now 4th can be selected
    fireEvent.click(screen.getByLabelText(/Redness/i));
    expect(screen.queryByText(/Maximum 3 selections allowed/i)).not.toBeInTheDocument();
  });

  it('step validation prevents progression when required answers are missing', async () => {
    await setupOnboarding();
    
    // Try to click continue without answering
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    
    expect(screen.getByText(/Please answer all required single-choice questions./i)).toBeInTheDocument();
    
    // Still on step 1
    expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument();
  });

  it('none exclusivity logic works', async () => {
    await setupOnboarding();
    
    // Answer step 1 to proceed to step 2
    fireEvent.click(screen.getByLabelText(/^Oily$/i)); // ^ $ because labels must match exactly
    fireEvent.click(screen.getByLabelText(/^Breakouts$/i));
    fireEvent.click(screen.getByLabelText(/^Simpler routine$/i));
    fireEvent.click(screen.getByLabelText(/^Low$/i));
    
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Your current routine/i)).toBeInTheDocument();
    });

    // Select some actives
    fireEvent.click(screen.getByLabelText(/Vitamin C/i));
    fireEvent.click(screen.getByLabelText(/Niacinamide/i));
    
    // Select None
    const noneRadios = screen.getAllByLabelText(/^None$/i); // There are multiple 'None' labels (routine, actives)
    // The second one is actives (index 1)
    fireEvent.click(noneRadios[1]);

    // Checking None should clear Vitamin C and Niacinamide visually (their checkboxes should be unchecked)
    expect(screen.getByLabelText(/Vitamin C/i)).not.toBeChecked();
    expect(screen.getByLabelText(/Niacinamide/i)).not.toBeChecked();
    expect(noneRadios[1]).toBeChecked();

    // Selecting a specific value removes None
    fireEvent.click(screen.getByLabelText(/Vitamin C/i));
    expect(screen.getByLabelText(/Vitamin C/i)).toBeChecked();
    expect(noneRadios[1]).not.toBeChecked();
  });

  it('other_known displays note input, requires it, and clears it when deselected', async () => {
    await setupOnboarding();
    
    // Rush to Step 3
    fireEvent.click(screen.getByLabelText(/^Oily$/i));
    fireEvent.click(screen.getByLabelText(/^Breakouts$/i));
    fireEvent.click(screen.getByLabelText(/^Simpler routine$/i));
    fireEvent.click(screen.getByLabelText(/^Low$/i));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    
    await waitFor(() => expect(screen.getByText(/Your current routine/i)).toBeInTheDocument());
    fireEvent.click(screen.getAllByLabelText(/^None$/i)[0]); // Routine products
    fireEvent.click(screen.getAllByLabelText(/^None$/i)[1]); // Actives
    fireEvent.click(screen.getByLabelText(/^Daily$/i));
    fireEvent.click(screen.getByLabelText(/^Beginner$/i));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    
    await waitFor(() => expect(screen.getByText(/Important context/i)).toBeInTheDocument());
    
    // Step 3
    fireEvent.click(screen.getByLabelText(/^No$/i)); // clinician
    const otherKnownLabel = screen.getAllByLabelText(/Other known reaction/i)[0]; // Reacts
    fireEvent.click(otherKnownLabel);
    
    // Note input should appear
    expect(screen.getByLabelText(/Please specify the other reaction/i)).toBeInTheDocument();
    
    // Try submitting without note
    fireEvent.click(screen.getAllByLabelText(/^None$/i)[1]); // avoid categories
    fireEvent.click(screen.getByRole('button', { name: /Complete Profile/i }));
    
    expect(screen.getByText('Please specify the other reaction.')).toBeInTheDocument();
    
    // Deselect other_known
    fireEvent.click(otherKnownLabel);
    
    // Note input disappears
    expect(screen.queryByLabelText(/Please specify the other reaction/i)).not.toBeInTheDocument();
  });
});
