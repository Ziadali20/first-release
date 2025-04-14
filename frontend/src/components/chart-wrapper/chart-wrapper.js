const ChartWrapper = ({ title, ChartComponent, data }) => (
    <div style={{ marginBottom: '10%' }}>
      <h2>{title}</h2>
      <ChartComponent data={data} />
    </div>
  );
  
  export default ChartWrapper;