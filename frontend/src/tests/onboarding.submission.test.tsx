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

describe('Questionnaire Submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const completeQuestionnaire = async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ id: 'user1', email: 'test@example.com' }); // Auth
    vi.mocked(api.get).mockRejectedValueOnce(new ApiError('Not Found', 404)); // Profile 404
    
    window.history.pushState({}, 'Test', '/onboarding');
    render(<App />);
    
    await waitFor(() => expect(screen.getByText(/Let's understand your skin/i)).toBeInTheDocument());
    
    // Step 1
    fireEvent.click(screen.getByLabelText(/^Oily$/i));
    fireEvent.click(screen.getByLabelText(/^Breakouts$/i));
    fireEvent.click(screen.getByLabelText(/^Simpler routine$/i));
    fireEvent.click(screen.getByLabelText(/^Low$/i));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    
    // Step 2
    await waitFor(() => expect(screen.getByText(/Your current routine/i)).toBeInTheDocument());
    fireEvent.click(screen.getAllByLabelText(/^None$/i)[0]);
    fireEvent.click(screen.getAllByLabelText(/^None$/i)[1]);
    fireEvent.click(screen.getByLabelText(/^Daily$/i));
    fireEvent.click(screen.getByLabelText(/^Beginner$/i));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    
    // Step 3
    await waitFor(() => expect(screen.getByText(/Important context/i)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/^No$/i));
    fireEvent.click(screen.getAllByLabelText(/^None$/i)[0]); // known reactions
    fireEvent.click(screen.getAllByLabelText(/^None$/i)[1]); // preference avoid
    // Omit climate (optional)
  };

  it('exact final payload matches backend contract and successful submission refreshes profile', async () => {
    await completeQuestionnaire();
    
    vi.mocked(api.post).mockResolvedValueOnce({ version: "1.0", id: "sub1" });
    vi.mocked(api.get).mockResolvedValueOnce({ skin_type: 'oily' }); // The refresh
    
    fireEvent.click(screen.getByRole('button', { name: /Complete Profile/i }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/questionnaires/submissions', {
        skin_type: 'oily',
        current_concerns: ['breakouts'],
        primary_goal: 'simpler_routine',
        sensitivity_tendency: 'low',
        routine_product_categories: ['none'],
        active_ingredient_categories: ['none'],
        sunscreen_frequency: 'daily',
        routine_experience: 'beginner',
        clinician_directed_treatment: false,
        known_reaction_categories: ['none'],
        known_reaction_other_note: null,
        preference_avoid_categories: ['none'],
      });
      expect(api.get).toHaveBeenCalledTimes(3); // auth, init profile 404, refresh profile 200
      expect(screen.getByText(/Welcome to Ishkeen/i)).toBeInTheDocument();
    });
  });

  it('failed submission preserves answers and step', async () => {
    await completeQuestionnaire();
    
    vi.mocked(api.post).mockRejectedValueOnce(new ApiError('Validation failed', 422));
    
    fireEvent.click(screen.getByRole('button', { name: /Complete Profile/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Validation error: Validation failed/i)).toBeInTheDocument();
      // Still on step 3
      expect(screen.getByText(/Important context/i)).toBeInTheDocument();
      // Answers preserved
      expect(screen.getByLabelText(/^No$/i)).toBeChecked();
    });
  });
});
