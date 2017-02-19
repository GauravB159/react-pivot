var _ = { compact: require('lodash/compact') }
var React = require('react')
var partial = require('./partial')

var arrayDifference = function (a, b) {
  return a.filter(function(i) {return b.indexOf(i.title) < 0;});
}

module.exports = React.createClass({
  getDefaultProps: function () {
    return {
      dimensions: [],
      selectedDimensions: [],
      onChange: function () {},
      onDimensionChange: function () {}
    }
  },

  render: function () {
    var self = this
    var selectedDimensions = this.props.selectedDimensions
    var nSelected = selectedDimensions.length
    var dimensionsToBeRendered = arrayDifference(self.props.dimensions, selectedDimensions)

    return (
      <div className="reactPivot-dimensions">
        {selectedDimensions.map(this.renderDimension)}

        {dimensionsToBeRendered.length > 0 &&
          <select value={''} onChange={partial(self.toggleDimension, nSelected)}>
            <option value={''}>Sub Dimension...</option>
            {dimensionsToBeRendered.map(function(dimension) {
              return <option key={dimension.title}>{dimension.title}</option>
            })}
          </select>
        }
      </div>
    )
  },

  renderDimension: function(selectedDimension, i) {
    return (
      <select
        value={selectedDimension}
        onChange={partial(this.toggleDimension, i)}
        key={selectedDimension} >
        <option value="">X Clear Selection</option>
        {this.props.dimensions.map(function(dimension) {
          return (
            <option
              value={dimension.title}
              key={dimension.title} >
              {dimension.title}
            </option>
          )
        })}
      </select>
    )
  },

  toggleDimension: function (iDimension, evt) {
    var dimension = evt.target.value
    var dimensions = this.props.selectedDimensions

    var curIdx = dimensions.indexOf(dimension)
    if (curIdx >= 0) dimensions[curIdx] = null
    dimensions[iDimension] = dimension

    var updatedDimensions = _.compact(dimensions)

    this.props.onChange(updatedDimensions)
    this.props.onDimensionChange({event: evt, selectedDimensions: dimensions})
  },
})
