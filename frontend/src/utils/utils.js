const CHART_COLORS = {
  blue: '#6C9BCF',
  green: '#7EB77F',
  orange: '#FFA987',
  purple: '#A98FCF',
  pink: '#E88BB3',
  teal: '#6CB8B8',
  gold: '#FFC87C',
  gray: '#B0B0B0',
  red: '#FF6B6B',
  magenta: '#C77EB5',
};

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: { size: 14, family: 'Arial, sans-serif' },
        color: '#333',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: { size: 16 },
      bodyFont: { size: 14 },
      padding: 10,
      cornerRadius: 5,
      callbacks: {
        label: (context) => `${context.dataset.label}: ${context.raw}`,
      },
    },
  },
  animation: {
    duration: 1000,
    easing: 'easeInOutQuart',
  },
};

// Line Chart
export const lineChart = (xAxis, yAxis, description) => {
  return {
    labels: xAxis,
    datasets: [
      {
        label: description,
        data: yAxis,
        borderColor: CHART_COLORS.blue,
        backgroundColor: 'rgba(108, 155, 207, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: CHART_COLORS.blue,
        fill: true,
      },
    ],
    options: {
      ...commonOptions,
      scales: {
        x: { grid: { display: false }, ticks: { color: '#666', font: { size: 12 } } },
        y: { grid: { color: '#e0e0e0' }, ticks: { color: '#666', font: { size: 12 } } },
      },
    },
  };
};

// Bar Chart
export const barChart = (xAxis, yAxis, description) => {
  return {
    labels: xAxis,
    datasets: [
      {
        label: description,
        data: yAxis,
        backgroundColor: CHART_COLORS.blue,
        borderColor: CHART_COLORS.blue,
        borderWidth: 2,
        borderRadius: 5,
        hoverBackgroundColor: CHART_COLORS.orange,
        hoverBorderColor: CHART_COLORS.orange,
      },
    ],
    options: {
      ...commonOptions,
      scales: {
        x: { grid: { display: false }, ticks: { color: '#666', font: { size: 12 } } },
        y: { grid: { color: '#e0e0e0' }, ticks: { color: '#666', font: { size: 12 } } },
      },
    },
  };
};

// Pie Chart
export const pieChart = (labels, values) => {
  return {
    labels: labels,
    datasets: [
      {
        label: 'Customer Segments',
        data: values,
        backgroundColor: [
          CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.orange,
          CHART_COLORS.purple, CHART_COLORS.pink, CHART_COLORS.teal,
          CHART_COLORS.gold, CHART_COLORS.gray, CHART_COLORS.red, CHART_COLORS.magenta,
        ],
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
    options: {
      ...commonOptions,
      plugins: { legend: { position: 'bottom', labels: { padding: 20 } } },
    },
  };
};