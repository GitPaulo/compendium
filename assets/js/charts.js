var charts = (function() {

  const SVG_NS = 'http://www.w3.org/2000/svg';

  const hohChestDistributionChartId = 'hohChestContentsChart';
  const hohChestDistributionLegendId = 'hohChestContentsLegend';
  const hohChestDistributionDataTitleId = 'hohChestContentsDataTitle';
  const hohChestDistributionDataTableId = 'hohChestContentsDataTable';
  const hohChestDistributionFloorSelect = 'hohChestContents_floorSelect';

  return {
    drawHoHChestDistribution: function(data) {
      const viewboxWidth = 1000;
      const lineSpacing = 100;
      const viewboxHeight = lineSpacing * (data.length - 1);

      let columns = makeHohChestDistributionColumns();
      data.forEach(floorset => {
        floorset.total_gold = 0;
        floorset.total_silver = 0;
        floorset.total_bronze = 0;
        columns.forEach(column => {
          floorset['total_' + column.chestType] += parseInt(floorset[column.key])
        })
      });

      let y = 0;
      data.forEach(floorset => {
        let x = 0;
        columns.forEach(column => {
          column.points.unshift(coords(x, y));
          let chestCount = parseInt(floorset['total_' + column.chestType]);
          if (chestCount > 0) {
            x = x + parseInt(floorset[column.key]) / chestCount * parseFloat(floorset['percent_' + column.chestType]) * (viewboxWidth / 100);
            x = Math.min(Math.round(x), viewboxWidth);
          }
          column.points.push(coords(x, y));
        });
        y += lineSpacing;
      });

      let chart = document.createElementNS(SVG_NS, 'svg');
      chart.classList.add('percentAreaChart');
      chart.setAttribute('width', '100%');
      // SVG coordinate system: width=10000 (percent*100), height=100*(floorsetCount-1)
      chart.setAttribute('viewBox', `0 0 ${viewboxWidth} ${viewboxHeight}`)
      
      function deselectAll() {
        let allLines = chart.getElementsByTagName('line');
        for (let line of allLines) {
          line.classList.remove('selected');
        }
        let selectedShape = chart.getElementsByClassName('selectedShape');
        for (let shape of selectedShape) {
          shape.remove();
        }
        let floorSelect = document.getElementById(hohChestDistributionFloorSelect);
        floorSelect.value = -1;
      }

      function selectLine(lineY) {
        deselectAll();
        let line = document.getElementById('hohChestContentsLine_' + lineY);
        line.classList.add('selected');
        let i = lineY / lineSpacing;
        makeFloorsetDropsTable(hohChestDistributionDataTitleId, hohChestDistributionDataTableId, columns, data[i]);
        let floorSelect = document.getElementById(hohChestDistributionFloorSelect);
        floorSelect.value = i;
      }

      function selectColumn(column) {
        deselectAll();
        let polygon = document.getElementById(`hohChestContentsColumn_${column.key}`);
        let selected = polygon.cloneNode();
        selected.classList.add('selectedShape');
        chart.appendChild(selected);
        makeItemDropsByFloorTable(hohChestDistributionDataTitleId, hohChestDistributionDataTableId, column, data);
      }

      columns.forEach(column => {
        let polygon = document.createElementNS(SVG_NS, 'polygon');
        polygon.id = 'hohChestContentsColumn_' + column.key;
        polygon.setAttribute('points', column.points.join(' '));
        polygon.setAttribute('fill', column.fillColour);
        polygon.addEventListener('click', (event) => {
          let pt = getViewboxPoint(chart, event);
          let proximity = pt.y % lineSpacing;
          let threshold = lineSpacing * 0.2;
          if (proximity < threshold) {
            let lineY = pt.y - (pt.y % lineSpacing);
            selectLine(lineY);
          } else if (Math.abs(proximity - lineSpacing) < threshold) {
            let lineY = pt.y + (Math.abs(proximity - lineSpacing));
            selectLine(lineY);
          } else {
            selectColumn(column);
          }
        });
        chart.appendChild(polygon)
      });

      for (let y = 0; y <= viewboxHeight; y += lineSpacing) {
        let line = document.createElementNS(SVG_NS, 'line');
        line.id = 'hohChestContentsLine_' + y;
        line.setAttribute('x1', 0);
        line.setAttribute('y1', y);
        line.setAttribute('x2', viewboxWidth);
        line.setAttribute('y2', y);
        chart.appendChild(line);
      }

      let target = document.getElementById(hohChestDistributionChartId);
      target.appendChild(chart);

      let legendContainer = document.getElementById(hohChestDistributionLegendId);
      let legend = document.createElement('div');
      legend.classList.add('clearfix');
      columns.forEach(column => {
        let entry = document.createElement('div');
        entry.classList.add('chartLegendEntry');
        let icon = document.createElement('span');
        icon.style.color = column.fillColour;
        icon.textContent = '■';
        entry.appendChild(icon);
        let label = document.createElement('span');
        label.textContent = column.name;
        entry.appendChild(label);
        entry.addEventListener('click', event => {
          selectColumn(column);
        });
        legend.appendChild(entry);
      });
      legendContainer.appendChild(legend);

      let floorSelect = document.createElement('select');
      floorSelect.id = hohChestDistributionFloorSelect;
      floorSelect.style.marginTop = '8px';
      floorSelect.appendChild(makeOption(-1, 'Select floors'));
      data.forEach((floorset, index) => {
        floorSelect.appendChild(makeOption(index, `Floors ${floorset.startFloor}-${floorset.endFloor}`));
      });
      floorSelect.addEventListener('change', event => {
        if (event.target.value >= 0) {
          let lineY = event.target.value * lineSpacing;
          selectLine(lineY);
        }
      });
      legendContainer.appendChild(floorSelect);
    }
  };

  function makeOption(value, label) {
    let option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    return option;
  }

  function makeHohChestDistributionColumns() {
    return [{
      name: 'Safety',
      key: 'safety',
      chestType: 'gold',
      fillColour: '#7A0000',
      points: []
    }, {
      name: 'Sight',
      key: 'sight',
      chestType: 'gold',
      fillColour: '#F96C00',
      points: []
    }, {
      name: 'Strength',
      key: 'strength',
      chestType: 'gold',
      fillColour: '#8C0F00',
      points: []
    }, {
      name: 'Steel',
      key: 'steel',
      chestType: 'gold',
      fillColour: '#FA7E08',
      points: []
    }, {
      name: 'Affluence',
      key: 'affluence',
      chestType: 'gold',
      fillColour: '#9E1F00',
      points: []
    }, {
      name: 'Flight',
      key: 'flight',
      chestType: 'gold',
      fillColour: '#FB900F',
      points: []
    }, {
      name: 'Alteration',
      key: 'alteration',
      chestType: 'gold',
      fillColour: '#B02E00',
      points: []
    }, {
      name: 'Purity',
      key: 'purity',
      chestType: 'gold',
      fillColour: '#FCA217',
      points: []
    }, {
      name: 'Fortune',
      key: 'fortune',
      chestType: 'gold',
      fillColour: '#C33E00',
      points: []
    }, {
      name: 'Witching',
      key: 'witching',
      chestType: 'gold',
      fillColour: '#FCB51E',
      points: []
    }, {
      name: 'Serenity',
      key: 'serenity',
      chestType: 'gold',
      fillColour: '#D54D00',
      points: []
    }, {
      name: 'Intuition',
      key: 'intuition',
      chestType: 'gold',
      fillColour: '#FDC726',
      points: []
    }, {
      name: 'Raising',
      key: 'raising',
      chestType: 'gold',
      fillColour: '#E75D00',
      points: []
    }, {
      name: 'Frailty',
      key: 'frailty',
      chestType: 'gold',
      fillColour: '#FED92D',
      points: []
    }, {
      name: 'Concealment',
      key: 'concealment',
      chestType: 'gold',
      fillColour: '#F96C00',
      points: []
    }, {
      name: 'Petrification',
      key: 'petrification',
      chestType: 'gold',
      fillColour: '#FFEB35',
      points: []
    }, {
      name: 'Gold Mimic',
      key: 'gold_mimic',
      chestType: 'gold',
      fillColour: '#D2007F',
      points: []
    }, {
      name: 'Aetherpool Upgrade',
      key: 'aetherpool',
      chestType: 'silver',
      fillColour: '#00579A',
      points: []
    }, {
      name: 'Exploding Chest',
      key: 'trap',
      chestType: 'silver',
      fillColour: '#011176',
      points: []
    }, {
      name: 'Magicite',
      key: 'magicite',
      chestType: 'silver',
      fillColour: '#0191FF',
      points: []
    }, {
      name: 'Silver Mimic',
      key: 'silver_mimic',
      chestType: 'silver',
      fillColour: '#D2007F',
      points: []
    }, {
      name: 'Potion',
      key: 'potion',
      chestType: 'bronze',
      fillColour: '#7D1800',
      points: []
    }, {
      name: 'Phoenix Down',
      key: 'phoenix_down',
      chestType: 'bronze',
      fillColour: '#AA4F39',
      points: []
    }, {
      name: 'Potsherd',
      key: 'potsherd',
      chestType: 'bronze',
      fillColour: '#5E1200',
      points: []
    }, {
      name: 'Bronze Mimic',
      key: 'bronze_mimic',
      chestType: 'bronze',
      fillColour: '#D2007F',
      points: []
    }];
  }

  function coords(x, y) {
    return x + ',' + y;
  }

  function getViewboxPoint(svg, event) {
    let pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function makeItemDropsByFloorTable(titleId, tableId, column, data) {
    let title = document.getElementById(titleId);
    title.textContent = `${column.name} Finds by Floor`;

    let table = document.getElementById(tableId);
    clearTable(table);
    
    const chestTypeLabel = capitalize(column.chestType);
    const contentsLabel = column.name.endsWith('Mimic') ? 'Mimic' : column.name;
    const headings = [
      'Floors',
      '% Chests ' + chestTypeLabel,
      `% Within ${chestTypeLabel}`,
      `% Within All`
    ];
    table.appendChild(makeThead(headings));
    
    rows = []
    for (let floorset of data) {
      const percentChestType = parseFloat(floorset['percent_' + column.chestType]);
      const percentInChestType = floorset['total_' + column.chestType] == 0 ? 0
          : floorset[column.key] / floorset['total_' + column.chestType] * 100;
      const percentInAll = percentInChestType * percentChestType / 100;
      rows.push([
        `${floorset.startFloor}-${floorset.endFloor}`,
        percentChestType.toFixed(2),
        percentInChestType.toFixed(2),
        percentInAll.toFixed(2)
      ]);
    }
    table.appendChild(makeTbody(rows));
    title.scrollIntoView({block: 'center'});
  }

  function makeFloorsetDropsTable(titleId, tableId, columns, floorset) {
    let title = document.getElementById(titleId);
    title.textContent = `Floors ${floorset.startFloor}-${floorset.endFloor} Chest Contents`;

    let table = document.getElementById(tableId);
    clearTable(table);

    const headings = [
      'Contents',
      'Chest Type',
      '% Chests Chest Type',
      '% Within Chest Type',
      '% Within All'
    ];
    table.appendChild(makeThead(headings));

    let rows = [];
    for (let column of columns) {
      const percentChestType = parseFloat(floorset['percent_' + column.chestType]);
      const percentInChestType = floorset['total_' + column.chestType] == 0 ? 0
          : floorset[column.key] / floorset['total_' + column.chestType] * 100;
      const percentInAll = percentInChestType * percentChestType / 100;
      rows.push([
        column.name,
        capitalize(column.chestType),
        percentChestType.toFixed(2),
        percentInChestType.toFixed(2),
        percentInAll.toFixed(2)
      ]);
    }

    table.appendChild(makeTbody(rows));
    title.scrollIntoView({block: 'center'});
  }

  function clearTable(table) {
    while (table.lastChild) {
      table.removeChild(table.lastChild);
    }
  }

  function makeThead(headings) {
    let thead = document.createElement('thead');
    let headRow = document.createElement('tr');
    for (let heading of headings) {
      let th = document.createElement('th');
      th.textContent = heading;
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    return thead;
  }

  function makeTbody(rowData) {
    let tbody = document.createElement('tbody');
    for (let row of rowData) {
      let tr = document.createElement('tr');
        for (let value of row) {
          let td = document.createElement('td');
          td.textContent = value;
          tr.appendChild(td);
        }
      tbody.appendChild(tr);
    }
    return tbody
  }

  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

})();