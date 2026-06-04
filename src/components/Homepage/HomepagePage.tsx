import { useRef, useEffect } from 'react';
import type React from 'react';
import lottie from 'lottie-web';
import { useAuth } from '../../contexts/AuthContext';
import budgetAnimation from '../../assets/budget-animation.json';
import banksyLogo from '../../assets/banksy-logo.png';
import stonks from '../../assets/stonks.png';

export default function HomepagePage() {
  const { user } = useAuth();
  const animationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animationRef.current) return;
    const anim = lottie.loadAnimation({
      container: animationRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: budgetAnimation,
    });
    return () => anim.destroy();
  }, []);

  return (
    <div className="homepage" style={{ '--stonks-bg': `url(${stonks})` } as React.CSSProperties}>
      <div className="homepage__animation" aria-hidden="true" ref={animationRef} />
      <div className="homepage__image" aria-hidden="true" />

      <div className="homepage__message">
        <h1>
          {user ? (
            <>
              <span className="homepage__desktop-welcome">
                Welcome to{' '}
                <img src={banksyLogo} alt="Banksy" className="homepage__logo" />
              </span>
              <span className="homepage__mobile-welcome">
                Welcome to Banksy, where dreams are dreams
              </span>
            </>
          ) : (
            'Please log in to be finance guy'
          )}
        </h1>
      </div>
    </div>
  );
}
