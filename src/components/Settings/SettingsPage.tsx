import AuthButton from '../AuthButton/AuthButton';

export default function SettingsPage() {
  return (
    <div className="settings">
      <div className="settings__content">
        <h1 className="settings__heading">Settings</h1>
        <AuthButton />
      </div>
    </div>
  );
}
