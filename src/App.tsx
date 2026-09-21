import { DashboardProvider } from './componants/addminpage/context/DashboardContext';
import AppRouter from './componants/addminpage/router/AppRouter';
import './componants/addminpage/styles/globals.css';
import RealtimeAlerts, { NotificationProvider } from './components/notifications/RealtimeAlerts';

function App() {
  return (
    <>
      <NotificationProvider>
        <DashboardProvider>
          <AppRouter />
        </DashboardProvider>
        <RealtimeAlerts />
      </NotificationProvider>
    </>
  );
}

export default App;

