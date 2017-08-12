require('./demo.css')

var React = require('react')
var ReactDOM = require('react-dom')
var ReactPivot = require('..')

var gh = require('./gh.jsx')
var data = require('./data.json')

var dimensions = [
  {value: 'fellow', title: 'Fellow' , className: 'deminsion'},
  {value: 'project_name', title: 'Project' , className: 'deminsion'},
  {value: 'partner_name', title: 'Partner' , className: 'deminsion'},
  {value: 'event_name', title: 'Event Name' , className: 'deminsion'},
  {value: 'impact_type', title: 'Impact Type' , className: 'deminsion'},
  {value: 'impact_type_genre', title: 'Impact Type Genre' , className: 'deminsion'},
  {value: 'asset', title: 'Digital Asset' , className: 'deminsion'},
  {value: 'post_type', title: 'Post Type' , className: 'deminsion'}
];

var reduce = function(row, memo) {
    switch (row.genre) {
    case "facebook":
      switch (row.metric_type) {
        case "likes":
          memo.fbLikes = (memo.fbLikes || 0) + parseFloat(row.value)
          break;
        case "shares":
          memo.fbShares = (memo.fbShares || 0) + parseFloat(row.value)
          break;
        case "comments":
          memo.fbComments = (memo.fbComments || 0) + parseFloat(row.value)
          break;
      }
      break;
    case "google":
      memo.googleShares = (memo.googleShares || 0) + parseFloat(row.value)
      break;
    case "impact_monitor":
      switch(row.metric_type) {
        case "estimated_views":
          memo.imEstimatedViews = (memo.imEstimatedViews || 0) + parseFloat(row.value);
          break;
      }
      break;
    case "twitter":
      switch(row.metric_type) {
        case "mentions":
          memo.twMentions = (memo.twMentions || 0) + parseFloat(row.value)
          break;
        case "retweets":
          memo.twRetweets = (memo.twRetweets || 0) + parseFloat(row.value)
          break;
      }
      break;
  }
  return memo;
};

var genreic_template = function (val, row) {
  if(val === undefined) {
    return "<span class='text-muted'> — <span>";
  } else {
    var v = val.toFixed(2);
    return v === "0.00" ? "<span class='text-muted'>" +v+ "<span>" : v;

  }
}

var calculations = [
  {
    title: 'FB Likes', value: 'fbLikes',
    template: genreic_template,
    className: 'matric'
  },
  {
    title: 'FB Shares', value: 'fbShares',
    template: genreic_template,
    className: 'matric'
  },
  {
    title: 'FB Comments', value: 'fbComments',
    template: genreic_template,
    className: 'matric'
  },
  {
    title: 'TW Mentions', value: 'twMentions',
    template: genreic_template,
    className: 'matric'
  },
  {
    title: 'TW Retweets', value: 'twRetweets',
    template: genreic_template,
    className: 'matric'
  },
  {
    title: 'G+ Shares', value: 'googleShares',
    template: genreic_template,
    className: 'matric'
  },
  {
    title: 'Estimated View', value: 'imEstimatedViews',
    template: genreic_template,
    className: 'matric'
  }
];


// var onDimensionChange = function (e) {
//   $.ajax({
//     url: location.origin + "/user/set_selected_dimensions",
//     type:'post',
//     data: {
//       id: user_id,
//       selected_dimensions: e.selectedDimensions.join(",")
//     },
//     success: function(response) {
//       if (response.success) {
//         console.log("Successfully updated users selected dimensions.");
//       } else {
//         console.error("Failed updated users selected dimensions.");
//       }
//     },
//     error: function(response) {
//       console.error("Failed updated users selected dimensions.");
//     }
// });
// }

var Demo = React.createClass({
  getInitialState: function() {
    return {showInput: false}
  },
  toggleShow: function() {
    var showInput = this.state.showInput
    this.setState({showInput: !showInput})
  },
  render: function() {
    return (
      <div className='demo'>
        <h1>ReactPivot</h1>

        <p>
          ReactPivot is a data-grid component with pivot-table-like functionality.
        </p>

        <p>
          Muggles will love you.
        </p>

        <p>
          <a href='https://github.com/davidguttman/react-pivot'>
            View project and docs on Github
          </a>
        </p>

        <div className={this.state.showInput ? 'hide' : ''}>
          <ReactPivot rows={data}
                      dimensions={dimensions}
                      calculations={calculations}
                      reduce={reduce}
                      activeDimensions={['Transaction Type']}
                      nPaginateRows={20} />
        </div>

        <div className={this.state.showInput ? '' : 'hide'}>
          <textarea
            value={JSON.stringify(data, null, 2)}
            readOnly={true} />
        </div>

        <p>
          <a className={this.state.showInput ? '' : 'strong'}
             onClick={this.toggleShow}>Grid View</a>
          {' | '}
          <a className={this.state.showInput ? 'strong' : ''}
             onClick={this.toggleShow}>Input Data</a>
        </p>

        {gh}
      </div>
    )
  }
})

var el = document.createElement('div')
document.body.appendChild(el)

ReactDOM.render(
  <Demo />,
  el
)
