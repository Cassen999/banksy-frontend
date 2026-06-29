import MonthlyGlance from '../MonthlyGlance/MonthlyGlance';
import ScheduledDeposits from '../ScheduledDeposits/ScheduledDeposits';
import QuickAccountOverview from '../QuickAccountOverview/QuickAccountOverview';

export default function HomepagePage() {
  return (
    <div className="dashboard">
      <h1 className="dashboard__title">Dashboard</h1>
      <section className="dashboard__graph" aria-label="Spending trend graph">
        <MonthlyGlance />
      </section>
      <div className="dashboard__next-deposit" role="region" aria-label="Next scheduled deposit">
        <ScheduledDeposits />
      </div>
      <section className="dashboard__accounts" aria-label="Account overview">
        <QuickAccountOverview />
      </section>
    </div>
  );
}
