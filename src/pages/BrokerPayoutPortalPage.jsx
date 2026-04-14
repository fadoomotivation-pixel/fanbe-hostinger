import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { brokerLogout, getBrokerSession } from '@/lib/brokerPortal';

const incomePlanRows = [
  ['RANK.1', 'EX', 5, '100 SQYD (min 1 direct)', '500 SQYD'],
  ['RANK.2', 'SR. EX', 5.5, '', '750 SQYD'],
  ['RANK.3', 'Sales Officer', 6, '', '1250 SQYD'],
  ['RANK.4', 'SR S.O', 6.5, '', '2000 SQYD'],
  ['RANK.5', 'Team Manager', 7, '', '3 SR S.O'],
  ['RANK.6', 'SR T.M', 7.5, '', '3 T.M'],
  ['RANK.7', 'Asst. Sales Mgr', 8, '', '3 SR T.M'],
  ['RANK.8', 'Sales Mgr', 8.5, '', '3 Asst. Sales Mgr'],
  ['RANK.9', 'Sr. S.M', 9, '', '3 Sales Mgr'],
  ['RANK.10', 'Asst. Gen. Mgr', 9.5, '', '3 Sr. S.M'],
  ['RANK.11', 'G.M', 10, '', '3 Asst. Gen. Mgr'],
  ['RANK.12', 'Sr. G.M', 10.5, '', '3 G.M'],
  ['RANK.13', 'Zonal Mgr', 11, '', '3 Sr. G.M'],
  ['RANK.14', 'Vice President', 11.5, '', '3 Zonal Mgr'],
  ['RANK.15', 'President', 12, '', '3 Vice President']
];

const directBonanzaRows = [
  ['500 SQYD', 'Bike (Ex-Showroom)'],
  ['Next 1100 SQYD', 'Alto (Ex-Showroom)'],
  ['Next 2100 SQYD', 'Breeza (Ex-Showroom)'],
  ['Next 5100 SQYD', 'Scorpio (Ex-Showroom)']
];

const teamRewardRows = [
  ['50 Unit', 'Laptop Mini'],
  ['Next 110 Unit', 'L.E.D (55")'],
  ['Next 210 Unit', 'Bullet (Ex-Showroom)'],
  ['Next 410 Unit', 'Alto (Ex-Showroom)'],
  ['Next 810 Unit', 'Breeza (Ex-Showroom)'],
  ['Next 5000 Unit', 'Farm House (35 Lac)'],
  ['Next 12000 Unit', 'Farm House (1 Cr)']
];

