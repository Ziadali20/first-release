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
        label: (context) => `${context.dataset.label}: ${context.raw.value} invoices`,
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

// Heatmap Chart
// export const heatmapChart = (data) => {
//   const colorScale = (value) => {
//     const maxValue = Math.max(...data.activity_heatmap.map(item => item.InvoiceNo));
//     const minValue = Math.min(...data.activity_heatmap.map(item => item.InvoiceNo));
//     const normalized = (value - minValue) / (maxValue - minValue || 1); 
//     const r = Math.round(255 * (1 - normalized)); 
//     const g = Math.round(255 * normalized); 
//     const b = 0;
//     return `rgb(${r}, ${g}, ${b})`;
//   };

//   return {
//     datasets: [
//       {
//         label: 'Customer Activity',
//         data: data.activity_heatmap.map(item => ({
//           x: item.DayOfWeek, // الأيام (0-6)
//           y: item.Hour - 6,  // الساعات (0-14) عشان نجيبها من 6:00 لـ 20:00
//           value: item.InvoiceNo
//         })),
//         backgroundColor: (context) => {
//           const value = context.dataset.data[context.dataIndex].value;
//           return colorScale(value);
//         },
//         borderColor: 'rgba(0, 0, 0, 0.1)',
//         borderWidth: 0.5,
//         width: ({ chart }) => (chart.chartArea || {}).width / 7 - 1,
//         height: ({ chart }) => (chart.chartArea || {}).height / 15 - 1, // 15 ساعة من 6:00 لـ 20:00
//       },
//     ],
//     options: {
//       ...commonOptions,
//       scales: {
//         x: {
//           type: 'category',
//           labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
//           grid: { display: false },
//           ticks: { color: '#666', font: { size: 12 } },
//         },
//         y: {
//           type: 'category',
//           labels: Array.from({ length: 15 }, (_, i) => `${i + 6}:00`).reverse(), // عكس الساعات (6:00 تحت، 20:00 فوق)
//           grid: { display: false },
//           ticks: { color: '#666', font: { size: 12 } },
//         },
//       },
//       plugins: {
//         legend: { display: false },
//         tooltip: {
//           callbacks: {
//             label: (context) => `${context.dataset.label}: ${context.raw.value} invoices`,
//           },
//         },
//       },
//     },
//   };
// };









