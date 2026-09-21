import { useBackendData } from '../../shared/useBackendData';
import { sharedApi } from '../../shared/apiService';

export default function BackendStatusPanel() {
  const { data, loading, error } = useBackendData(async () => {
    const response = await sharedApi.getHealth();
    return response.data;
  }, []);

  return (
    <div style={{ border: '1px solid #d0d7de', borderRadius: 12, padding: 16, background: '#fff', marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 8px' }}>Backend Status</h3>
      <div style={{ fontSize: 14, color: '#57606a' }}>
        {loading && 'Loading backend status...'}
        {error && <span style={{ color: '#cf222e' }}>Error: {error}</span>}
        {!loading && !error && data && <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>}
      </div>
    </div>
  );
}
