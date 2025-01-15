const chartConfig = {
    createChartConfig: (data) => ({
      type: 'candlestick',
      data: {
        datasets: [
          {
            label: 'Price',
            data: data.close.map((close, i) => ({
              x: data.timestamp[i],
              o: data.open[i],
              h: data.high[i],
              l: data.low[i],
              c: close
            }))
          },
          {
            label: 'EMA 5',
            type: 'line',
            data: data.ema5,
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            fill: false
          },
          {
            label: 'EMA 15',
            type: 'line',
            data: data.ema15,
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            fill: false
          },
          {
            label: 'EMA 50',
            type: 'line',
            data: data.ema50,
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute',
              displayFormats: {
                minute: 'HH:mm'
              }
            },
            ticks: {
              source: 'auto',
              maxRotation: 0
            }
          },
          y: {
            position: 'right',
            ticks: {
              precision: 4
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ${value.toFixed(4)}`;
              }
            }
          }
        }
      }
    })
  };
  
  module.exports = chartConfig;