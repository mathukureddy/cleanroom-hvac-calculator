import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ProjectWizard from '../pages/ProjectWizard';
import api from '../services/api';

jest.mock('../services/api');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderProjectWizard = () => {
  return render(
    <BrowserRouter>
      <ProjectWizard />
    </BrowserRouter>
  );
};

describe('ProjectWizard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses for standards and classifications
    api.get.mockImplementation((url) => {
      if (url === '/standards') {
        return Promise.resolve({
          data: [
            { standardId: 1, standardName: 'ISO 14644-1' },
            { standardId: 2, standardName: 'EU GMP' }
          ]
        });
      }
      if (url.includes('/standards/') && url.includes('/classifications')) {
        return Promise.resolve({
          data: [
            { classificationId: 1, className: 'ISO 5', acph: 240 },
            { classificationId: 2, className: 'ISO 6', acph: 90 }
          ]
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  test('renders step 1 - project details', async () => {
    renderProjectWizard();
    
    await waitFor(() => {
      expect(screen.getByText(/step 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    });
  });

  test('validates project name is required', async () => {
    renderProjectWizard();
    
    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
    });

    expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
  });

  test('proceeds to step 2 with valid project details', async () => {
    renderProjectWizard();
    
    await waitFor(() => {
      const projectNameInput = screen.getByLabelText(/project name/i);
      const locationInput = screen.getByLabelText(/location/i);
      
      fireEvent.change(projectNameInput, { target: { value: 'Test Cleanroom' } });
      fireEvent.change(locationInput, { target: { value: 'Building A' } });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/step 2/i)).toBeInTheDocument();
      expect(screen.getByText(/zone configuration/i)).toBeInTheDocument();
    });
  });

  test('adds a zone in step 2', async () => {
    renderProjectWizard();
    
    // Navigate to step 2
    await waitFor(() => {
      const projectNameInput = screen.getByLabelText(/project name/i);
      fireEvent.change(projectNameInput, { target: { value: 'Test Project' } });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      const addZoneButton = screen.getByRole('button', { name: /add zone/i });
      fireEvent.click(addZoneButton);
    });

    expect(screen.getByLabelText(/zone name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/standard/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/classification/i)).toBeInTheDocument();
  });

  test('validates zone dimensions', async () => {
    renderProjectWizard();
    
    // Navigate to step 2 and add zone
    await waitFor(() => {
      const projectNameInput = screen.getByLabelText(/project name/i);
      fireEvent.change(projectNameInput, { target: { value: 'Test Project' } });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /add zone/i }));
    });

    // Try to submit with invalid dimensions
    const lengthInput = screen.getByLabelText(/room length/i);
    fireEvent.change(lengthInput, { target: { value: '-10' } });

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    expect(screen.getByText(/room length must be positive/i)).toBeInTheDocument();
  });

  test('loads classifications when standard is selected', async () => {
    renderProjectWizard();
    
    // Navigate to step 2
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/project name/i), {
        target: { value: 'Test' }
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /add zone/i }));
    });

    // Select a standard
    const standardSelect = screen.getByLabelText(/standard/i);
    fireEvent.change(standardSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/standards/1/classifications');
    });
  });

  test('displays zone preview in step 3', async () => {
    renderProjectWizard();
    
    // Complete step 1
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/project name/i), {
        target: { value: 'Test Project' }
      });
      fireEvent.change(screen.getByLabelText(/location/i), {
        target: { value: 'Building A' }
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
    });

    // Complete step 2
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /add zone/i }));
    });

    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/zone name/i), {
        target: { value: 'Zone 1' }
      });
      fireEvent.change(screen.getByLabelText(/room length/i), {
        target: { value: '10' }
      });
      fireEvent.change(screen.getByLabelText(/room width/i), {
        target: { value: '8' }
      });
      fireEvent.change(screen.getByLabelText(/room height/i), {
        target: { value: '3' }
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
    });

    // Check step 3 preview
    await waitFor(() => {
      expect(screen.getByText(/step 3/i)).toBeInTheDocument();
      expect(screen.getByText(/review/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Project/i)).toBeInTheDocument();
      expect(screen.getByText(/Zone 1/i)).toBeInTheDocument();
    });
  });

  test('submits project successfully', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        projectId: 1,
        message: 'Project created successfully'
      }
    });

    renderProjectWizard();
    
    // Complete all steps
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/project name/i), {
        target: { value: 'Test Project' }
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /add zone/i }));
      fireEvent.change(screen.getByLabelText(/zone name/i), {
        target: { value: 'Zone 1' }
      });
      fireEvent.change(screen.getByLabelText(/room length/i), {
        target: { value: '10' }
      });
      fireEvent.change(screen.getByLabelText(/room width/i), {
        target: { value: '8' }
      });
      fireEvent.change(screen.getByLabelText(/room height/i), {
        target: { value: '3' }
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
    });

    // Submit
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /create project/i });
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/projects', expect.any(Object));
      expect(mockNavigate).toHaveBeenCalledWith('/projects/1');
    });
  });

  test('can go back to previous steps', async () => {
    renderProjectWizard();
    
    // Go to step 2
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/project name/i), {
        target: { value: 'Test' }
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/step 2/i)).toBeInTheDocument();
    });

    // Go back to step 1
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByText(/step 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/project name/i).value).toBe('Test');
    });
  });

  test('removes zone from list', async () => {
    renderProjectWizard();
    
    // Navigate and add zone
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/project name/i), {
        target: { value: 'Test' }
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /add zone/i }));
    });

    // Fill zone details
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/zone name/i), {
        target: { value: 'Zone to Remove' }
      });
    });

    // Remove zone
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    expect(screen.queryByText(/Zone to Remove/i)).not.toBeInTheDocument();
  });

  test('handles API error on submission', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: {
          error: 'Failed to create project'
        }
      }
    });

    renderProjectWizard();
    
    // Complete steps and submit
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/project name/i), {
        target: { value: 'Test' }
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      fireEvent.click(screen.getByRole('button', { name: /add zone/i }));
      fireEvent.change(screen.getByLabelText(/zone name/i), {
        target: { value: 'Zone 1' }
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      fireEvent.click(screen.getByRole('button', { name: /create project/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/failed to create project/i)).toBeInTheDocument();
    });
  });
});