const BrokerPayoutPortalPage = () => {
  const navigate = useNavigate();
  const session = getBrokerSession();

  const [rank, setRank] = useState(incomePlanRows[0][0]);
  const [saleSqyd, setSaleSqyd] = useState(5000);
  const [achievers, setAchievers] = useState(1);
  const [directSqyd, setDirectSqyd] = useState(500);
  const [teamUnits, setTeamUnits] = useState(50);

  const selectedRank = useMemo(
    () => incomePlanRows.find((row) => row[0] === rank) || incomePlanRows[0],
    [rank]
  );

  const calculations = useMemo(() => {
    const validAchievers = Math.max(Number(achievers) || 1, 1);
    const validSqyd = Math.max(Number(saleSqyd) || 0, 0);
    const commissionRate = selectedRank[2] / 100;
    const commissionAmount = validSqyd * commissionRate;
    const achieverClubIncome = (validSqyd / validAchievers) * 100;

    const directReward = directBonanzaRows.reduce((current, row) => {
      const target = Number(row[0].replace(/[^\d]/g, ''));
      if (Number(directSqyd) >= target) {
        return row[1];
      }
      return current;
    }, 'Not qualified yet');

    const teamReward = teamRewardRows.reduce((current, row) => {
      const target = Number(row[0].replace(/[^\d]/g, ''));
      if (Number(teamUnits) >= target) {
        return row[1];
      }
      return current;
    }, 'Not qualified yet');

    return {
      commissionRate: selectedRank[2],
      commissionAmount,
      achieverClubIncome,
      directReward,
      teamReward
    };
  }, [achievers, directSqyd, saleSqyd, selectedRank, teamUnits]);

  const handleLogout = () => {
    brokerLogout();
    navigate('/broker/login', { replace: true });
  };

  return (
    <section className="bg-teal-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-white p-6 text-gray-900 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Business Plan</p>
              <h1 className="text-3xl font-black text-[#0F3A5F]">Broker Payout Portal</h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome, {session?.name} ({session?.brokerId})
              </p>
            </div>
            <button onClick={handleLogout} className="rounded-lg border border-[#0F3A5F] px-4 py-2 text-sm font-bold text-[#0F3A5F]">
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 text-gray-900 shadow-xl">
            <h2 className="mb-4 text-2xl font-black text-red-600">Income Plan</h2>
            <div className="max-h-96 overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Rank</th>
                    <th className="p-2 text-left">Post</th>
                    <th className="p-2 text-left">Commission</th>
                    <th className="p-2 text-left">Direct</th>
                    <th className="p-2 text-left">Qualify in Team</th>
                  </tr>
                </thead>
                <tbody>
                  {incomePlanRows.map((row) => (
                    <tr key={row[0]} className="border-t">
                      <td className="p-2 font-semibold">{row[0]}</td>
                      <td className="p-2">{row[1]}</td>
                      <td className="p-2">{row[2]}%</td>
                      <td className="p-2">{row[3] || '-'}</td>
                      <td className="p-2">{row[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 text-gray-900 shadow-xl">
            <h2 className="mb-4 text-2xl font-black text-red-600">Payout Calculator</h2>
            <div className="grid gap-3">
              <label className="text-sm font-medium">Rank</label>
              <select value={rank} onChange={(event) => setRank(event.target.value)} className="rounded border p-2">
                {incomePlanRows.map((row) => (
                  <option key={row[0]} value={row[0]}>{row[0]} ({row[1]})</option>
                ))}
              </select>

              <label className="text-sm font-medium">Total sale in SQYD</label>
              <input type="number" value={saleSqyd} min="0" onChange={(event) => setSaleSqyd(event.target.value)} className="rounded border p-2" />

              <label className="text-sm font-medium">Total no. of achievers</label>
              <input type="number" value={achievers} min="1" onChange={(event) => setAchievers(event.target.value)} className="rounded border p-2" />

              <label className="text-sm font-medium">Direct sale SQYD (for bonanza)</label>
              <input type="number" value={directSqyd} min="0" onChange={(event) => setDirectSqyd(event.target.value)} className="rounded border p-2" />

              <label className="text-sm font-medium">Team units (1 unit = 50 SQYD)</label>
              <input type="number" value={teamUnits} min="0" onChange={(event) => setTeamUnits(event.target.value)} className="rounded border p-2" />
            </div>

            <div className="mt-6 space-y-2 rounded-xl bg-gray-100 p-4 text-sm">
              <p><strong>Commission Rate:</strong> {calculations.commissionRate}%</p>
              <p><strong>Estimated Commission:</strong> ₹{Number(calculations.commissionAmount).toLocaleString('en-IN')}</p>
              <p><strong>Achiever's Club Income:</strong> ₹{Number(calculations.achieverClubIncome).toLocaleString('en-IN')}</p>
              <p><strong>Direct Bonanza Reward:</strong> {calculations.directReward}</p>
              <p><strong>Team Reward:</strong> {calculations.teamReward}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 text-gray-900 shadow-xl">
            <h3 className="mb-3 text-xl font-black text-red-600">Direct Bonanza</h3>
            {directBonanzaRows.map(([target, reward]) => (
              <p key={target} className="border-b py-2 text-sm"><strong>{target}</strong> — {reward}</p>
            ))}
          </div>
          <div className="rounded-2xl bg-white p-6 text-gray-900 shadow-xl">
            <h3 className="mb-3 text-xl font-black text-red-600">Team Reward</h3>
            {teamRewardRows.map(([target, reward]) => (
              <p key={target} className="border-b py-2 text-sm"><strong>{target}</strong> — {reward}</p>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 text-gray-900 shadow-xl">
          <h3 className="mb-3 text-xl font-black text-red-600">Terms & Conditions</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>Payout is calculated on differential basis.</li>
            <li>Payout closing is done daily and distributed monthly.</li>
            <li>No payout on equal rank or super seeded team.</li>
            <li>Sales are counted only when booking amount or more is deposited.</li>
            <li>Grace period for installment deposit is 90 days.</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default BrokerPayoutPortalPage;
