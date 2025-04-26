export const pieChart = (labels, data, title) => ({
  labels,
  datasets: [
    {
      data,
      backgroundColor: [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
        "#FF9F40",
        "#E7E9ED",
        "#C9CBCF",
        "#8B008B",
        "#00CED1",
      ],
      borderColor: "#fff",
      borderWidth: 1,
    },
  ],
  options: {
    plugins: {
      title: { display: true, text: title, font: { size: 16 } },
      legend: { position: "right" },
    },
    responsive: true,
    maintainAspectRatio: false,
  },
});

export const barChart = (labels, data, title, options = {}) => ({
  labels,
  datasets: [
    {
      label: title,
      data,
      backgroundColor: "#36A2EB",
      borderColor: "#2B8AC6",
      borderWidth: 1,
      ...options.dataset,
    },
  ],
  options: {
    plugins: {
      title: { display: true, text: title, font: { size: 16 } },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`,
          afterLabel: (context) =>
            options.tooltips?.[context.dataIndex]
              ? Object.entries(options.tooltips[context.dataIndex])
                  .map(([key, value]) => `${key}: ${value}`)
                  .join("\n")
              : "",
        },
      },
    },
    scales: {
      y: { beginAtZero: true },
      x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } },
    },
    responsive: true,
    maintainAspectRatio: false,
  },
});

export const lineChart = (labels, data, title, options = {}) => ({
  labels,
  datasets: [
    {
      label: title,
      data,
      borderColor: "#36A2EB",
      backgroundColor: "rgba(54, 162, 235, 0.2)",
      fill: true,
      tension: 0.4,
    },
  ],
  options: {
    plugins: {
      title: { display: true, text: title, font: { size: 16 } },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`,
          afterLabel: (context) =>
            options.tooltips?.[context.dataIndex]
              ? Object.entries(options.tooltips[context.dataIndex])
                  .map(([key, value]) => `${key}: ${value}`)
                  .join("\n")
              : "",
        },
      },
    },
    scales: {
      y: { beginAtZero: true },
      x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } },
    },
    responsive: true,
    maintainAspectRatio: false,
  },
});

export const heatmapChart = (days, hours, data, title) => ({
  labels: hours.map((h) => `${h}:00`),
  datasets: days.map((day, index) => ({
    label: `Day ${day} (0=Monday)`,
    data: data[index],
    backgroundColor: `hsl(${index * 50}, 70%, 50%)`,
    borderColor: "#fff",
    borderWidth: 1,
  })),
  options: {
    plugins: {
      title: { display: true, text: title, font: { size: 16 } },
      legend: { position: "top" },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Invoices" } },
      x: { title: { display: true, text: "Hour of Day" } },
    },
    responsive: true,
    maintainAspectRatio: false,
  },
});

export const stackedBarChart = (labels, datasets, title) => ({
  labels,
  datasets: datasets.map((dataset, index) => ({
    label: dataset.label,
    data: dataset.data,
    backgroundColor: `hsl(${index * 40}, 70%, 50%)`,
    borderColor: "#fff",
    borderWidth: 1,
  })),
  options: {
    plugins: {
      title: { display: true, text: title, font: { size: 16 } },
      legend: { position: "top" },
    },
    scales: {
      x: { stacked: true, ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } },
      y: { stacked: true, beginAtZero: true, title: { display: true, text: "Retention Rate" } },
    },
    responsive: true,
    maintainAspectRatio: false,
  },
});
