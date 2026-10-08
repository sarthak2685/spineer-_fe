import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useState } from 'react';

function StationCart() {
  const [station, setStation] = useState('');
  const [error, setError] = useState('');
  return (
    <form onSubmit={(event) => { event.preventDefault(); if (!station.trim()) setError('Room No. / Table No. is required before placing your order.'); }}>
      <label>Table / Room No.<input aria-label="station" value={station} onChange={(e) => setStation(e.target.value)} /></label>
      <button type="submit">Place Order</button>
      {error && <p>{error}</p>}
    </form>
  );
}

function Steps() {
  const [step, setStep] = useState(1);
  return <div><p>Step {step} of 3</p>{step < 3 && <button onClick={() => setStep(step + 1)}>Next</button>}</div>;
}

describe('registration steps', () => {
  it('advances the three-step wizard', () => {
    render(<MemoryRouter><Steps /></MemoryRouter>);
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });
});

describe('cart station', () => {
  it('requires a station before an order can be placed', () => {
    render(<StationCart />);
    fireEvent.click(screen.getByText('Place Order'));
    expect(screen.getByText(/Table No. is required/)).toBeInTheDocument();
  });
});
