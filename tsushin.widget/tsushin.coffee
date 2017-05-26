# Tsushin widget for ubersicht
# network throughput in kB
# Heavily inspired by Dion Munk's work network-throughput http://tracesof.net/uebersicht-widgets/#ubersicht-network-throughput
# please note it assumes that .bash_profile exists in current user's home directory

command: """
if [ ! -e tsushin.sh ]; then
  "$PWD/tsushin.widget/tsushin.sh"
else
  "$PWD/tsushin.sh"
fi
"""

# The refresh frequency in milliseconds
refreshFrequency: 2000

# Render gets called after the shell command has executed. The command's output
# is passed in as a string. Whatever it returns will get rendered as HTML.
#
# Change container size to change the sizing of the chart
render: (domEl) -> """
<script src="https://code.highcharts.com/stock/highstock.js"></script>  
<div id="container" style="width:400px; height:250px;">Loading ...</div>
"""
  
afterRender: (domEl) ->
    Highcharts.setOptions({
    global: {
      useUTC: false # UTC is set by default, disabling it triggers highcharts to pick up browser's local time
    }
  })
  
  $(domEl).find('#container').highcharts('StockChart'
    colors: ['#6fc3df', '#6fc3df']
    chart:   
      marginRight: 5
      #marginBottom: 20
      animation: Highcharts.svg
         
      backgroundColor: null
      style:
        color: '#6fc3df'
        fontFamily:'hack, Andale Mono, Menlo, Monaco, Courier, Helvetica Neue, Osaka'
        fontSize: '12px'
    navigator:
      enabled: false
    rangeSelector:
      enabled:false
      buttons:
        [{
        count: 5
        type: 'minute'
        text: '5M',
        },{
        connt: 10
        type: 'minute'
        text: '10M'
        },{
        type: 'all'
        text: 'All'
        }
        ]
      enabled: false
      inputEnabled: false
      selected:0
      #inputEnabled: false
      #buttonTheme: visibility: 'hidden'
      #labelStyle: visibility: 'hidden'
      
    scrollbar:
      enabled:false

    title:
      #text: 'Network througput (bytes)'
      enabled: false
      style:
        color: '#6fc3df'
        fontSize: '11px'
        fontFamily:'hack, Courier, Helvetica Neue, Osaka, Monaco, Menlo'
    xAxis:
      type: 'datetime'
      #minTickInterval: 10
      #min: 90
      tickPixelInterval: 100
      minRange: 15 * 24
      labels:
        enabled: true
        style: color: '#6fc3df'
      gridLineColor: null
      lineWidth: 0
      minorGridLineWidth: 0
      minorTickLenght: 0
      tickLength: 0
      xlineColor: 'transparent'

    yAxis:
      title:
        text: null
        style: color: '#6fc3df'
      plotLines:[{
        value: 0
        width: 0.5
        color: '#6fc3df'
      }]
      labels:
        style: color: '#6fc3df'
      gridLineColor: null
    legend:
      enabled: true
      verticalAlign: 'top'
     # align: 'top'
      floating: true
      
    series: [ {
      name: 'Down (kB)'
      lineWidth: 1
      data: []
      },
      {
       name: "Up (kB)"
       lineWidth:1
       color:"#ffe64d"
       data:[]
        }]
      
    credits:
      enabled: false
)

update:(output,domEl) ->
  #How to dynamically update data for highcharts/stock
  #http://stackoverflow.com/questions/16061032/highcharts-series-data-array   #http://stackoverflow.com/questions/13049977/how-can-i-get-access-to-a-highcharts-chart-through-a-dom-container
  #http://api.highcharts.com/highstock/Series.addPoint()
  @run '''
    if [ ! -e tsushin.sh ]; then
      "$PWD/tsushin.widget/tsushin.sh"
    else
      "$PWD/tsushin.sh"
    fi
   ''', (err, output) ->
      data=output.split(" ");
      dataIn = parseFloat(data[0]);
      dataOut = parseFloat(data[1]);
      chart=$(domEl).find("#container").highcharts();
      #i=-99;
      time= (new Date).getTime();
      #timeData = time + i * 10000;
      chart.series[0].addPoint([time, dataIn], true);
      chart.series[1].addPoint([time, dataOut], true);

# the CSS style for this widget, written using Stylus
# (http://learnboost.github.io/stylus/)
style: """
  @font-face
    font-family: 'hack'
    src: url('assets/hack.ttf')
  color:#6fc3df
  font-family: hack, Andale Mono, Menlo, Monaco, Courier, Helvetica Neue, Osaka
  font-weight: 100
  top: 63%
  left: 30%
  text-shadow: 0 0 1px rgba(#000, 0.5)
  font-size: 12px
  white-space: pre
  #container
    -webkit-backdrop-filter: blur(10px)
"""

