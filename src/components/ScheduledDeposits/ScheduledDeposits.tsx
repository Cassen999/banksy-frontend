import piggyBankUrl from '../../assets/Piggy Bank.svg';
import { isDesktop } from '../../utils/isDesktop';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Skeleton } from 'primereact/skeleton';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAuth } from '../../contexts/AuthContext';
import { useScheduledDeposits } from '../../hooks/useScheduledDeposits';
import type { iScheduledDeposit, iScheduledDepositAmount } from '../../types/types';

function formatAmount(amount: iScheduledDepositAmount | null): string {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: amount.isoCurrencyCode,
  }).format(amount.amount);
}

function formatFrequency(frequency: string): string {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1).toLowerCase();
}

function AccordionHeader({ deposit }: { deposit: iScheduledDeposit }) {
  return (
    <div className="scheduled-deposits__header">
      <img
        src={piggyBankUrl}
        alt=""
        aria-hidden="true"
        className="scheduled-deposits__piggy"
      />
      <span>
        Next upcoming deposit from {deposit.merchantName ?? '—'} for{' '}
        {formatAmount(deposit.averageAmount)} on {deposit.predictedNextDate}
      </span>
    </div>
  );
}

function AccordionPanel({ deposit }: { deposit: iScheduledDeposit }) {
  return (
    <dl className="scheduled-deposits__detail">
      <div className="scheduled-deposits__col">
        <div><dt>From</dt><dd>{deposit.merchantName ?? '—'}</dd></div>
        <div><dt>Description</dt><dd>{deposit.description ?? '—'}</dd></div>
        <div><dt>Frequency</dt><dd>{formatFrequency(deposit.frequency)}</dd></div>
      </div>
      <div className="scheduled-deposits__col">
        <div><dt>Last</dt><dd>{deposit.lastDate} · {formatAmount(deposit.lastAmount)}</dd></div>
        <div><dt>Next</dt><dd>{deposit.predictedNextDate} · {formatAmount(deposit.averageAmount)}</dd></div>
      </div>
    </dl>
  );
}

export default function ScheduledDeposits() {
  const { user, isLoading: authLoading } = useAuth();
  const { status, deposits, retry } = useScheduledDeposits();

  if (authLoading || !user) {
    return <Skeleton className="scheduled-deposits__skeleton" />;
  }

  const visibleDeposits = isDesktop() ? deposits.slice(0, 5) : deposits.slice(0, 1);

  return (
    <div className="scheduled-deposits">
      {(status === 'loading' || status === 'error') && (
        <div className="scheduled-deposits__mask">
          {status === 'loading' && (
            <ProgressSpinner aria-label="Loading scheduled deposits" />
          )}
          {status === 'error' && (
            <button
              className="scheduled-deposits__retry"
              onClick={retry}
              aria-label="Retry"
            >
              <i className="pi pi-undo" />
              Retry
            </button>
          )}
        </div>
      )}
      {status === 'success' && deposits.length === 0 && (
        <p className="scheduled-deposits__empty">No upcoming deposits this month.</p>
      )}
      {status === 'success' && deposits.length > 0 && (
        <Accordion multiple>
          {visibleDeposits.map((deposit, i) => (
            <AccordionTab
              key={i}
              header={<AccordionHeader deposit={deposit} />}
              pt={{ headerAction: { 'aria-label': `Deposit from ${deposit.merchantName ?? 'Unknown'}` } }}
            >
              <AccordionPanel deposit={deposit} />
            </AccordionTab>
          ))}
        </Accordion>
      )}
    </div>
  );
}
