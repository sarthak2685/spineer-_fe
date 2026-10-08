import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { homeFor } from '../../app/auth';
import { GameResult } from './pages';

export function redirectFor(role: string) { return homeFor(role); }

describe('login redirect', () => {
  it('sends each role to its own home', () => {
    expect(redirectFor('SuperAdmin')).toBe('/super/dashboard');
    expect(redirectFor('BusinessAdmin')).toBe('/business/dashboard');
    expect(redirectFor('Customer')).toBe('/customer/dashboard');
  });
});

describe('game result', () => {
  it('renders the prize returned by the API', () => {
    render(<MemoryRouter><GameResult name="50 Coins" coins={50} /></MemoryRouter>);
    expect(screen.getByText('50 Coins')).toBeInTheDocument();
    expect(screen.getByText(/50 coins/)).toBeInTheDocument();
  });
});
