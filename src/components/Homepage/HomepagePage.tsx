export default function HomepagePage() {
  return (
    <div className="dashboard">
      <section className="dashboard__graph" aria-label="Spending trend graph" />
      <div className="dashboard__next-deposit" role="region" aria-label="Next scheduled deposit" />
      <section className="dashboard__accounts" aria-label="Account overview" />
    </div>
  );
}
