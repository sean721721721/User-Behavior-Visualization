import * as d3 from 'd3';

export default function table(json) {
  let matrix = json.matrix,
    row_labels = json.row_labels,
    col_labels = json.col_labels,
    row_perm = json.row_permutation,
    col_perm = json.col_permutation,
    row_inv,
    col_inv,
    n = matrix.length,
    m = matrix[0].length,
    i;

  if (!row_labels) {
    row_labels = Array(n);
    for (i = 0; i < n; i++) { row_labels[i] = i + 1; }
  }
  if (!col_labels) {
    col_labels = Array(m);
    for (i = 0; i < n; i++) { col_labels[i] = i + 1; }
  }

  if (!row_perm) { row_perm = reorder.permutation(n); }
  row_inv = reorder.inverse_permutation(row_perm);

  if (!col_perm) { col_perm = reorder.permutation(m); }
  col_inv = reorder.inverse_permutation(col_perm);

  let colorLow = 'white',
    colorHigh = 'orange';
  let max_value = d3.max(matrix.map((row) => d3.max(row))),
    color = d3.scale.linear()
	    .range([colorLow, colorHigh])
	    .domain([0, max_value]);

  let gridSize = Math.min(width / matrix.length, height / matrix[0].length),
    h = gridSize,
    th = h * n,
    w = gridSize,
    tw = w * m;

  let x = function (i) { return w * col_inv[i]; },
    y = function (i) { return h * row_inv[i]; };

  const row = svg
	    .selectAll('.row')
	    .data(matrix, (d, i) => 'row'+i)
	    .enter().append('g')
    .attr('id', (d, i) => "row"+i)
    .attr('class', 'row')
    .attr('transform', (d, i) => "translate(0,"+y(i)+")");

  const cell = row.selectAll('.cell')
	    .data((d) => d)
	    .enter().append('rect')
    .attr('class', 'cell')
    .attr('x', (d, i) => x(i))
    .attr('width', w)
    .attr('height', h)
    .style('fill', (d) => color(d));

  row.append('line')
    .attr('x2', tw);

  row.append('text')
    .attr('x', -6)
    .attr('y', h / 2)
    .attr('dy', '.32em')
    .attr('text-anchor', 'end')
    .text((d, i) => row_labels[i]);

  const col = svg.selectAll('.col')
	    .data(matrix[0])
	    .enter().append('g')
	    .attr('id', (d, i) => "col"+i)
	    .attr('class', 'col')
	    .attr('transform', (d, i) => "translate(" + x(i) + ")rotate(-90)");

  col.append('line')
    .attr('x1', -th);

  col.append('text')
    .attr('x', 6)
    .attr('y', w / 2)
    .attr('dy', '.32em')
    .attr('text-anchor', 'start')
    .text((d, i) => col_labels[i]);

  svg.append('rect')
    .attr('width', tw)
    .attr('height', th)
    .style('fill', 'none')
    .style('stroke', 'black');

  function order(rows, cols) {
    row_perm = rows;
    row_inv = reorder.inverse_permutation(row_perm);
    col_perm = cols;
    col_inv = reorder.inverse_permutation(col_perm);

    const t = svg.transition().duration(1500);

    t.selectAll('.row')
      .attr('transform', (d, i) => "translate(0," + y(i) + ")")
	    .selectAll('.cell')
      .attr('x', (d, i) => x(i));

    t.selectAll('.col')
      .attr('transform', (d, i) => "translate(" + x(i) + ")rotate(-90)");
  }
  table.order = order;
}
