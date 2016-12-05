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
<div id="container" style="width:200px; height:35px;">Loading ...</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js"></script>
"""
  
afterRender: (domEl) ->
  
  $(domEl).find('#container').highcharts('StockChart'
    colors: ['#7eFFFF', '#7eFFFF']
    chart:   
      marginRight: 1
      marginTop: 0
      marginBottom: 0
      animation: Highcharts.svg
         
      backgroundColor: null
      style:
        color: '#7eFFFF'
        fontFamily:'hack,  Monaco, Melno, Courier, Helvetica Neue, Osaka'
        fontSize: '5px'
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
        color: '#7eFFFF'
        fontSize: '5px'
        fontFamily:'hack, Courier, Helvetica Neue, Osaka, Monaco, Melno'
    xAxis:
      type: 'datetime'
      minTickInterval: 1
      #min: 0
      tickPixelInterval: 1
      minRange: 10
      labels:
        enabled: false
        style: color: '#7eFFFF'
      gridLineColor: null
      lineWidth: 0.5
      minorGridLineWidth: 0
      minorTickLenght: 0.5
      tickLength: 0
      xlineColor: 'transparent'

    yAxis:
      title:
        text: null
        style: color: '#7eFFFF'    
      #min: 0
      #softMin: 10
      plotLines:[{
        value: 0
        width: 0.4
        color: '#7eFFFF'
      }]
      
      labels:
        enabled: false
        color: '#7eFFFF'
        fontSize:'5px'                
        padding: 1
        stackLabels: true
        reserveSpace: false
        
      gridLineColor: null

    legend:
      enabled: false
      verticalAlign: 'top'
     # align: 'top'
      floating: true
      y: 2
    series: [ {
      name: 'Down (kB)'
      lineWidth: 0.5
      color: '#7eFFFF'
      data: []
      },
      {
       name: "Up (kB)"
       lineWidth: 0.5
       color:"#ffff00"
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
      console.log(dataIn)
      console.log(dataOut)
      chart=$(domEl).find("#container").highcharts();
      #i=-99;
      time= (new Date).getTime();
      #timeData = time + i * 10000;
      chart.series[0].addPoint([time, dataIn], true);
      chart.series[1].addPoint([time, dataOut], true);

      console.log(err)
# the CSS style for this widget, written using Stylus
# (http://learnboost.github.io/stylus/)
style: """
  @font-face
    font-family: 'hack'
    src: url('assets/hack.ttf')
  // https://css-tricks.com/snippets/css/using-font-face/
  // how to use font available in directory

  color: #7eFFFF
  font-family: hack, Courier, Helvetica Neue, Osaka, Monaco, Melno
  font-weight: 100
  top: 90%
  left: 40%
  text-shadow: 0 0 1px rgba(#000, 0.5)
  font-size: 5px
  white-space: pre
  #container
    -webkit-backdrop-filter: blur(10px)
"""

