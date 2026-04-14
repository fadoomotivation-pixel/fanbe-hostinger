import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { brokerLogin, isBrokerAuthenticated } from '@/lib/brokerPortal';

const BrokerLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isBrokerAuthenticated()) {
      navigate('/broker/payout', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const result = brokerLogin(username, password);
    if (!result.success) {
      setError(result.message);
      return;
    }

    const redirectPath = location.state?.from?.pathname || '/broker/payout';
    navigate(redirectPath, { replace: true });
  };

  return (
    <section className="min-h-[80vh] bg-teal-800 px-4 py-14 text-white">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-gray-900 shadow-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-red-600">Broker Payout System</p>
        <h1 className="text-3xl font-extrabold text-[#0F3A5F]">Broker Login</h1>
        <p className="mt-2 text-sm text-gray-600">
          This portal is independent from CRM and only for broker payout tracking.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none ring-[#0F3A5F] focus:ring"
              placeholder="Enter broker username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none ring-[#0F3A5F] focus:ring"
              placeholder="Enter password"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 p-2 text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-[#0F3A5F] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0a2941]"
          >
            Login to Payout Portal
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-500">
          Demo credentials: <span className="font-semibold">broker001 / Fanbe@123</span>
        </p>
      </div>
    </section>
  );
};

export default BrokerLoginPage;
