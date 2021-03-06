var _ = {
  filter: require('lodash/filter'),
  map: require('lodash/map'),
  find: require('lodash/find'),
  compact: require('lodash/compact')
}

var React = require('react')
var DataFrame = require('dataframe')
var Emitter = require('wildemitter')

var partial = require('./lib/partial')
var download = require('./lib/download')
var getValue = require('./lib/get-value')
var PivotTable = require('./lib/pivot-table.jsx')
var Dimensions = require('./lib/dimensions.jsx')
var ColumnControl = require('./lib/column-control.jsx')

module.exports = React.createClass({
  displayName: 'ReactPivot',
  getDefaultProps: function() {
    return {
      rows: [],
      dimensions: [],
      activeDimensions: [],
      reduce: function() {},
      tableClassName: '',
      csvDownloadFileName: 'table.csv',
      csvTemplateFormat: false,
      defaultStyles: true,
      nPaginateRows: 25,
      solo: null,
      hiddenColumns: [],
      sortBy: null,
      sortDir: 'asc',
      eventBus: new Emitter,
      compact: false,
      excludeSummaryFromExport: false,
      onData: function () {},
      onDimensionChange: function () {}
    }
  },

  getInitialState: function() {
    var allDimensions = this.props.dimensions
    var activeDimensions =  _.filter(this.props.activeDimensions, function (title) {
      return _.find(allDimensions, function(col) {
        return col.title === title
      })
    })

    return {
      dimensions: activeDimensions,
      calculations: {},
      sortBy: this.props.sortBy,
      sortDir: this.props.sortDir,
      hiddenColumns: this.props.hiddenColumns,
      solo: this.props.solo,
      rows: []
    }
  },

  componentWillMount: function() {
    if (this.props.defaultStyles) loadStyles()

    this.dataFrame = DataFrame({
      rows: this.props.rows,
      dimensions: this.props.dimensions,
      reduce: this.props.reduce
    })

    this.updateRows()
  },

  componentWillReceiveProps: function(newProps) {
     if(newProps.hiddenColumns !== this.props.hiddenColumns) {
         this.setHiddenColumns(newProps.hiddenColumns);
     }

    if(newProps.rows !== this.props.rows) {
      this.dataFrame = DataFrame({
        rows: newProps.rows,
        dimensions: this.props.dimensions,
        reduce: this.props.reduce
      })

      this.updateRows()
    }
  },

  getColumns: function() {
    var self = this
    var columns = []

    this.state.dimensions.forEach(function(title) {
      var d =  _.find(self.props.dimensions, function(col) {
        return col.title === title
      })

      columns.push({
        type: 'dimension', title: d.title, value: d.value,
        className: d.className, template: d.template
      })
    })

    this.props.calculations.forEach(function(c) {
      if (self.state.hiddenColumns.indexOf(c.title) >= 0) return

      columns.push({
        type:'calculation', title: c.title, template: c.template,
        value: c.value, className: c.className
      })
    })

    return columns
  },
  searchChange: function(e){
    console.log(e.target.value);
    this.setState({
      searchValue: e.target.value
    });
  },
  render: function() {
    var self=this;
    var html = (
      <div className='reactPivot'>

      <div  className="reactPivot-filterSelection">
        { this.props.hideDimensionFilter ? '' :
          <Dimensions
            dimensions={this.props.dimensions}
            selectedDimensions={this.state.dimensions}
            onChange={this.setDimensions}
            onDimensionChange={this.props.onDimensionChange} />
        }
        <div className="reactPivot-search"> Search: <input type="text" id="search" placeholder="Select a dimension to search" disabled="disabled" onChange={this.searchChange }/></div>
        <ColumnControl
          hiddenColumns={this.state.hiddenColumns}
          onChange={this.setHiddenColumns} />
      </div>

        <div className="reactPivot-csvExport">
          <button onClick={partial(this.downloadCSV, this.state.rows)}>
            Export CSV
          </button>
        </div>

        <div className="reactPivot-clearboth"></div>

        { !this.state.solo ? '' :
          <div style={{clear: 'both'}} className='reactPivot-soloDisplay'>
            <span className='reactPivot-clearSolo' onClick={this.clearSolo}>
              &times;
            </span>
            {this.state.solo.title}: {this.state.solo.value}
          </div>
        }

        <PivotTable
          columns={this.getColumns()}
          rows={this.state.rows}
          searchValue={this.state.searchValue}
          sortBy={this.state.sortBy}
          sortDir={this.state.sortDir}
          onSort={this.setSort}
          onColumnHide={this.hideColumn}
          onDimensionColumnHide={this.hideDimensionColumn}
          nPaginateRows={this.props.nPaginateRows}
          selectedDimensions={this.state.dimensions}
          onSolo={this.setSolo} />

      </div>
    )

    return html
  },

  updateRows: function () {
    var columns = this.getColumns()

    var sortByTitle = this.state.sortBy
    var sortCol = _.find(columns, function(col) {
      return col.title === sortByTitle
    }) || {}
    var sortBy = sortCol.type === 'dimension' ? sortCol.title : sortCol.value
    var sortDir = this.state.sortDir

    var calcOpts = {
      dimensions: this.state.dimensions,
      sortBy: sortBy,
      sortDir: sortDir,
      compact: this.props.compact
    }

    var filter = this.state.solo
    if (filter) {
      calcOpts.filter = function(dVals) {
        return dVals[filter.title] === filter.value
      }
    }

    var rows = this.dataFrame.calculate(calcOpts)
    this.setState({rows: rows})
    this.props.onData(rows)
  },

  setDimensions: function (updatedDimensions) {
    this.props.eventBus.emit('activeDimensions', updatedDimensions)
    this.setState({dimensions: updatedDimensions})
    setTimeout(this.updateRows, 0)
  },

  setHiddenColumns: function (hidden) {
    this.props.eventBus.emit('hiddenColumns', hidden)
    this.setState({hiddenColumns: hidden})
    setTimeout(this.updateRows, 0)
  },

  setSort: function(cTitle) {
    var sortBy = this.state.sortBy
    var sortDir = this.state.sortDir
    if (sortBy === cTitle) {
      sortDir = (sortDir === 'asc') ? 'desc' : 'asc'
    } else {
      sortBy = cTitle
      sortDir = 'asc'
    }

    this.props.eventBus.emit('sortBy', sortBy)
    this.props.eventBus.emit('sortDir', sortDir)
    this.setState({sortBy: sortBy, sortDir: sortDir})
    setTimeout(this.updateRows, 0)
  },

  setSolo: function(solo) {
    this.props.eventBus.emit('solo', solo)
    this.setState({solo: solo })
    setTimeout(this.updateRows, 0)
  },

  clearSolo: function() {
    this.props.eventBus.emit('solo', null)
    this.setState({solo: null})
    setTimeout(this.updateRows, 0)
  },

  hideColumn: function(cTitle) {
    var hidden = this.state.hiddenColumns.concat([cTitle])
    this.setHiddenColumns(hidden)
    setTimeout(this.updateRows, 0)
  },

  hideDimensionColumn: function (c_title) {
    const dimension = c_title;
    var search = document.getElementById("search");
    if(search){
      search.placeholder="Select a dimension to search";
      search.disabled="disabled";
    }
    let  dimensions = this.state.dimensions;
    const curIdx = dimensions.indexOf(dimension);

    if (curIdx >= 0) dimensions[curIdx] = null; // Removing the selected dimension.

    const updatedDimensions = _.compact(dimensions);

    this.setDimensions(updatedDimensions)
    this.props.onDimensionChange({event: this, selectedDimensions: updatedDimensions})
    setTimeout(this.updateRows, 0)
  },

  downloadCSV: function(rows) {
    var self = this

    var columns = this.getColumns()

    var csv = _.map(columns, 'title')
      .map(JSON.stringify.bind(JSON))
      .join(',') + '\n'

    var maxLevel = this.state.dimensions.length - 1
    var excludeSummary = this.props.excludeSummaryFromExport

    rows.forEach(function(row) {
      if (excludeSummary && (row._level < maxLevel)) return

      var vals = columns.map(function(col) {

        if (col.type === 'dimension') {
          var val = row[col.title]
        } else {
          var val = getValue(col, row)
        }

        if (col.template && self.props.csvTemplateFormat) {
          val = col.template(val)
        }

        return JSON.stringify(val)
      })
      csv += vals.join(',') + '\n'
    })

    download(csv, this.props.csvDownloadFileName, 'text/csv')
  }
})

function loadStyles () { require('./style.css') }
