import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container } from '../../components/ui/Container';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { SelectGroup } from '../../components/ui/SelectGroup';
import { PageTransition, Stagger, StaggerItem } from '../../components/motion';
import { api } from '../../lib/api';

export const RoutineSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: analysisId } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [budget, setBudget] = useState<string[]>(['mid_range']);
  const [routinePreference, setRoutinePreference] = useState<string[]>(['balanced']);
  const [skinSensitivity, setSkinSensitivity] = useState<string[]>(['normal']);
  const [morningTime] = useState('3_minutes');
  const [nightTime] = useState('10_minutes');
  const [experience] = useState('intermediate');

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        budget: budget[0] || 'mid_range',
        routinePreference: routinePreference[0] || 'balanced',
        morningTime,
        nightTime,
        skinSensitivity: skinSensitivity[0] || 'normal',
        experience,
      };
      
      // 1. Generate recommendation with consultation payload
      await api.post('/recommendations/generate', payload);
      
      // 3. Go back to results to view the routine
      navigate(`/app/results/${analysisId}?routine=ready`);
    } catch (e: any) {
      setError(e.message || "Failed to generate routine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <Container className="pt-32 pb-32 max-w-3xl">
        <Stagger amount={0.1}>
          <StaggerItem>
            <Typography variant="h2" className="text-[#253A4A] mb-4">AI Consultation</Typography>
            <Typography variant="body" className="opacity-70 mb-12">
              Before we map your clinical findings to a routine, tell us a bit about your lifestyle and preferences.
            </Typography>
          </StaggerItem>

          {error && (
            <StaggerItem className="mb-8 p-4 bg-red-50 text-red-600 rounded-xl">
              {error}
            </StaggerItem>
          )}

          <div className="space-y-12">
            <StaggerItem>
              <Typography variant="h4" className="text-[#253A4A] mb-6">Budget Priority</Typography>
              <SelectGroup 
                name="budget"
                selectedValues={budget}
                onChange={setBudget}
                options={[
                  { value: 'budget', label: 'Accessible', description: 'Focus on essential, affordable products' },
                  { value: 'mid_range', label: 'Mid-range', description: 'Best value clinical formulas' },
                  { value: 'premium', label: 'Premium', description: 'Luxury and advanced formulations' }
                ]}
              />
            </StaggerItem>

            <StaggerItem>
              <Typography variant="h4" className="text-[#253A4A] mb-6">Routine Complexity</Typography>
              <SelectGroup 
                name="routine_preference"
                selectedValues={routinePreference}
                onChange={setRoutinePreference}
                options={[
                  { value: 'minimal', label: 'Minimal' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'advanced', label: 'Advanced' }
                ]}
              />
            </StaggerItem>
            
            <StaggerItem>
              <Typography variant="h4" className="text-[#253A4A] mb-6">Skin Sensitivity</Typography>
              <SelectGroup 
                name="skin_sensitivity"
                selectedValues={skinSensitivity}
                onChange={setSkinSensitivity}
                options={[
                  { value: 'sensitive', label: 'Sensitive' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'tolerant', label: 'Highly Tolerant' }
                ]}
              />
            </StaggerItem>

            <StaggerItem className="pt-8">
              <Button 
                className="w-full py-6 text-lg rounded-full"
                onClick={handleSubmit}
                isLoading={loading}
              >
                Generate Custom Routine
              </Button>
            </StaggerItem>
          </div>
        </Stagger>
      </Container>
    </PageTransition>
  );
};
