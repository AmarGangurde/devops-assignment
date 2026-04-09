/**
 * Formats raw database rows into structured response objects
 * suitable for frontend rendering (text, table, or chart).
 */

/**
 * @param {Array} rows - Raw rows from DB
 * @param {Array} fields - Field descriptors from pg
 * @param {string} chartType - Suggested chart type from LLM
 * @param {string} explanation - LLM explanation of the query
 * @param {string} sql - The SQL query that was executed
 * @returns {Object} Formatted response
 */
function formatResponse(rows, fields, chartType, explanation, sql) {
  if (!rows || rows.length === 0) {
    return {
      type: 'text',
      data: null,
      summary: 'No results found for your query.',
      sql,
      rowCount: 0,
    };
  }

  const columns = fields ? fields.map(f => f.name) : Object.keys(rows[0]);

  // Single scalar value → text response
  if (rows.length === 1 && columns.length === 1) {
    const value = rows[0][columns[0]];
    return {
      type: 'text',
      data: { value, column: columns[0] },
      summary: `${explanation || 'Result'}: **${formatValue(value)}**`,
      sql,
      rowCount: 1,
    };
  }

  // Chart types: line, bar, pie
  if (chartType === 'line' || chartType === 'bar') {
    const chartData = buildTimeSeriesOrBarData(rows, columns);
    return {
      type: 'chart',
      chartType,
      data: chartData,
      columns,
      rawRows: rows.slice(0, 100), // also send raw for table toggle
      summary: explanation || `Found ${rows.length} data points.`,
      sql,
      rowCount: rows.length,
    };
  }

  if (chartType === 'pie') {
    const pieData = buildPieData(rows, columns);
    return {
      type: 'chart',
      chartType: 'pie',
      data: pieData,
      columns,
      rawRows: rows.slice(0, 100),
      summary: explanation || `Found ${rows.length} categories.`,
      sql,
      rowCount: rows.length,
    };
  }

  // Default: table
  return {
    type: 'table',
    data: rows,
    columns,
    summary: explanation || `Found ${rows.length} record${rows.length !== 1 ? 's' : ''}.`,
    sql,
    rowCount: rows.length,
  };
}

function buildTimeSeriesOrBarData(rows, columns) {
  // Find likely label column (first string/date column) and value column(s)
  if (columns.length < 2) return rows;

  return rows.map(row => {
    const obj = {};
    columns.forEach(col => {
      let val = row[col];
      // Try to parse dates into readable strings
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0];
      } else if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
        val = val.split('T')[0];
      } else if (typeof val === 'object' && val !== null) {
        val = String(val);
      }
      obj[col] = isNaN(val) ? val : Number(val);
    });
    return obj;
  });
}

function buildPieData(rows, columns) {
  if (columns.length < 2) return rows;
  // Use first column as name, second as value
  const [nameCol, valueCol] = columns;
  return rows.map(row => ({
    name: String(row[nameCol]),
    value: Number(row[valueCol]) || 0,
  }));
}

function formatValue(val) {
  if (val === null || val === undefined) return 'null';
  if (val instanceof Date) return val.toLocaleDateString();
  if (typeof val === 'number') return val.toLocaleString();
  return String(val);
}

module.exports = { formatResponse };
