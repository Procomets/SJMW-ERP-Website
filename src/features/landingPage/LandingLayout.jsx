import './styles/global.css';
import { Outlet } from 'react-router-dom';
import Footer from './components/Footer/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp/FloatingWhatsApp';

/**
 * LandingLayout — Layout Component for the landing page
 */
export default function LandingLayout() {
  return (
    <div className="landing-page">
      <Outlet />
      <FloatingWhatsApp />
      <Footer />
    </div>
  );
}
