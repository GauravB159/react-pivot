var _ = { range: require('lodash/range') }
var React = require('react')
var partial = require('./partial')
var getValue = require('./get-value')

module.exports = React.createClass({
  getDefaultProps: function () {
    return {
      columns: [],
      rows: [],
      sortBy: null,
      sortDir: 'asc',
      selectedDimensions: [],
      onSort: function () {},
      onSolo: function () {},
      onColumnHide: function () {},
      onDimensionColumnHide: function () {}
    }
  },

  getInitialState: function () {
    return {
      paginatePage: 0
    }
  },

  render: function() {
    var results = JSON.parse(JSON.stringify(this.props.rows));
    var self = this;
    results = results.filter(function(result){
      if(self.state.searchDimension === undefined || self.props.searchValue === "" || self.props.searchValue === undefined)
        return true;
      if(result[self.state.searchDimension] === undefined)
        return false;
      var lcheck=result[self.state.searchDimension].toLowerCase();
      var rcheck=self.props.searchValue.toLowerCase();
      return (lcheck.indexOf(rcheck) >= 0 );
     });
    var paginatedResults = this.paginate(results)

    var tBody = this.renderTableBody(this.props.columns, paginatedResults.rows)
    var tHead = this.renderTableHead(this.props.columns)
    return (
      <div>
        <div className='reactPivot-results'>
          <table className={this.props.tableClassName}>
            {tHead}
            {tBody}
          </table>
        </div>
        {this.renderPagination(paginatedResults)}
      </div>
    )
  },
  handleSearchClick: function(col){
    this.setState({
      searchDimension:col.title
    });
    var search = document.getElementById("search");
    search.placeholder="Search by " + col.title;
  },
  renderTableHead: function(columns) {
    var self = this
    var sortBy = this.props.sortBy
    var sortDir =  this.props.sortDir
    const selected_dimensions = this.props.selectedDimensions;
    return (
      <thead>
        <tr>
          { columns.map(function(col) {
            var className = col.className
            if (col.title === sortBy) className += ' ' + sortDir

            var hide = ''
            if (col.type === 'calculation') {
              hide = (
                <span className='reactPivot-hideColumn'
                      onClick={partial(self.props.onColumnHide, col.title)}>
                  &times;
                </span>
              )
            } else {
              hide = (
                <span className='reactPivot-hideColumn'
                      onClick={partial(self.props.onDimensionColumnHide, col.title, selected_dimensions.indexOf(col.title))}>
                  &times;
                </span>
              )
            }
            return (
              <th className={className}
                  onClick={partial(self.props.onSort, col.title)}
                  style={{cursor: 'pointer'}}
                  key={col.title}>

                {hide}
                {col.title}
                {col.type === "dimension" && <span onClick={function(){ self.handleSearchClick(col) } }>S</span> }
              </th>
            )
          })}
        </tr>
      </thead>
    )
  },

  renderTableBody: function(columns, rows) {
    var self = this
    rows.forEach(function(row){
      console.log(row);
    });
    return (
      <tbody>
        {rows.map(function(row) {
          return (
            <tr key={row._key} className={"reactPivot-level-" + row._level}>
              {columns.map(function(col, i) {
                //if (i < row._level) return <td key={i} className='reactPivot-indent' />
                return self.renderCell(col, row)
              })}
            </tr>
          )

        })}
      </tbody>
    )
  },

  renderCell: function(col, row) {
    var val,
      text,
      dimensionExists,
      title_val;
    if (col.type === 'dimension') {
      val = row[col.title];
      text = val;
      dimensionExists = (typeof val) !== 'undefined';
      title_val = `${col.title}: ${text}`;

      if (col.template && dimensionExists) {
        text = col.template(val, row);
      }

    } else {
      val = getValue(col, row);
      text = val;
      if (col.template) text = col.template(val, row)
    }

    if (dimensionExists) {
      var solo = (
        <span className='reactPivot-solo'>
          <a style={{cursor: 'pointer'}}
             onClick={partial(this.props.onSolo, {
                title: col.title,
                value: val
              })}>solo</a>
        </span>
      )
    }
    return(
      <td className={col.className}
          key={[col.title, row.key].join('\xff')}
          title={title_val ? title_val : col.title }>
        <span dangerouslySetInnerHTML={{__html: text || ''}}></span> {solo}
      </td>
    )
  },

  renderPagination: function(pagination) {
    var self = this
    var nPaginatePages = pagination.nPages
    var paginatePage = pagination.curPage

    if (nPaginatePages === 1) return ''

    return (
      <div className='reactPivot-paginate'>
        {_.range(0, nPaginatePages).map(function(n) {
          var c = 'reactPivot-pageNumber'
          if (n === paginatePage) c += ' is-selected'
          return (
            <span className={c} key={n}>
              <a onClick={partial(self.setPaginatePage, n)}>{n+1}</a>
            </span>
          )
        })}
      </div>
    )
  },

  paginate: function(results) {
    if (results.length <= 0) return {rows: results, nPages: 1, curPage: 0}

    var paginatePage = this.state.paginatePage
    var nPaginateRows = this.props.nPaginateRows
    if (!nPaginateRows || !isFinite(nPaginateRows)) nPaginateRows = results.length

    var nPaginatePages = Math.ceil(results.length / nPaginateRows)
    if (paginatePage >= nPaginatePages) paginatePage = nPaginatePages - 1

    var iBoundaryRow = paginatePage * nPaginateRows

    var boundaryLevel = results[iBoundaryRow]._level
    var parentRows = []
    if (boundaryLevel > 0) {
      for (var i = iBoundaryRow-1; i >= 0; i--) {
        if (results[i]._level < boundaryLevel) {
          parentRows.unshift(results[i])
          boundaryLevel = results[i]._level
        }
        if (results[i._level === 9]) break
      }
    }

    var iEnd = iBoundaryRow + nPaginateRows
    var rows = parentRows.concat(results.slice(iBoundaryRow, iEnd))

    return {rows: rows, nPages: nPaginatePages, curPage: paginatePage}
  },

  setPaginatePage: function(nPage) {
    this.setState({paginatePage: nPage})
  }
})

