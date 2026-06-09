import LinkAccount from '../LinkAccount/LinkAccount';

export default function AccountPage() {
  return (
    <div className="account">
      <h1 className="account__heading">Account Actions</h1>
      <p className="account__description">
        These are all the available actions to manage your Banksy bank links. Click a button below to get started.
      </p>
      <div className="account__actions-grid">
        <LinkAccount />
      </div>
    </div>
  );
}
