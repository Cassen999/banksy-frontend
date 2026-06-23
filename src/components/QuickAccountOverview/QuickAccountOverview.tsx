import { useState } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Skeleton } from 'primereact/skeleton';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAuth } from '../../contexts/AuthContext';
import { useQuickAccountOverview } from '../../hooks/useQuickAccountOverview';
import CustomAccountNameButton from '../CustomAccountNameButton/CustomAccountNameButton';
import type { iAccountWithTransactions, iTransaction } from '../../types/types';
import { isDesktop } from '../../utils/isDesktop';

function formatHeader(account: iAccountWithTransactions): string {
  if (account.customName !== null) return account.customName;
  if (!account.subtype) return account.institutionName;
  const sub = account.subtype.charAt(0).toUpperCase() + account.subtype.slice(1);
  return `${account.institutionName} - ${sub}`;
}

function formatCurrency(amount: number | null, isoCurrencyCode: string | null): string {
  if (amount === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: isoCurrencyCode ?? 'USD',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}

function formatTransactionAmount(
  amount: number,
  isoCurrencyCode: string | null,
): { text: string; className: string } {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: isoCurrencyCode ?? 'USD',
  });
  if (amount > 0) {
    return {
      text: `-${formatter.format(amount)}`,
      className: 'quick-account-overview__amount--debit',
    };
  }
  if (amount < 0) {
    return {
      text: formatter.format(Math.abs(amount)),
      className: 'quick-account-overview__amount--credit',
    };
  }
  return { text: formatter.format(0), className: '' };
}

interface iAccountPanelProps {
  account: iAccountWithTransactions;
  txnLimit: number;
  onNameSuccess: () => void;
}

function AccountPanel({ account, txnLimit, onNameSuccess }: iAccountPanelProps) {
  const visibleTransactions: iTransaction[] = account.transactions.slice(0, txnLimit);

  return (
    <div className="quick-account-overview__panel">
      <div className="quick-account-overview__top">
        <div className="quick-account-overview__info-row">
          <span className="quick-account-overview__label">Bank</span>
          <span className="quick-account-overview__value">{account.institutionName}</span>
        </div>
        <div className="quick-account-overview__info-row">
          <span className="quick-account-overview__label">Account Name</span>
          <div className="quick-account-overview__name-value">
            {account.customName !== null && (
              <span className="quick-account-overview__custom-name">{account.customName}</span>
            )}
            <CustomAccountNameButton
              accountId={account.accountId}
              institutionName={account.institutionName}
              subtype={account.subtype}
              currentCustomName={account.customName}
              onSuccess={onNameSuccess}
            />
          </div>
        </div>
        <div className="quick-account-overview__info-row">
          <span className="quick-account-overview__label">Last Deposit</span>
          <span className="quick-account-overview__value">
            {account.lastDeposit
              ? formatCurrency(
                  Math.abs(account.lastDeposit.amount),
                  account.lastDeposit.isoCurrencyCode,
                )
              : '—'}
          </span>
        </div>
        <div className="quick-account-overview__info-row">
          <span className="quick-account-overview__label">Balance</span>
          <span className="quick-account-overview__value">
            {formatCurrency(account.currentBalance, account.isoCurrencyCode)}
          </span>
        </div>
      </div>

      <div className="quick-account-overview__transactions-section">
        <h3 className="quick-account-overview__transactions-title">Recent Transactions</h3>
        {visibleTransactions.length === 0 ? (
          <p className="quick-account-overview__no-transactions">No recent transactions</p>
        ) : (
          <ul className="quick-account-overview__transaction-list">
            {visibleTransactions.map((txn, i) => {
              const { text, className } = formatTransactionAmount(txn.amount, txn.isoCurrencyCode);
              return (
                <li key={i} className="quick-account-overview__transaction-row">
                  <span className="quick-account-overview__date">{formatDate(txn.date)}</span>
                  <span className={`quick-account-overview__amount ${className}`}>{text}</span>
                </li>
              );
            })}
          </ul>
        )}
        <a href="#" className="quick-account-overview__detailed-link">
          Detailed View
        </a>
      </div>
    </div>
  );
}

export default function QuickAccountOverview() {
  const { user, isLoading: authLoading } = useAuth();
  const { status, accounts, retry, refetchBalance } = useQuickAccountOverview();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (authLoading || !user) {
    return <Skeleton className="quick-account-overview__skeleton" />;
  }

  const txnLimit = isDesktop() ? 5 : 3;

  return (
    <div className="quick-account-overview">
      {(status === 'loading' || status === 'error') && (
        <div className="quick-account-overview__mask">
          {status === 'loading' && (
            <ProgressSpinner aria-label="Loading accounts" />
          )}
          {status === 'error' && (
            <button
              className="quick-account-overview__retry"
              onClick={retry}
              aria-label="Retry"
            >
              <i className="pi pi-undo" />
              Retry
            </button>
          )}
        </div>
      )}
      {status === 'success' && accounts.length === 0 && (
        <p className="quick-account-overview__empty">No linked accounts</p>
      )}
      {status === 'success' && accounts.length > 0 && (
        <Accordion
          activeIndex={activeIndex ?? undefined}
          onTabChange={(e) => {
            const idx = e.index;
            setActiveIndex(typeof idx === 'number' ? idx : null);
          }}
        >
          {accounts.map((account) => (
            <AccordionTab key={account.accountId} header={formatHeader(account)}>
              <AccountPanel
                account={account}
                txnLimit={txnLimit}
                onNameSuccess={refetchBalance}
              />
            </AccordionTab>
          ))}
        </Accordion>
      )}
    </div>
  );
}
