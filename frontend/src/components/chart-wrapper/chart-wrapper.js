const ChartWrapper = ({ title, ChartComponent, data, plotUrl }) => (
  <div style={{ marginBottom: '10%' }}>
    <h2 style={{ textAlign: 'center', color: '#4e79a7' }}>{title}</h2>
    {plotUrl ? (
      <img
        src={`http://localhost:5001${plotUrl}`}
        alt={title}
        style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
      />
    ) : (
      ChartComponent && data && <ChartComponent data={data} />
    )}
  </div>
);

export default ChartWrapper;