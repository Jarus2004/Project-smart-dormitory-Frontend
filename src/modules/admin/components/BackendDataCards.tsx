import { useBackendData } from '../../shared/useBackendData';
import { sharedApi } from '../../shared/apiService';

function Card({ title, value, loading, error }: { title: string; value?: string; loading?: boolean; error?: string | null }) {
  return (
    <div style={{ border: '1px solid #d0d7de', borderRadius: 12, padding: 16, background: '#fff', minWidth: 180 }}>
      <div style={{ fontSize: 13, color: '#57606a', marginBottom: 8 }}>{title}</div>
      {loading ? <div>Loading...</div> : error ? <div style={{ color: '#cf222e' }}>{error}</div> : <div style={{ fontSize: 24, fontWeight: 700 }}>{value ?? '—'}</div>}
    </div>
  );
}

export default function BackendDataCards() {
  const rooms = useBackendData(async () => {
    const response = await sharedApi.getRooms();
    return response.data?.data ?? response.data;
  }, []);

  const tenants = useBackendData(async () => {
    const response = await sharedApi.getTenants();
    return response.data?.data ?? response.data;
  }, []);

  const visitors = useBackendData(async () => {
    const response = await sharedApi.getVisitors();
    return response.data?.data ?? response.data;
  }, []);

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
      <Card title="Rooms" value={Array.isArray(rooms.data) ? String(rooms.data.length) : '0'} loading={rooms.loading} error={rooms.error} />
      <Card title="Tenants" value={Array.isArray(tenants.data) ? String(tenants.data.length) : '0'} loading={tenants.loading} error={tenants.error} />
      <Card title="Visitors" value={Array.isArray(visitors.data) ? String(visitors.data.length) : '0'} loading={visitors.loading} error={visitors.error} />
    </div>
  );
}
