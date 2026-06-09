import { createContext, useContext, useRef, useState, useMemo, useEffect } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { Toast } from 'primereact/toast';
import type { ToastMessage } from 'primereact/toast';
import type { MessageProps } from 'primereact/message';

interface iNotificationContext {
  toastRef: RefObject<Toast | null>;
  showToast: boolean;
  toastConfig: ToastMessage | null;
  triggerToast: (config: ToastMessage, duration?: number) => void;
  hideToast: () => void;
  showBanner: boolean;
  bannerConfig: MessageProps | null;
  triggerBanner: (config: MessageProps) => void;
  hideBanner: () => void;
}

const NotificationContext = createContext<iNotificationContext | null>(null);

interface iNotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: iNotificationProviderProps) {
  const toastRef = useRef<Toast>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastConfig, setToastConfig] = useState<ToastMessage | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerConfig, setBannerConfig] = useState<MessageProps | null>(null);

  useEffect(() => {
    if (showToast && toastConfig) {
      toastRef.current?.show(toastConfig);
    }
  }, [showToast, toastConfig]);

  const value = useMemo<iNotificationContext>(
    () => ({
      toastRef,
      showToast,
      toastConfig,
      triggerToast(config: ToastMessage, duration: number = 3000) {
        setToastConfig({ ...config, life: duration });
        setShowToast(true);
      },
      hideToast() {
        setShowToast(false);
        setToastConfig(null);
      },
      showBanner,
      bannerConfig,
      triggerBanner(config: MessageProps) {
        setBannerConfig(config);
        setShowBanner(true);
      },
      hideBanner() {
        setShowBanner(false);
        setBannerConfig(null);
      },
    }),
    [showToast, toastConfig, showBanner, bannerConfig],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotify(): iNotificationContext {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider');
  return ctx;
}
