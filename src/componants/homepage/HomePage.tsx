import Navbar from './header/navbar';
import HeroSection from './selection/HeroSection';
import SecurityBanner from './SecurityBanner/SecurityBanner';
import FeatureSection from './FeatureSection/FeatureSection';
import Footer from './Footer/Footer';

function HomePage() {
  return (
    <div id="home" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', margin: -20 }}>
      <Navbar />
      <HeroSection />
      <SecurityBanner />
      <div id="about">
        <FeatureSection />
      </div>
      <section id="news" aria-labelledby="news-title" style={{ padding: '56px 20px', background: '#eff6ff', textAlign: 'center' }}>
        <h2 id="news-title" style={{ margin: '0 0 12px', color: '#0f172a' }}>ข่าวสาร</h2>
        <p style={{ maxWidth: 640, margin: '0 auto', color: '#64748b', lineHeight: 1.7 }}>
          ติดตามข่าวสารและการอัปเดตระบบจัดการหอพัก เพื่อให้การใช้บริการของคุณสะดวกและปลอดภัยยิ่งขึ้น
        </p>
      </section>
      <Footer />
    </div>
  );
}

export default HomePage;
